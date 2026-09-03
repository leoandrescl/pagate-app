import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getUser } from "@/lib/auth";
import {
  getMercadoPagoAuthUrl,
  isMercadoPagoOAuthConfigured,
} from "@/lib/mercadopago";
import { getStudioUrl } from "@/lib/urls";

function safeNext(raw: string | null): string {
  if (raw === "/onboarding/pagos") return raw;
  return "/dashboard";
}

export async function GET(request: Request) {
  const studio = getStudioUrl();
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", studio));
  }
  if (!isMercadoPagoOAuthConfigured()) {
    return NextResponse.redirect(new URL("/dashboard?mp=missing_env", studio));
  }

  const { searchParams } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));
  const state = randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set("mp_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  jar.set("mp_oauth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(getMercadoPagoAuthUrl(state));
}
