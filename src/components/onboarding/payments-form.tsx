"use client";

import { useActionState, useState } from "react";
import { savePaymentsAction } from "@/lib/onboarding-actions";
import { WizardNav } from "@/components/onboarding/wizard-nav";
import type { ActionResult } from "@/lib/actions";
import type { PaymentSettings } from "@/lib/types";

const initial: ActionResult | null = null;

export function PaymentsForm({
  defaults,
}: {
  defaults: PaymentSettings;
}) {
  const [state, formAction] = useActionState(savePaymentsAction, initial);
  const [goCuotas, setGoCuotas] = useState(defaults.goCuotas);
  const [transferEnabled, setTransferEnabled] = useState(
    defaults.transferEnabled,
  );

  return (
    <form action={formAction} className="flex flex-1 flex-col space-y-4">
      <input type="hidden" name="goCuotas" value={goCuotas ? "1" : "0"} />
      <input
        type="hidden"
        name="transferEnabled"
        value={transferEnabled ? "1" : "0"}
      />

      <section className="rounded-[1.4rem] border border-dashed border-[var(--line)] bg-white/80 p-5 sm:p-6">
        <p className="font-display text-xl">Mercado Pago</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
          Hoy Pagate cobra con la cuenta de la plataforma. Conectar tu propia
          cuenta llega después, desde el panel. No hace falta hacerlo ahora.
        </p>
        <p className="mt-4 text-xs text-[var(--ink-muted)]">
          Los productos gratuitos funcionan sin un medio de pago.
        </p>
      </section>

      <section className="rounded-[1.4rem] border border-dashed border-[var(--line)] bg-white/80 p-5 sm:p-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={goCuotas}
            onChange={(e) => setGoCuotas(e.target.checked)}
            className="mt-1 accent-[var(--teal)]"
          />
          <span>
            <span className="block font-display text-xl">Go Cuotas</span>
            <span className="mt-1 block text-xs font-semibold text-[var(--teal)]">
              2x 3x 4x
            </span>
            <span className="mt-2 block text-sm leading-relaxed text-[var(--ink-muted)]">
              Queda marcado para más adelante. Aún no habilitamos el cobro en
              cuotas en el checkout.
            </span>
          </span>
        </label>
      </section>

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
              Guardamos tus datos. El pago por transferencia en la tienda se
              activa en una siguiente versión.
            </span>
          </span>
        </label>
        {transferEnabled ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              name="transferHolder"
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
              defaultValue={defaults.transferBank ?? ""}
              placeholder="Banco"
              className="field"
            />
            <input
              name="transferAccount"
              defaultValue={defaults.transferAccount ?? ""}
              placeholder="Número de cuenta"
              className="field sm:col-span-2"
            />
          </div>
        ) : null}
      </section>

      <WizardNav
        backHref="/onboarding/product-type"
        submitLabel="Siguiente →"
        error={state && !state.ok ? state.error : null}
      />
    </form>
  );
}
