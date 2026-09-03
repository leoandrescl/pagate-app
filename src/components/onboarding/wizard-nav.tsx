"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

export function WizardNav({
  backHref,
  submitLabel,
  skipHref,
  skipLabel = "Configurar después",
  skipAsSubmit,
  error,
}: {
  backHref?: string;
  submitLabel: string;
  skipHref?: string;
  skipLabel?: string;
  skipAsSubmit?: string;
  error?: string | null;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="mt-auto pt-10">
      {error ? (
        <p className="mb-4 rounded-xl bg-[var(--fog)] px-3 py-2 text-sm text-[var(--coral)]">
          {error}
        </p>
      ) : null}
      {skipAsSubmit ? (
        <p className="mb-6 text-center">
          <button
            type="submit"
            className="text-sm font-semibold text-[var(--teal)] underline-offset-4 hover:underline"
          >
            {skipAsSubmit}
          </button>
        </p>
      ) : skipHref ? (
        <p className="mb-6 text-center">
          <Link
            href={skipHref}
            className="text-sm font-semibold text-[var(--teal)] underline-offset-4 hover:underline"
          >
            {skipLabel}
          </Link>
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        {backHref ? (
          <Link href={backHref} className="btn-ghost px-5">
            ← Atrás
          </Link>
        ) : (
          <span />
        )}
        <button type="submit" disabled={pending} className="btn-primary px-6">
          {pending ? "Guardando…" : submitLabel}
        </button>
      </div>
    </div>
  );
}
