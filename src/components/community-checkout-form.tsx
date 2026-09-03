"use client";

import { useState } from "react";
import { formatClp } from "@/lib/format-clp";
import { CouponField, OrderSummary } from "@/components/coupon-field";
import { InstallmentBadge } from "@/components/installment-badge";
import { checkoutCartAction } from "@/lib/actions";
import type { MockCommunityProduct } from "@/lib/mock-data";

export function CommunityCheckoutForm({
  product,
}: {
  product: MockCommunityProduct;
}) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [discountClp, setDiscountClp] = useState(0);
  const [totalClp, setTotalClp] = useState(product.priceClp);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveTotal = totalClp || product.priceClp;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!buyerName.trim() || buyerName.trim().length < 2) {
      setError("Ingresa tu nombre.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      setError("Ingresa un email válido.");
      return;
    }
    setPending(true);
    try {
      const result = await checkoutCartAction({
        items: [
          {
            productId: product.id,
            name: product.name,
            priceClp: product.priceClp,
            quantity: 1,
            type: "community",
          },
        ],
        sessionSlots: {},
        buyerName,
        buyerEmail,
      });
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return;
      }
      if (result.redirectTo?.startsWith("http")) {
        window.location.href = result.redirectTo;
        return;
      }
      setError("No se recibió la URL de Mercado Pago.");
      setPending(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo iniciar el pago.",
      );
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/70 p-4">
        <p className="text-sm text-[var(--ink-muted)]">Vas a comprar</p>
        <p className="mt-1 font-display text-xl text-[var(--ink)]">{product.name}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">
          Comunidad · {product.platform}
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--teal-deep)]">
          {formatClp(product.priceClp)}
        </p>
        <div className="mt-2">
          <InstallmentBadge amountClp={product.priceClp} />
        </div>
      </div>

      <div className="rounded-xl bg-[var(--mint)]/40 px-4 py-3 text-sm text-[var(--teal-deep)]">
        Recibirás el link de acceso por correo tras la compra.
      </div>

      <CouponField
        subtotalClp={product.priceClp}
        onApplied={({ discountClp: d, totalClp: t }) => {
          setDiscountClp(d);
          setTotalClp(t);
        }}
      />

      {discountClp > 0 ? (
        <OrderSummary
          subtotalClp={product.priceClp}
          discountClp={discountClp}
          totalClp={effectiveTotal}
        />
      ) : null}

      <div>
        <label htmlFor="buyerName" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          Tu nombre
        </label>
        <input
          id="buyerName"
          value={buyerName}
          onChange={(e) => setBuyerName(e.target.value)}
          required
          autoComplete="name"
          placeholder="María Pérez"
          className="field"
        />
      </div>
      <div>
        <label htmlFor="buyerEmail" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          Email (aquí llega el link de acceso)
        </label>
        <input
          id="buyerEmail"
          type="email"
          value={buyerEmail}
          onChange={(e) => setBuyerEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="tu@email.cl"
          className="field"
        />
      </div>
      <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
        Pago con Mercado Pago (Checkout Pro). En prueba usa el usuario TEST de MP;
        la comisión de Pagate es $0 — solo aplica la de Mercado Pago.
      </p>
      {error ? (
        <p className="text-sm text-[var(--coral)]" role="alert">{error}</p>
      ) : null}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending
          ? "Redirigiendo a Mercado Pago…"
          : `Pagar con Mercado Pago · ${formatClp(effectiveTotal)}`}
      </button>
    </form>
  );
}
