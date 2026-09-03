import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isUsernameAvailable, normalizeUsername } from "@/lib/store";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sin sesión." }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("u") ?? "";
  const username = normalizeUsername(raw);
  const result = await isUsernameAvailable(username, user.id);
  return NextResponse.json(result);
}
