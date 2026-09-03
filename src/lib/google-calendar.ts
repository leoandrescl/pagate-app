import { randomBytes } from "crypto";
import type { GoogleTokenStore } from "./types";
import {
  clearGoogleTokensForUser,
  getMyStore,
  readGoogleTokensForUser,
  setGoogleCalendarStatus,
  writeGoogleTokensForUser,
} from "./store";
import { getStudioUrl } from "./urls";

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
  if (process.env.GOOGLE_REDIRECT_URI?.trim()) {
    return process.env.GOOGLE_REDIRECT_URI.trim();
  }
  return `${getStudioUrl()}/api/google/callback`;
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

export async function readGoogleTokens(
  userId: string,
): Promise<GoogleTokenStore | null> {
  return readGoogleTokensForUser(userId);
}

export async function writeGoogleTokens(
  userId: string,
  tokens: GoogleTokenStore,
): Promise<void> {
  await writeGoogleTokensForUser(userId, tokens);
  const store = await getMyStore(userId);
  if (store) {
    await setGoogleCalendarStatus(store.creator.id, {
      connected: true,
      email: tokens.email,
      connectedAt: new Date().toISOString(),
    });
  }
}

export async function clearGoogleTokens(userId: string): Promise<void> {
  await clearGoogleTokensForUser(userId);
  const store = await getMyStore(userId);
  if (store) {
    await setGoogleCalendarStatus(store.creator.id, { connected: false });
  }
}

export async function exchangeCodeForTokens(
  userId: string,
  code: string,
): Promise<GoogleTokenStore> {
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

  const previous = await readGoogleTokens(userId);
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

  await writeGoogleTokens(userId, stored);
  return stored;
}

async function getAccessToken(userId: string): Promise<string> {
  const stored = await readGoogleTokens(userId);
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
  await writeGoogleTokens(userId, next);
  return next.access_token;
}

export async function isGoogleConnected(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  const tokens = await readGoogleTokens(userId);
  return Boolean(tokens?.refresh_token || tokens?.access_token);
}

export async function getGoogleAccountEmail(
  userId?: string | null,
): Promise<string | undefined> {
  if (!userId) return undefined;
  const tokens = await readGoogleTokens(userId);
  return tokens?.email;
}

export async function fetchBusyIntervals(
  userId: string | null | undefined,
  timeMin: Date,
  timeMax: Date,
): Promise<{ start: string; end: string }[]> {
  if (!userId || !(await isGoogleConnected(userId))) return [];

  try {
    const accessToken = await getAccessToken(userId);
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

export async function createCalendarEventWithMeet(
  userId: string,
  input: {
    summary: string;
    description: string;
    startIso: string;
    endIso: string;
    attendeeEmail: string;
    attendeeName: string;
  },
): Promise<{ eventId: string; meetUrl?: string; htmlLink?: string }> {
  const accessToken = await getAccessToken(userId);
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

export async function listUpcomingGoogleEvents(
  userId: string | null | undefined,
  days = 14,
): Promise<GoogleCalendarEventItem[]> {
  if (!userId || !(await isGoogleConnected(userId))) return [];

  try {
    const accessToken = await getAccessToken(userId);
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
