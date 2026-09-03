import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleLoginButton } from "@/components/google-login-button";
import { getUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getMyStore } from "@/lib/store";
import { getAppBaseUrl } from "@/lib/urls";
import { isOnboardingComplete, pendingOnboardingPath } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (isSupabaseConfigured()) {
    const user = await getUser();
    if (user) {
      const store = await getMyStore(user.id);
      if (isOnboardingComplete(store)) {
        redirect("/dashboard");
      }
      redirect(pendingOnboardingPath(store));
    }
  }

  return (
    <div className="atmosphere min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[var(--line)]/60 bg-[#eef6f3]/80 backdrop-blur-md">
        <div className="shell flex items-center justify-between py-4 sm:py-5">
          <Link
            href={getAppBaseUrl()}
            className="font-display text-2xl font-semibold text-[var(--ink)]"
          >
            Pagate
          </Link>
          <Link href={getAppBaseUrl()} className="btn-ghost text-sm">
            Volver a Pagate
          </Link>
        </div>
      </header>

      <main className="shell relative z-[1] max-w-lg pb-20 pt-10 sm:pt-16">
        <p className="animate-rise text-sm font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
          Studio
        </p>
        <h1 className="animate-rise-delay font-display mt-3 text-4xl text-[var(--ink)] sm:text-5xl">
          Crea tu tienda
        </h1>
        <p className="animate-rise-delay-2 mt-4 text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
          Entra con tu cuenta de Google para publicar tu link, cobrar en Chile y
          entregar solo.
        </p>

        <div className="animate-rise-delay-2 mt-8 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 backdrop-blur-sm sm:p-8">
          <GoogleLoginButton />
          <p className="mt-4 text-center text-xs leading-relaxed text-[var(--ink-muted)]">
            Al continuar aceptas que Pagate use tu nombre y email de Google para
            crear tu cuenta de creador. El calendario se conecta después, si
            quieres, desde el panel.
          </p>
        </div>
      </main>
    </div>
  );
}
