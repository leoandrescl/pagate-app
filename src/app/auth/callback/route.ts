import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMyStore } from "@/lib/store";
import { isOnboardingComplete, pendingOnboardingPath } from "@/lib/onboarding";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getStudioUrl } from "@/lib/urls";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const base = getStudioUrl() || origin;

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login", base));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const store = await getMyStore(user.id);
        const dest = isOnboardingComplete(store)
          ? "/dashboard"
          : pendingOnboardingPath(store);
        return NextResponse.redirect(new URL(next || dest, base));
      }
    }
  }

  return NextResponse.redirect(new URL("/login?error=oauth", base));
}
