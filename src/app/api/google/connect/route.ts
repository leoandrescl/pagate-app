import { NextResponse } from "next/server";
import {
  getGoogleAuthUrl,
  isGoogleConfigured,
} from "@/lib/google-calendar";

export async function GET() {
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/dashboard?google=missing_env",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      ),
    );
  }

  try {
    const url = getGoogleAuthUrl();
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("[google] auth url", err);
    return NextResponse.redirect(
      new URL(
        "/dashboard?google=error",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      ),
    );
  }
}
