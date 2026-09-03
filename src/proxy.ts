import { type NextRequest, NextResponse } from "next/server";
import { copyCookies, updateSession } from "@/lib/supabase/proxy";
import { isLocalDevHost, isMarketingHost, isStudioHost } from "@/lib/urls";

const STUDIO_PATHS = [
  "/login",
  "/onboarding",
  "/dashboard",
  "/crear",
  "/auth",
  "/api/mercadopago/connect",
  "/api/mercadopago/callback",
  "/api/mercadopago/disconnect",
];
const MARKETING_PATHS = ["/para", "/vs", "/u", "/checkout", "/d"];

function pathStartsWith(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function marketingOrigin(request: NextRequest) {
  const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (app) return app;
  const host = request.headers.get("host") ?? "pagate.cl";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const marketingHost = host.replace(/^studio\./, "").replace(/^www\./, "");
  return `${proto}://${marketingHost}`;
}

function studioOrigin(request: NextRequest) {
  const studio = process.env.NEXT_PUBLIC_STUDIO_URL?.replace(/\/$/, "");
  if (studio) return studio;
  const host = request.headers.get("host") ?? "studio.pagate.cl";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host.startsWith("studio.")) return `${proto}://${host}`;
  const root = host.replace(/^www\./, "");
  return `${proto}://studio.${root}`;
}

export async function proxy(request: NextRequest) {
  const sessionResponse = await updateSession(request);
  const host = request.headers.get("host") ?? "";
  if (isLocalDevHost(host)) {
    return sessionResponse;
  }

  const { pathname, search } = request.nextUrl;

  if (isMarketingHost(host) && pathStartsWith(pathname, STUDIO_PATHS)) {
    const redirect = NextResponse.redirect(
      `${studioOrigin(request)}${pathname}${search}`,
      308,
    );
    return copyCookies(sessionResponse, redirect);
  }

  if (isStudioHost(host)) {
    const sendToMarketing =
      pathname === "/" || pathStartsWith(pathname, MARKETING_PATHS);
    if (sendToMarketing) {
      const redirect = NextResponse.redirect(
        `${marketingOrigin(request)}${pathname}${search}`,
        308,
      );
      return copyCookies(sessionResponse, redirect);
    }
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
