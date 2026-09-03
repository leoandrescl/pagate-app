"use client";

import { useActionState, useState } from "react";
import { saveProfileAction } from "@/lib/onboarding-actions";
import { WizardNav } from "@/components/onboarding/wizard-nav";
import type { ActionResult } from "@/lib/actions";

const initial: ActionResult | null = null;

export function ProfileForm({
  defaultName,
  defaultBio,
  avatarUrl,
  initials,
}: {
  defaultName: string;
  defaultBio: string;
  avatarUrl?: string | null;
  initials: string;
}) {
  const [state, formAction] = useActionState(saveProfileAction, initial);
  const [bio, setBio] = useState(defaultBio);

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <div className="flex flex-col items-center">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-dashed border-[var(--line)] bg-white text-2xl font-semibold text-[var(--teal)]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">Foto de perfil</p>
        <p className="mt-1 max-w-sm text-center text-xs text-[var(--ink-muted)]">
          Usamos tu foto de Google. Subir otra imagen llega cuando tengamos
          almacenamiento de archivos.
        </p>
      </div>

      <label className="mt-8 block text-sm font-medium text-[var(--ink-muted)]">
        Nombre completo
      </label>
      <input
        name="displayName"
        required
        defaultValue={defaultName}
        placeholder="Ej: Juana Pérez"
        className="field mt-1.5"
      />

      <label className="mt-5 block text-sm font-medium text-[var(--ink-muted)]">
        Bio
      </label>
      <textarea
        name="bio"
        rows={4}
        maxLength={150}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Ej: Fotógrafa de bodas. Vendo presets de Lightroom y sesiones personalizadas."
        className="field mt-1.5 resize-none"
      />
      <p className="mt-1 text-right text-xs text-[var(--ink-muted)]">
        {bio.length}/150
      </p>

      <WizardNav
        backHref="/onboarding/download-expiry"
        submitLabel="Siguiente →"
        error={state && !state.ok ? state.error : null}
      />
    </form>
  );
}
