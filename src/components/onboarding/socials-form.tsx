"use client";

import { useActionState } from "react";
import { finishOnboardingAction } from "@/lib/onboarding-actions";
import { WizardNav } from "@/components/onboarding/wizard-nav";
import type { ActionResult } from "@/lib/actions";
import type { StoreSocialLinks } from "@/lib/types";

const initial: ActionResult | null = null;

export function SocialsForm({ defaults }: { defaults: StoreSocialLinks }) {
  const [state, formAction] = useActionState(finishOnboardingAction, initial);

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
            Instagram
          </label>
          <input
            name="instagram"
            defaultValue={defaults.instagram ?? ""}
            placeholder="https://instagram.com/tuusuario"
            className="field"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
            TikTok
          </label>
          <input
            name="tiktok"
            defaultValue={defaults.tiktok ?? ""}
            placeholder="https://tiktok.com/@tuusuario"
            className="field"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
            WhatsApp
          </label>
          <input
            name="whatsapp"
            defaultValue={defaults.whatsapp ?? ""}
            placeholder="https://wa.me/56912345678"
            className="field"
          />
        </div>
      </div>
      <p className="mt-4 text-sm text-[var(--ink-muted)]">
        Opcional. Puedes dejarlo vacío y agregarlo después en el panel.
      </p>
      <WizardNav
        backHref="/onboarding/profile"
        submitLabel="Finalizar"
        error={state && !state.ok ? state.error : null}
      />
    </form>
  );
}
