import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { GoogleTokenStore } from "./types";
import { setGoogleCalendarStatus } from "./demo-store";

const COOKIE_NAME = "pagate_gcal";
const FILE_TOKEN_PATH = path.join(
  process.env.VERCEL || process.env.DATA_DIR
    ? path.join(process.env.DATA_DIR || "/tmp", "pagate-data")
    : path.join(process.cwd(), "data"),
  "google-tokens.json",
);

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function getRedirectUri(): string {
  return (
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    `${process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000"}/api/google/callback`
  );
}

export function getGoogleAuthUrl(): string {
  if (!isGoogleConfigured()) {
    throw new Error(
      "Faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env.local",
    );
  }
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function ensureDataDir() {
  await fs.mkdir(path.dirname(FILE_TOKEN_PATH), { recursive: true });
}

async function readTokensFromCookie(): Promise<GoogleTokenStore | null> {
  try {
    const jar = await cookies();
    const raw = jar.get(COOKIE_NAME)?.value;
    if (!raw) return null;
    const json = Buffer.from(raw, "base64url").toString("utf8");
    return JSON.parse(json) as GoogleTokenStore;
  } catch {
    return null;
  }
}

async function writeTokensToCookie(tokens: GoogleTokenStore): Promise<boolean> {
  try {
    const jar = await cookies();
    const value = Buffer.from(JSON.stringify(tokens), "utf8").toString("base64url");
    jar.set({
      name: COOKIE_NAME,
      value,
      httpOnly: true,
      secure: process.env.VERCEL === "1" || process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
    });
    return true;
  } catch {
    // En Server Components no se puede setear cookie; se ignora.
    return false;
  }
}

async function clearTokensCookie(): Promise<void> {
  try {
    const jar = await cookies();
    jar.delete(COOKIE_NAME);
  } catch {
    // ignore
  }
}

export async function readGoogleTokens(): Promise<GoogleTokenStore | null> {
  const fromCookie = await readTokensFromCookie();
  if (fromCookie?.refresh_token || fromCookie?.access_token) {
    return fromCookie;
  }

  try {
    const raw = await fs.readFile(FILE_TOKEN_PATH, "utf8");
    return JSON.parse(raw) as GoogleTokenStore;
  } catch {
    return null;
  }
}

export async function writeGoogleTokens(tokens: GoogleTokenStore): Promise<void> {
  await writeTokensToCookie(tokens);
  try {
    await ensureDataDir();
    await fs.writeFile(FILE_TOKEN_PATH, JSON.stringify(tokens, null, 2), "utf8");
  } catch {
    // En Vercel el filesystem puede fallar; la cookie es la fuente de verdad.
  }
}

export async function clearGoogleTokens(): Promise<void> {
  await clearTokensCookie();
  try {
    await fs.unlink(FILE_TOKEN_PATH);
  } catch {
    // ignore
  }
  try {
    await setGoogleCalendarStatus({ connected: false });
  } catch {
    // ignore
  }
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenStore> {
  if (!isGoogleConfigured()) {
    throw new Error("Google OAuth no configurado");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Token exchange failed");
  }

  const previous = await readGoogleTokens();
  const stored: GoogleTokenStore = {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? previous?.refresh_token,
    scope: data.scope,
    token_type: data.token_type,
    expiry_date: data.expires_in
      ? Date.now() + data.expires_in * 1000
      : null,
  };

  const meRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${stored.access_token}` },
  });
  if (meRes.ok) {
    const me = (await meRes.json()) as { email?: string };
    stored.email = me.email;
  }

  await writeGoogleTokens(stored);
  try {
    await setGoogleCalendarStatus({
      connected: true,
      email: stored.email,
      connectedAt: new Date().toISOString(),
    });
  } catch {
    // store efímero en Vercel; la cookie manda
  }
  return stored;
}

async function getAccessToken(): Promise<string> {
  const stored = await readGoogleTokens();
  if (!stored?.access_token && !stored?.refresh_token) {
    throw new Error("Google Calendar no está conectado");
  }

  const stillValid =
    stored.access_token &&
    stored.expiry_date &&
    stored.expiry_date > Date.now() + 60_000;

  if (stillValid) {
    return stored.access_token;
  }

  if (!stored.refresh_token) {
    throw new Error("Falta refresh_token; reconecta Google Calendar");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: stored.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Refresh token failed");
  }

  const next: GoogleTokenStore = {
    ...stored,
    access_token: data.access_token,
    expiry_date: data.expires_in
      ? Date.now() + data.expires_in * 1000
      : stored.expiry_date,
    scope: data.scope ?? stored.scope,
    token_type: data.token_type ?? stored.token_type,
  };
  await writeGoogleTokens(next);
  return next.access_token;
}

export async function isGoogleConnected(): Promise<boolean> {
  const tokens = await readGoogleTokens();
  return Boolean(tokens?.refresh_token || tokens?.access_token);
}

export async function getGoogleAccountEmail(): Promise<string | undefined> {
  const tokens = await readGoogleTokens();
  return tokens?.email;
}

/** Busy intervals from primary calendar (ISO strings). */
export async function fetchBusyIntervals(
  timeMin: Date,
  timeMax: Date,
): Promise<{ start: string; end: string }[]> {
  if (!(await isGoogleConnected())) return [];

  try {
    const accessToken = await getAccessToken();
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/freeBusy",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          timeZone: "America/Santiago",
          items: [{ id: "primary" }],
        }),
      },
    );
    if (!res.ok) {
      console.error("[google] freebusy status", res.status, await res.text());
      return [];
    }
    const data = (await res.json()) as {
      calendars?: { primary?: { busy?: { start?: string; end?: string }[] } };
    };
    const busy = data.calendars?.primary?.busy ?? [];
    return busy
      .filter((b): b is { start: string; end: string } => Boolean(b.start && b.end))
      .map((b) => ({ start: b.start, end: b.end }));
  } catch (err) {
    console.error("[google] freebusy failed", err);
    return [];
  }
}

export async function createCalendarEventWithMeet(input: {
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
  attendeeEmail: string;
  attendeeName: string;
}): Promise<{ eventId: string; meetUrl?: string; htmlLink?: string }> {
  const accessToken = await getAccessToken();
  const requestId = randomBytes(8).toString("hex");

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        start: {
          dateTime: input.startIso,
          timeZone: "America/Santiago",
        },
        end: {
          dateTime: input.endIso,
          timeZone: "America/Santiago",
        },
        attendees: [
          {
            email: input.attendeeEmail,
            displayName: input.attendeeName,
          },
        ],
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    },
  );

  const data = (await res.json()) as {
    id?: string;
    hangoutLink?: string;
    htmlLink?: string;
    conferenceData?: {
      entryPoints?: { entryPointType?: string; uri?: string }[];
    };
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `Calendar insert failed (${res.status})`);
  }

  const meetUrl =
    data.hangoutLink ||
    data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")
      ?.uri ||
    undefined;

  return {
    eventId: data.id ?? requestId,
    meetUrl,
    htmlLink: data.htmlLink,
  };
}

export type GoogleCalendarEventItem = {
  id: string;
  summary: string;
  start: string;
  end: string;
  meetUrl?: string;
  htmlLink?: string;
  isPagate: boolean;
};

/** Próximos eventos del calendario primario. */
export async function listUpcomingGoogleEvents(
  days = 14,
): Promise<GoogleCalendarEventItem[]> {
  if (!(await isGoogleConnected())) return [];

  try {
    const accessToken = await getAccessToken();
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + days);

    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "50",
    });

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!res.ok) {
      console.error("[google] list events status", res.status, await res.text());
      return [];
    }

    const data = (await res.json()) as {
      items?: {
        id?: string;
        summary?: string;
        hangoutLink?: string;
        htmlLink?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
        conferenceData?: {
          entryPoints?: { entryPointType?: string; uri?: string }[];
        };
      }[];
    };

    return (data.items ?? [])
      .filter((e) => e.id && (e.start?.dateTime || e.start?.date))
      .map((e) => {
        const start = e.start?.dateTime || `${e.start?.date}T00:00:00-03:00`;
        const end = e.end?.dateTime || `${e.end?.date}T23:59:59-03:00`;
        const meetUrl =
          e.hangoutLink ||
          e.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === "video")
            ?.uri ||
          undefined;
        const summary = e.summary || "(Sin título)";
        return {
          id: e.id!,
          summary,
          start,
          end,
          meetUrl,
          htmlLink: e.htmlLink,
          isPagate: summary.startsWith("Pagate"),
        };
      });
  } catch (err) {
    console.error("[google] list events failed", err);
    return [];
  }
}
