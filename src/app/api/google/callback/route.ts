import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?google=denied`, base));
  }
  if (!code) {
    return NextResponse.redirect(new URL(`/dashboard?google=error`, base));
  }

  try {
    await exchangeCodeForTokens(code);
    return NextResponse.redirect(new URL(`/dashboard?google=connected`, base));
  } catch (err) {
    console.error("[google] callback", err);
    return NextResponse.redirect(new URL(`/dashboard?google=error`, base));
  }
}
