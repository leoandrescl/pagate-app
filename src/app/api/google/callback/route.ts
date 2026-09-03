import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { exchangeCodeForTokens } from "@/lib/google-calendar";
import { getStudioUrl } from "@/lib/urls";

export async function GET(request: Request) {
  const dashboard = `${getStudioUrl()}/dashboard`;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", getStudioUrl()));
  }

  if (error) {
    return NextResponse.redirect(new URL(`${dashboard}?google=denied`));
  }
  if (!code) {
    return NextResponse.redirect(new URL(`${dashboard}?google=error`));
  }

  try {
    await exchangeCodeForTokens(user.id, code);
    return NextResponse.redirect(new URL(`${dashboard}?google=connected`));
  } catch (err) {
    console.error("[google] callback", err);
    return NextResponse.redirect(new URL(`${dashboard}?google=error`));
  }
}
