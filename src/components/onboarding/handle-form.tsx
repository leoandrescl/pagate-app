"use client";

import { useActionState, useEffect, useState } from "react";
import { saveHandleAction } from "@/lib/onboarding-actions";
import { WizardNav } from "@/components/onboarding/wizard-nav";
import type { ActionResult } from "@/lib/actions";

const initial: ActionResult | null = null;

export function HandleForm({
  prefix,
  defaultUsername,
}: {
  prefix: string;
  defaultUsername?: string;
}) {
  const [state, formAction] = useActionState(saveHandleAction, initial);
  const [username, setUsername] = useState(defaultUsername ?? "");
  const [status, setStatus] = useState<"idle" | "ok" | "bad">("idle");
  const [hint, setHint] = useState("");
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9.]/g, "");

  useEffect(() => {
    if (normalized.length < 3) return;
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/onboarding/username?u=${encodeURIComponent(normalized)}`,
        );
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (cancelled) return;
        if (data.ok) {
          setStatus("ok");
          setHint("Disponible");
        } else {
          setStatus("bad");
          setHint(data.error || "No disponible");
        }
      } catch {
        if (!cancelled) {
          setStatus("idle");
          setHint("");
        }
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [normalized]);

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <div className="flex overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <span className="hidden shrink-0 items-center bg-[var(--fog)] px-4 text-sm text-[var(--ink-muted)] sm:flex">
          {prefix}
        </span>
        <input
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="off"
          autoFocus
          maxLength={24}
          placeholder="tuhandle"
          className="field rounded-none border-0 bg-transparent shadow-none focus:shadow-none"
        />
      </div>
      <p className="mt-2 text-sm sm:hidden text-[var(--ink-muted)]">
        {prefix}
        {username.trim().toLowerCase() || "tuhandle"}
      </p>
      {normalized.length >= 3 && hint ? (
        <p
          className={`mt-3 text-sm font-medium ${
            status === "ok" ? "text-[var(--teal)]" : "text-[var(--coral)]"
          }`}
        >
          {hint}
        </p>
      ) : (
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          Letras, números y puntos. Entre 3 y 24 caracteres.
        </p>
      )}
      <WizardNav
        submitLabel="Siguiente →"
        error={state && !state.ok ? state.error : null}
      />
    </form>
  );
}
