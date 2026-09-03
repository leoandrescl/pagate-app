"use client";

export function PaymentMethodPicker({
  mercadopago,
  transfer,
  value,
  onChange,
}: {
  mercadopago: boolean;
  transfer: boolean;
  value: "mercadopago" | "transfer";
  onChange: (value: "mercadopago" | "transfer") => void;
}) {
  if (!mercadopago && !transfer) {
    return (
      <p className="rounded-xl bg-[var(--fog)] px-3 py-2 text-sm text-[var(--coral)]">
        Esta tienda aún no tiene un medio de pago. El creador debe conectar
        Mercado Pago o dejar datos de transferencia.
      </p>
    );
  }

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-medium text-[var(--ink-muted)]">
        Cómo pagas
      </legend>
      {mercadopago ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] bg-white/70 px-3 py-3 has-[:checked]:border-[var(--teal)] has-[:checked]:bg-[var(--mint)]/30">
          <input
            type="radio"
            name="paymentMethod"
            value="mercadopago"
            checked={value === "mercadopago"}
            onChange={() => onChange("mercadopago")}
            className="mt-1 accent-[var(--teal)]"
          />
          <span>
            <span className="block text-sm font-semibold">Mercado Pago</span>
            <span className="text-xs text-[var(--ink-muted)]">
              Pagas en línea. El dinero llega a la cuenta del vendedor.
            </span>
          </span>
        </label>
      ) : null}
      {transfer ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] bg-white/70 px-3 py-3 has-[:checked]:border-[var(--teal)] has-[:checked]:bg-[var(--mint)]/30">
          <input
            type="radio"
            name="paymentMethod"
            value="transfer"
            checked={value === "transfer"}
            onChange={() => onChange("transfer")}
            className="mt-1 accent-[var(--teal)]"
          />
          <span>
            <span className="block text-sm font-semibold">Transferencia</span>
            <span className="text-xs text-[var(--ink-muted)]">
              Te mostramos los datos bancarios del vendedor para que transfieras
              tú desde tu banco.
            </span>
          </span>
        </label>
      ) : null}
    </fieldset>
  );
}
