import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getGoogleAuthUrl,
  isGoogleConfigured,
} from "@/lib/google-calendar";
import { getStudioUrl } from "@/lib/urls";

export async function GET() {
  const dashboard = `${getStudioUrl()}/dashboard`;
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", getStudioUrl()));
  }

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(new URL(`${dashboard}?google=missing_env`));
  }

  try {
    const url = getGoogleAuthUrl();
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("[google] auth url", err);
    return NextResponse.redirect(new URL(`${dashboard}?google=error`));
  }
}
