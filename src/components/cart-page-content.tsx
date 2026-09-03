"use client";

import Link from "next/link";
import { useState } from "react";
import { formatClp } from "@/lib/format-clp";
import { useCart } from "@/lib/cart-context";
import { CouponField, OrderSummary } from "@/components/coupon-field";
import { InstallmentBadge } from "@/components/installment-badge";

export function CartPageContent({ username }: { username: string }) {
  const { items, subtotalClp, removeItem, updateQuantity } = useCart();
  const [discountClp, setDiscountClp] = useState(0);
  const [totalClp, setTotalClp] = useState(subtotalClp);

  const effectiveTotal = totalClp || subtotalClp;

  if (items.length === 0) {
    return (
      <div className="animate-rise rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-8 text-center backdrop-blur-sm">
        <p className="font-display text-2xl text-[var(--ink)]">Tu carrito está vacío</p>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Agrega productos desde la vitrina para comprarlos juntos.
        </p>
        <Link href={`/u/${username}`} className="btn-primary mt-6 inline-flex">
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-6">
      <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 backdrop-blur-sm">
        <h1 className="font-display text-3xl text-[var(--ink)]">Tu carrito</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          {items.length} producto{items.length !== 1 ? "s" : ""} · pago con Webpay, transferencia o Mercado Pago (demo)
        </p>

        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex flex-col gap-3 border-b border-[var(--line)] pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">
                  {item.type === "session"
                    ? "Sesión 1:1"
                    : item.type === "community"
                      ? `Comunidad · ${item.platform}`
                      : "Digital"}
                </p>
                <p className="font-semibold text-[var(--ink)]">{item.name}</p>
                <p className="text-sm text-[var(--teal-deep)]">
                  {formatClp(item.priceClp)} c/u
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl border border-[var(--line)] bg-white/70">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="px-3 py-1.5 text-lg text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    aria-label="Disminuir cantidad"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="px-3 py-1.5 text-lg text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>
                <p className="min-w-[5rem] text-right font-semibold text-[var(--ink)]">
                  {formatClp(item.priceClp * item.quantity)}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-sm text-[var(--coral)] underline-offset-2 hover:underline"
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 backdrop-blur-sm">
        <CouponField
          subtotalClp={subtotalClp}
          onApplied={({ discountClp: d, totalClp: t }) => {
            setDiscountClp(d);
            setTotalClp(t);
          }}
        />
        <div className="mt-4">
          <OrderSummary
            subtotalClp={subtotalClp}
            discountClp={discountClp}
            totalClp={effectiveTotal}
          />
        </div>
        <div className="mt-3">
          <InstallmentBadge amountClp={effectiveTotal} />
        </div>
        <Link href={`/checkout/carrito?u=${encodeURIComponent(username)}`} className="btn-primary mt-6 block w-full text-center">
          Ir a pagar · {formatClp(effectiveTotal)}
        </Link>
      </div>
    </div>
  );
}
