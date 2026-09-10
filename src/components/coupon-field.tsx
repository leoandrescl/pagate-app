"use client";

import { useState } from "react";
import { validateCouponAction } from "@/lib/actions";
import { formatClp } from "@/lib/format-clp";

type AppliedState = {
  code: string;
  discountClp: number;
};

type Props = {
  storeId?: string;
  subtotalClp: number;
  onApplied?: (result: {
    code: string | null;
    discountClp: number;
    totalClp: number;
  }) => void;
};

export function CouponField({ storeId, subtotalClp, onApplied }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<AppliedState | null>(null);
  const [pending, setPending] = useState(false);

  async function handleApply() {
    if (!storeId) {
      setError("Cupón no válido");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await validateCouponAction(storeId, code, subtotalClp);
      if (!result.ok) {
        setError(result.error);
        setApplied(null);
        onApplied?.({ code: null, discountClp: 0, totalClp: subtotalClp });
        return;
      }
      setApplied({
        code: result.code,
        discountClp: result.discountClp,
      });
      onApplied?.({
        code: result.code,
        discountClp: result.discountClp,
        totalClp: result.totalClp,
      });
    } catch {
      setError("No se pudo validar el cupón.");
    } finally {
      setPending(false);
    }
  }

  function handleRemove() {
    setCode("");
    setApplied(null);
    setError(null);
    onApplied?.({ code: null, discountClp: 0, totalClp: subtotalClp });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--ink-muted)]">
        ¿Tienes un cupón?
      </p>
      {applied ? (
        <div className="flex items-center justify-between rounded-xl border border-[var(--teal)] bg-[var(--mint)]/40 px-3 py-2 text-sm">
          <span>
            <strong>{applied.code}</strong> · −{formatClp(applied.discountClp)}
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs font-semibold text-[var(--teal-deep)] underline-offset-2 hover:underline"
          >
            Quitar
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="Ej. VERANO20"
            className="field flex-1 uppercase"
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={pending || !code.trim()}
            className="btn-ghost shrink-0 text-sm"
          >
            {pending ? "…" : "Aplicar"}
          </button>
        </div>
      )}
      {error ? (
        <p className="text-sm text-[var(--coral)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function OrderSummary({
  subtotalClp,
  discountClp,
  totalClp,
}: {
  subtotalClp: number;
  discountClp: number;
  totalClp: number;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-[var(--line)] bg-[var(--fog)] p-4 text-sm">
      <div className="flex justify-between text-[var(--ink-muted)]">
        <span>Subtotal</span>
        <span>{formatClp(subtotalClp)}</span>
      </div>
      {discountClp > 0 ? (
        <div className="flex justify-between text-[var(--teal-deep)]">
          <span>Descuento</span>
          <span>−{formatClp(discountClp)}</span>
        </div>
      ) : null}
      <div className="flex justify-between border-t border-[var(--line)] pt-2 text-base font-semibold text-[var(--ink)]">
        <span>Total</span>
        <span className="text-[var(--teal-deep)]">{formatClp(totalClp)}</span>
      </div>
    </div>
  );
}