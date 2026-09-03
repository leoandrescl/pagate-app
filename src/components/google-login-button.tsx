"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function oauthReturnMessage(): string | null {
  if (typeof window === "undefined") return null;
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const description =
    hash.get("error_description") || query.get("error_description") || "";
  if (query.get("error") === "oauth" || hash.get("error")) {
    if (/unable to exchange external code/i.test(description)) {
      return "Google aceptó la cuenta, pero Supabase no pudo canjear el código. Revisa que el Client Secret en Authentication → Providers → Google sea exactamente el de Cliente web 1 en Google Cloud.";
    }
    return "No se pudo completar el acceso con Google. Intenta de nuevo.";
  }
  return null;
}

export function GoogleLoginButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(oauthReturnMessage());
  }, []);

  async function handleClick() {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError(
        "Falta configurar Supabase (NEXT_PUBLIC_SUPABASE_URL y la anon key).",
      );
      return;
    }
    setPending(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        setPending(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar Google.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:bg-[var(--fog)] disabled:opacity-60"
      >
        <GoogleMark />
        {pending ? "Conectando…" : "Continuar con Google"}
      </button>
      {error ? (
        <p className="rounded-xl bg-[var(--fog)] px-3 py-2 text-sm text-[var(--coral)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.7 7.2l6.3 5.3C38.9 37.1 44 31.2 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}
