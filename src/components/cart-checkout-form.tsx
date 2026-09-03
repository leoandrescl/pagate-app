"use client";

import { useState, useEffect } from "react";
import { formatClp } from "@/lib/format-clp";
import { useCart } from "@/lib/cart-context";
import { CouponField, OrderSummary } from "@/components/coupon-field";
import { formatSlotChile } from "@/lib/slots";
import { checkoutCartAction } from "@/lib/actions";
import { PaymentMethodPicker } from "@/components/payment-method-picker";

type Props = {
  slotsByProduct: Record<string, string[]>;
  googleConnected: boolean;
  mercadopagoEnabled?: boolean;
  transferEnabled?: boolean;
};

export function CartCheckoutForm({
  slotsByProduct,
  googleConnected,
  mercadopagoEnabled = false,
  transferEnabled = false,
}: Props) {
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
  const [paymentMethod, setPaymentMethod] = useState<"mercadopago" | "transfer">(
    mercadopagoEnabled ? "mercadopago" : "transfer",
  );

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
        paymentMethod,
      });
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return;
      }
      if (result.redirectTo) {
        clearCart();
        window.location.href = result.redirectTo;
        return;
      }
      setError("No se recibió la URL de pago.");
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

      <PaymentMethodPicker
        mercadopago={mercadopagoEnabled}
        transfer={transferEnabled}
        value={paymentMethod}
        onChange={setPaymentMethod}
      />

      <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
        {paymentMethod === "transfer"
          ? "Después verás los datos para transferir. El vendedor confirma el pago y ahí se libera la entrega."
          : "Pagas con Mercado Pago. El dinero llega a la cuenta del vendedor."}
      </p>

      {error ? (
        <p className="text-sm text-[var(--coral)]" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || (!mercadopagoEnabled && !transferEnabled)}
        className="btn-primary w-full"
      >
        {pending
          ? paymentMethod === "transfer"
            ? "Preparando datos de transferencia…"
            : "Redirigiendo a Mercado Pago…"
          : paymentMethod === "transfer"
            ? `Ver datos para transferir · ${formatClp(effectiveTotal)}`
            : `Pagar con Mercado Pago · ${formatClp(effectiveTotal)}`}
      </button>
    </form>
  );
}
