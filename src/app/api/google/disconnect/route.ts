import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { clearGoogleTokens } from "@/lib/google-calendar";
import { getStudioUrl } from "@/lib/urls";

export async function POST() {
  const dashboard = `${getStudioUrl()}/dashboard`;
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", getStudioUrl()), 303);
  }
  await clearGoogleTokens(user.id);
  return NextResponse.redirect(new URL(`${dashboard}?google=disconnected`), 303);
}
