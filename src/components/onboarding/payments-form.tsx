"use client";

import { useActionState, useState } from "react";
import { savePaymentsAction } from "@/lib/onboarding-actions";
import { WizardNav } from "@/components/onboarding/wizard-nav";
import type { ActionResult } from "@/lib/actions";
import type { PaymentSettings } from "@/lib/types";

const initial: ActionResult | null = null;

export function PaymentsForm({
  defaults,
  mpConnected,
  mpConfigured,
  mpStatus,
}: {
  defaults: PaymentSettings;
  mpConnected: boolean;
  mpConfigured: boolean;
  mpStatus?: string;
}) {
  const [state, formAction] = useActionState(savePaymentsAction, initial);
  const [transferEnabled, setTransferEnabled] = useState(
    defaults.transferEnabled,
  );

  const mpMessage =
    mpStatus === "connected" && mpConnected
      ? "Cuenta conectada. Los cobros llegan a tu Mercado Pago."
      : mpStatus === "connected" && !mpConnected
        ? "Mercado Pago autorizó, pero no quedó guardado. Conecta de nuevo."
        : mpStatus === "denied" || mpStatus === "error"
          ? "No se pudo conectar. Intenta de nuevo."
          : mpConnected
            ? "Listo para cobrar en línea."
            : "El dinero de cada venta llega a ti, no a Pagate.";

  const mpOk =
    mpConnected && mpStatus !== "denied" && mpStatus !== "error";

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <input
        type="hidden"
        name="transferEnabled"
        value={transferEnabled ? "1" : "0"}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="flex flex-col rounded-[1.4rem] border border-dashed border-[var(--line)] bg-white/80 p-4 sm:p-5">
          <p className="font-display text-xl">Mercado Pago</p>
          <p
            className={`mt-2 text-sm leading-relaxed ${
              mpStatus === "denied" || mpStatus === "error"
                ? "text-[var(--coral)]"
                : "text-[var(--ink-muted)]"
            }`}
          >
            {mpMessage}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                mpOk
                  ? "bg-[var(--mint)]/60 text-[var(--teal-deep)]"
                  : "bg-[var(--fog)] text-[var(--ink-muted)]"
              }`}
            >
              {mpConnected ? "Conectado" : "No conectado"}
            </span>
            {mpConnected ? (
              <button
                type="submit"
                formAction="/api/mercadopago/disconnect"
                formMethod="post"
                name="next"
                value="/onboarding/pagos"
                className="btn-ghost text-sm"
              >
                Desconectar
              </button>
            ) : (
              <a
                href={
                  mpConfigured
                    ? "/api/mercadopago/connect?next=/onboarding/pagos"
                    : undefined
                }
                aria-disabled={!mpConfigured}
                className={`btn-primary text-sm ${!mpConfigured ? "pointer-events-none opacity-50" : ""}`}
              >
                Conectar
              </a>
            )}
          </div>
          {!mpConfigured ? (
            <p className="mt-3 text-xs text-[var(--ink-muted)]">
              Faltan MP_CLIENT_ID y MP_CLIENT_SECRET en el entorno.
            </p>
          ) : null}
        </section>

        <section className="rounded-[1.4rem] border border-dashed border-[var(--line)] bg-white/80 p-4 sm:p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={transferEnabled}
              onChange={(e) => setTransferEnabled(e.target.checked)}
              className="mt-1 accent-[var(--teal)]"
            />
            <span>
              <span className="block font-display text-xl">Transferencia</span>
              <span className="mt-1 block text-sm leading-relaxed text-[var(--ink-muted)]">
                Pagate no mueve este dinero. El comprador transfiere desde su
                banco y tú confirmas el pago en el panel.
              </span>
            </span>
          </label>
        </section>
      </div>

      {transferEnabled ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="transferHolder"
            required={transferEnabled}
            defaultValue={defaults.transferHolder ?? ""}
            placeholder="Nombre del titular"
            className="field"
          />
          <input
            name="transferRut"
            defaultValue={defaults.transferRut ?? ""}
            placeholder="RUT"
            className="field"
          />
          <input
            name="transferEmail"
            defaultValue={defaults.transferEmail ?? ""}
            placeholder="Email para el comprobante"
            className="field"
          />
          <input
            name="transferBank"
            required={transferEnabled}
            defaultValue={defaults.transferBank ?? ""}
            placeholder="Banco"
            className="field"
          />
          <input
            name="transferAccount"
            required={transferEnabled}
            defaultValue={defaults.transferAccount ?? ""}
            placeholder="Tipo y número de cuenta"
            className="field sm:col-span-2"
          />
        </div>
      ) : null}

      <p className="mt-4 text-xs text-[var(--ink-muted)]">
        Los productos gratuitos funcionan sin un medio de pago.
      </p>

      <WizardNav
        backHref="/onboarding/product-type"
        submitLabel="Siguiente →"
        error={state && !state.ok ? state.error : null}
      />
    </form>
  );
}
