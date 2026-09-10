"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatClp } from "@/lib/format-clp";
import {
  createCouponAction,
  deleteCouponAction,
  toggleCouponAction,
  type ActionResult,
} from "@/lib/actions";
import type { Coupon, CouponDiscountType } from "@/lib/types";

const initial: ActionResult | null = null;

export function CouponsPanel({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createCouponAction,
    initial,
  );
  const [type, setType] = useState<CouponDiscountType>("percentage");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg text-[var(--ink)]">Cupones de tu tienda</h3>
        {initialCoupons.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--ink-muted)]">Aún no hay cupones.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {initialCoupons.map((coupon) => (
              <li
                key={coupon.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm"
              >
                <div>
                  <span
                    className={`font-semibold ${coupon.active ? "text-[var(--ink)]" : "text-[var(--ink-muted)] line-through"}`}
                  >
                    {coupon.code}
                  </span>
                  <span className="ml-2 text-[var(--ink-muted)]">
                    {coupon.discountType === "percentage"
                      ? `${coupon.discountValue}% de descuento`
                      : `${formatClp(coupon.discountValue)} de descuento`}
                  </span>
                  <span className="ml-2 text-xs text-[var(--ink-muted)]">
                    {coupon.expiresAt
                      ? `Vigente hasta ${new Date(coupon.expiresAt).toLocaleDateString("es-CL")}`
                      : "Sin vencimiento"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      coupon.active
                        ? "bg-[var(--mint)]/50 text-[var(--teal-deep)]"
                        : "bg-[var(--fog)] text-[var(--ink-muted)]"
                    }`}
                  >
                    {coupon.active ? "Activo" : "Inactivo"}
                  </span>
                  <form action={toggleCouponAction}>
                    <input type="hidden" name="couponId" value={coupon.id} />
                    <button
                      type="submit"
                      className="text-xs font-semibold text-[var(--teal-deep)] underline-offset-2 hover:underline"
                    >
                      {coupon.active ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                  <form action={deleteCouponAction}>
                    <input type="hidden" name="couponId" value={coupon.id} />
                    <button
                      type="submit"
                      className="text-xs font-semibold text-[var(--coral)] underline-offset-2 hover:underline"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={formAction} className="space-y-4 border-t border-[var(--line)] pt-6">
        <h3 className="font-display text-lg text-[var(--ink)]">Crear cupón</h3>
        <div>
          <label htmlFor="couponCode" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
            Código
          </label>
          <input
            id="couponCode"
            name="code"
            placeholder="VERANO20"
            className="field uppercase"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
              Tipo de descuento
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm has-[:checked]:border-[var(--teal)] has-[:checked]:bg-[var(--mint)]/40">
                <input
                  type="radio"
                  name="type"
                  value="percentage"
                  checked={type === "percentage"}
                  onChange={() => setType("percentage")}
                />
                Porcentaje
              </label>
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm has-[:checked]:border-[var(--teal)] has-[:checked]:bg-[var(--mint)]/40">
                <input
                  type="radio"
                  name="type"
                  value="fixed"
                  checked={type === "fixed"}
                  onChange={() => setType("fixed")}
                />
                Monto fijo
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="couponValue" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
              {type === "percentage" ? "Porcentaje (%)" : "Monto (CLP)"}
            </label>
            <input
              id="couponValue"
              name="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode="decimal"
              placeholder={type === "percentage" ? "10" : "5000"}
              className="field"
            />
          </div>
        </div>
        <div>
          <label htmlFor="couponExpires" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
            Vigencia hasta
          </label>
          <input
            id="couponExpires"
            name="expiresAt"
            type="date"
            className="field"
          />
        </div>
        {state && !state.ok ? (
          <p className="text-sm text-[var(--coral)]" role="alert">{state.error}</p>
        ) : null}
        {state?.ok ? (
          <p className="text-sm text-[var(--teal-deep)]">Cupón creado.</p>
        ) : null}
        <button type="submit" disabled={pending} className="btn-primary text-sm">
          {pending ? "Creando…" : "Crear cupón"}
        </button>
        <p className="text-xs text-[var(--ink-muted)]">
          Los cupones se aplican en el checkout de tu tienda.
        </p>
      </form>
    </div>
  );
}