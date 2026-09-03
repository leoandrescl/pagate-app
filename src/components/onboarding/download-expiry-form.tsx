"use client";

import { useActionState, useState } from "react";
import { saveDownloadExpiryAction } from "@/lib/onboarding-actions";
import { WizardNav } from "@/components/onboarding/wizard-nav";
import type { ActionResult } from "@/lib/actions";

const initial: ActionResult | null = null;

const OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "24 horas" },
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
  { value: "90", label: "90 días" },
  { value: "never", label: "No expiran" },
];

export function DownloadExpiryForm({
  defaultDays,
}: {
  defaultDays: number | null;
}) {
  const [state, formAction] = useActionState(
    saveDownloadExpiryAction,
    initial,
  );
  const [value, setValue] = useState(
    defaultDays == null ? "never" : String(defaultDays),
  );

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <input type="hidden" name="expiry" value={value} />
      <div className="flex flex-wrap gap-3">
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue(option.value)}
              className={`rounded-2xl border bg-white px-5 py-3 text-sm font-semibold transition ${
                selected
                  ? "border-[var(--teal)] text-[var(--teal-deep)] ring-2 ring-[var(--teal)]/20"
                  : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--teal)]/50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <div className="mt-8 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--fog)]/70 px-5 py-4">
        <p className="font-semibold text-[var(--ink)]">
          Por defecto son 7 días
        </p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
          Si no cambias esta configuración, los links expiran a los 7 días con
          un máximo de 2 descargas por archivo.
        </p>
      </div>
      <WizardNav
        backHref="/onboarding/pagos"
        submitLabel="Siguiente →"
        error={state && !state.ok ? state.error : null}
      />
    </form>
  );
}
