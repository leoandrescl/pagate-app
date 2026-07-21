import { NextResponse } from "next/server";
import { clearGoogleTokens } from "@/lib/google-calendar";

export async function POST() {
  await clearGoogleTokens();
  return NextResponse.redirect(
    new URL(
      "/dashboard?google=disconnected",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ),
    303,
  );
}
