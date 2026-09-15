"use client";

import { useState } from "react";
import { createProCheckoutAction } from "@/lib/plan-actions";

export function ProCheckoutButton({
  label,
  className = "btn-primary w-full justify-center",
}: {
  label: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const result = await createProCheckoutAction();
      if (result.ok && result.redirectTo) {
        window.location.href = result.redirectTo;
        return;
      }
      setError(
        !result.ok ? result.error : "No se pudo iniciar el pago.",
      );
      setPending(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar el pago.");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={className}
      >
        {pending ? "Abriendo Mercado Pago…" : label}
      </button>
      {error ? (
        <p className="mt-3 rounded-xl bg-[var(--fog)] px-3 py-2 text-sm text-[var(--coral)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
