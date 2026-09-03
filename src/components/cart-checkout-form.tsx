"use client";

import { useState, useEffect } from "react";
import { formatClp } from "@/lib/format-clp";
import { useCart } from "@/lib/cart-context";
import { CouponField, OrderSummary } from "@/components/coupon-field";
import { InstallmentBadge } from "@/components/installment-badge";
import { formatSlotChile } from "@/lib/slots";
import { checkoutCartAction } from "@/lib/actions";

type Props = {
  slotsByProduct: Record<string, string[]>;
  googleConnected: boolean;
};

export function CartCheckoutForm({ slotsByProduct, googleConnected }: Props) {
  const {
    username,
    items,
    subtotalClp,
    sessionSlots,
    setSessionSlot,
    clearCart,
  } = useCart();
  const [discountClp, setDiscountClp] = useState(0);
  const [totalClp, setTotalClp] = useState(subtotalClp);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionItems = items.filter((i) => i.type === "session");
  const effectiveTotal = totalClp || subtotalClp;

  useEffect(() => {
    setTotalClp(subtotalClp - discountClp);
  }, [subtotalClp, discountClp]);

  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        No hay productos en el carrito.{" "}
        <a
          href={`/u/${username}`}
          className="text-[var(--teal-deep)] underline"
        >
          Volver a la tienda
        </a>
      </p>
    );
  }

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

    for (const item of sessionItems) {
      if (!sessionSlots[item.productId]) {
        setError(`Elige un horario para "${item.name}".`);
        return;
      }
    }

    setPending(true);
    try {
      const result = await checkoutCartAction({
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          priceClp: item.priceClp,
          quantity: item.quantity,
          type: item.type,
        })),
        sessionSlots,
        buyerName,
        buyerEmail,
      });
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return;
      }
      if (result.redirectTo?.startsWith("http")) {
        clearCart();
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/70 p-4">
        <p className="text-sm text-[var(--ink-muted)]">Resumen de compra</p>
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between text-sm">
              <span className="text-[var(--ink)]">
                {item.name}
                {item.quantity > 1 ? ` × ${item.quantity}` : ""}
              </span>
              <span className="font-semibold text-[var(--teal-deep)]">
                {formatClp(item.priceClp * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {sessionItems.map((item) => {
        const slots = slotsByProduct[item.productId] ?? [];
        const selected = sessionSlots[item.productId] ?? slots[0] ?? "";
        return (
          <div key={item.productId}>
            <p className="mb-2 text-sm font-medium text-[var(--ink-muted)]">
              Horario para {item.name}
            </p>
            {slots.length === 0 ? (
              <p className="rounded-xl bg-[var(--fog)] px-3 py-2 text-sm text-[var(--coral)]">
                No hay horarios libres para esta sesión.
              </p>
            ) : (
              <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {slots.map((slot) => {
                  const active = selected === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSessionSlot(item.productId, slot)}
                      className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                        active
                          ? "border-[var(--teal)] bg-[var(--mint)]/50 text-[var(--teal-deep)]"
                          : "border-[var(--line)] bg-white/70 hover:border-[var(--teal)]/50"
                      }`}
                    >
                      {formatSlotChile(slot)}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              {googleConnected
                ? "Horarios sincronizados con Google Calendar · zona America/Santiago"
                : "Agenda local · conecta Google Calendar en el panel para Meet real"}
            </p>
          </div>
        );
      })}

      {items.some((i) => i.type === "community") ? (
        <div className="rounded-xl bg-[var(--mint)]/40 px-4 py-3 text-sm text-[var(--teal-deep)]">
          Recibirás el link de acceso a la comunidad por correo tras la compra.
        </div>
      ) : null}

      <CouponField
        subtotalClp={subtotalClp}
        onApplied={({ discountClp: d, totalClp: t }) => {
          setDiscountClp(d);
          setTotalClp(t);
        }}
      />

      <OrderSummary
        subtotalClp={subtotalClp}
        discountClp={discountClp}
        totalClp={effectiveTotal}
      />

      <InstallmentBadge amountClp={effectiveTotal} />

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
          Email (confirmación y accesos)
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
        <p className="text-sm text-[var(--coral)]" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending
          ? "Redirigiendo a Mercado Pago…"
          : `Pagar con Mercado Pago · ${formatClp(effectiveTotal)}`}
      </button>
    </form>
  );
}
