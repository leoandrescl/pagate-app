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

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <section className="rounded-[1.4rem] border border-dashed border-[var(--line)] bg-white/80 p-5 sm:p-6">
        <p className="font-display text-xl">Mercado Pago</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
          Conecta tu cuenta para que el dinero de cada venta llegue a ti, no a
          Pagate. Solo pedimos permiso para crear links de cobro.
        </p>
        {mpStatus === "connected" ? (
          <p className="mt-3 rounded-xl bg-[var(--mint)]/50 px-3 py-2 text-sm text-[var(--teal-deep)]">
            Cuenta conectada. Los pagos irán a tu Mercado Pago.
          </p>
        ) : mpStatus === "denied" || mpStatus === "error" ? (
          <p className="mt-3 rounded-xl bg-[var(--fog)] px-3 py-2 text-sm text-[var(--coral)]">
            No se pudo conectar. Intenta de nuevo.
          </p>
        ) : null}
        <p className="mt-3 text-sm font-semibold text-[var(--ink)]">
          {mpConnected ? "Conectado" : "No conectado"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {mpConnected ? (
            <form action="/api/mercadopago/disconnect" method="post">
              <input type="hidden" name="next" value="/onboarding/pagos" />
              <button type="submit" className="btn-ghost text-sm">
                Desconectar
              </button>
            </form>
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
              Conectar Mercado Pago
            </a>
          )}
        </div>
        {!mpConfigured ? (
          <p className="mt-3 text-xs text-[var(--ink-muted)]">
            Faltan MP_CLIENT_ID y MP_CLIENT_SECRET en el entorno.
          </p>
        ) : null}
      </section>

      <form action={formAction} className="flex flex-1 flex-col space-y-4">
        <input
          type="hidden"
          name="transferEnabled"
          value={transferEnabled ? "1" : "0"}
        />

        <section className="rounded-[1.4rem] border border-dashed border-[var(--line)] bg-white/80 p-5 sm:p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={transferEnabled}
              onChange={(e) => setTransferEnabled(e.target.checked)}
              className="mt-1 accent-[var(--teal)]"
            />
            <span>
              <span className="block font-display text-xl">Transferencia</span>
              <span className="mt-2 block text-sm leading-relaxed text-[var(--ink-muted)]">
                Pagate no mueve este dinero. Si el comprador elige
                transferencia, le mostramos tus datos bancarios para que pague
                desde su banco. Tú confirmas el pago después en el panel.
              </span>
            </span>
          </label>
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
                placeholder="Email"
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
        </section>

        <p className="text-xs text-[var(--ink-muted)]">
          Los productos gratuitos funcionan sin un medio de pago.
        </p>

        <WizardNav
          backHref="/onboarding/product-type"
          submitLabel="Siguiente →"
          error={state && !state.ok ? state.error : null}
        />
      </form>
    </div>
  );
}
