import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { clearMercadoPagoTokensForUser } from "@/lib/store";
import { getStudioUrl } from "@/lib/urls";

function safeNext(raw: string | null): string {
  if (raw === "/onboarding/pagos") return raw;
  return "/dashboard";
}

export async function POST(request: Request) {
  const studio = getStudioUrl();
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", studio), 303);
  }
  await clearMercadoPagoTokensForUser(user.id);
  const form = await request.formData().catch(() => null);
  const next = safeNext(form ? String(form.get("next") ?? "") : null);
  const url = new URL(next, studio);
  url.searchParams.set("mp", "disconnected");
  return NextResponse.redirect(url, 303);
}
