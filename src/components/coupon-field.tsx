"use client";

import { useState } from "react";
import { applyCouponToSubtotal, type AppliedCoupon } from "@/lib/pricing";
import { formatClp } from "@/lib/format-clp";
import { useStoreSettings } from "@/lib/store-settings-context";

type Props = {
  subtotalClp: number;
  onApplied?: (result: {
    coupon: AppliedCoupon | null;
    discountClp: number;
    totalClp: number;
  }) => void;
};

export function CouponField({ subtotalClp, onApplied }: Props) {
  const { coupons: creatorCoupons } = useStoreSettings();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [discountClp, setDiscountClp] = useState(0);

  function handleApply() {
    const result = applyCouponToSubtotal(subtotalClp, code, creatorCoupons);
    if (!result.coupon) {
      setError("Cupón no válido");
      setApplied(null);
      setDiscountClp(0);
      onApplied?.({ coupon: null, discountClp: 0, totalClp: subtotalClp });
      return;
    }
    setError(null);
    setApplied(result.coupon);
    setDiscountClp(result.discountClp);
    onApplied?.(result);
  }

  function handleRemove() {
    setCode("");
    setApplied(null);
    setDiscountClp(0);
    setError(null);
    onApplied?.({ coupon: null, discountClp: 0, totalClp: subtotalClp });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--ink-muted)]">
        ¿Tienes un cupón?
      </p>
      {applied ? (
        <div className="flex items-center justify-between rounded-xl border border-[var(--teal)] bg-[var(--mint)]/40 px-3 py-2 text-sm">
          <span>
            <strong>{applied.code}</strong> · −{formatClp(discountClp)}
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
          <button type="button" onClick={handleApply} className="btn-ghost shrink-0 text-sm">
            Aplicar
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
