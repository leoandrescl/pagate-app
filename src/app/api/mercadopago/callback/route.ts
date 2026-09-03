import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  exchangeMercadoPagoCode,
} from "@/lib/mercadopago";
import { writeMercadoPagoTokensForUser } from "@/lib/store";
import { getStudioUrl } from "@/lib/urls";

function safeNext(raw: string | undefined): string {
  if (raw === "/onboarding/pagos") return raw;
  return "/dashboard";
}

export async function GET(request: Request) {
  const studio = getStudioUrl();
  const user = await getUser();
  const { searchParams } = new URL(request.url);
  const jar = await cookies();
  const next = safeNext(jar.get("mp_oauth_next")?.value);
  const expected = jar.get("mp_oauth_state")?.value;
  jar.delete("mp_oauth_state");
  jar.delete("mp_oauth_next");

  const dest = (status: string) => {
    const url = new URL(next, studio);
    url.searchParams.set("mp", status);
    return url;
  };

  if (!user) {
    return NextResponse.redirect(new URL("/login", studio));
  }
  if (searchParams.get("error")) {
    return NextResponse.redirect(dest("denied"));
  }

  const state = searchParams.get("state");
  const code = searchParams.get("code");
  if (!code || !expected || state !== expected) {
    return NextResponse.redirect(dest("error"));
  }

  try {
    const tokens = await exchangeMercadoPagoCode(code);
    await writeMercadoPagoTokensForUser(user.id, tokens);
    return NextResponse.redirect(dest("connected"));
  } catch (err) {
    console.error("[mp] oauth callback", err);
    return NextResponse.redirect(dest("error"));
  }
}
