import { isMercadoPagoConfigured } from "@/lib/mercadopago";

export function MercadoPagoCard() {
  const configured = isMercadoPagoConfigured();
  const fee = process.env.MP_MARKETPLACE_FEE ?? "0";

  return (
    <section className="animate-rise rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-6 backdrop-blur-sm sm:p-8">
      <h2 className="font-display text-2xl">Mercado Pago</h2>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        Demo con la cuenta de Pagate (Checkout Pro). Más adelante cada
        profesional conectará la suya por OAuth.
      </p>
      <div className="mt-5 rounded-2xl bg-[var(--fog)] p-4">
        <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">Estado</p>
        <p className="mt-1 font-semibold text-[var(--ink)]">
          {configured ? "Credenciales activas" : "Sin configurar"}
        </p>
        <p className="mt-2 text-xs text-[var(--ink-muted)]">
          Comisión Pagate: ${fee} · Checkout Pro
        </p>
      </div>
    </section>
  );
}
