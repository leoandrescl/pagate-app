"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateStoreAppearanceAction,
  type ActionResult,
} from "@/lib/actions";
import {
  BRAND_COLOR_PRESETS,
  useStoreSettings,
  type StoreSettings,
} from "@/lib/store-settings-context";

const initial: ActionResult | null = null;

export function StoreSettingsPanel() {
  const router = useRouter();
  const { settings, updateSettings } = useStoreSettings();
  const [draft, setDraft] = useState<StoreSettings>(settings);
  const [state, formAction, pending] = useActionState(
    updateStoreAppearanceAction,
    initial,
  );

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    if (!state?.ok) return;
    updateSettings(draft);
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when action result flips to ok
  }, [state]);

  function patchDraft(patch: Partial<StoreSettings>) {
    setDraft((prev) => ({
      ...prev,
      ...patch,
      socialLinks: patch.socialLinks
        ? { ...prev.socialLinks, ...patch.socialLinks }
        : prev.socialLinks,
    }));
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="bannerUrl" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          URL del banner de portada
        </label>
        <input
          id="bannerUrl"
          name="bannerUrl"
          value={draft.bannerUrl}
          onChange={(e) => patchDraft({ bannerUrl: e.target.value })}
          placeholder="https://… (deja vacío para quitarlo)"
          className="field"
        />
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          Imagen ancha recomendada (1200×400 px). Vacío = sin banner.
        </p>
      </div>

      <div>
        <label htmlFor="headline" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          Titular
        </label>
        <input
          id="headline"
          name="headline"
          value={draft.headline}
          onChange={(e) => patchDraft({ headline: e.target.value })}
          required
          minLength={4}
          className="field"
        />
      </div>

      <div>
        <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          Bio corta
        </label>
        <textarea
          id="bio"
          name="bio"
          value={draft.bio}
          onChange={(e) => patchDraft({ bio: e.target.value })}
          rows={3}
          maxLength={300}
          className="field resize-y"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-[var(--ink-muted)]">
          Redes sociales
        </legend>
        <div className="space-y-3">
          <input
            name="instagram"
            value={draft.socialLinks.instagram ?? ""}
            onChange={(e) =>
              patchDraft({
                socialLinks: { ...draft.socialLinks, instagram: e.target.value },
              })
            }
            placeholder="Instagram URL"
            className="field"
          />
          <input
            name="tiktok"
            value={draft.socialLinks.tiktok ?? ""}
            onChange={(e) =>
              patchDraft({
                socialLinks: { ...draft.socialLinks, tiktok: e.target.value },
              })
            }
            placeholder="TikTok URL"
            className="field"
          />
          <input
            name="whatsapp"
            value={draft.socialLinks.whatsapp ?? ""}
            onChange={(e) =>
              patchDraft({
                socialLinks: { ...draft.socialLinks, whatsapp: e.target.value },
              })
            }
            placeholder="WhatsApp URL (wa.me/…)"
            className="field"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-medium text-[var(--ink-muted)]">
          Color de marca
        </legend>
        <input type="hidden" name="brandColor" value={draft.brandColor} />
        <div className="flex flex-wrap gap-2">
          {BRAND_COLOR_PRESETS.map((preset) => {
            const active = draft.brandColor === preset.value;
            return (
              <button
                key={preset.id}
                type="button"
                title={preset.label}
                onClick={() => patchDraft({ brandColor: preset.value })}
                className={`h-10 w-10 rounded-full border-2 transition ${
                  active
                    ? "border-[var(--ink)] scale-110 shadow-md"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: preset.value }}
                aria-label={preset.label}
                aria-pressed={active}
              />
            );
          })}
        </div>
        <p className="mt-2 text-xs text-[var(--ink-muted)]">
          El color se aplica a botones y acentos en tu vitrina pública.
        </p>
      </fieldset>

      {state && !state.ok ? (
        <p className="text-sm text-[var(--coral)]" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-[var(--teal-deep)]">
          Cambios guardados. Ya se ven en tu vitrina pública.
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
