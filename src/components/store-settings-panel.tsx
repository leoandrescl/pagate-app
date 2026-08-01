"use client";

import { BRAND_COLOR_PRESETS, useStoreSettings } from "@/lib/store-settings-context";

export function StoreSettingsPanel() {
  const { settings, updateSettings } = useStoreSettings();

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="bannerUrl" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          URL del banner de portada
        </label>
        <input
          id="bannerUrl"
          value={settings.bannerUrl}
          onChange={(e) => updateSettings({ bannerUrl: e.target.value })}
          placeholder="https://…"
          className="field"
        />
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          Imagen ancha recomendada (1200×400 px). Se guarda localmente en tu navegador.
        </p>
      </div>

      <div>
        <label htmlFor="headline" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          Titular
        </label>
        <input
          id="headline"
          value={settings.headline}
          onChange={(e) => updateSettings({ headline: e.target.value })}
          className="field"
        />
      </div>

      <div>
        <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          Bio corta
        </label>
        <textarea
          id="bio"
          value={settings.bio}
          onChange={(e) => updateSettings({ bio: e.target.value })}
          rows={3}
          className="field resize-y"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-[var(--ink-muted)]">
          Redes sociales
        </legend>
        <div className="space-y-3">
          <input
            value={settings.socialLinks.instagram ?? ""}
            onChange={(e) =>
              updateSettings({
                socialLinks: { ...settings.socialLinks, instagram: e.target.value },
              })
            }
            placeholder="Instagram URL"
            className="field"
          />
          <input
            value={settings.socialLinks.tiktok ?? ""}
            onChange={(e) =>
              updateSettings({
                socialLinks: { ...settings.socialLinks, tiktok: e.target.value },
              })
            }
            placeholder="TikTok URL"
            className="field"
          />
          <input
            value={settings.socialLinks.whatsapp ?? ""}
            onChange={(e) =>
              updateSettings({
                socialLinks: { ...settings.socialLinks, whatsapp: e.target.value },
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
        <div className="flex flex-wrap gap-2">
          {BRAND_COLOR_PRESETS.map((preset) => {
            const active = settings.brandColor === preset.value;
            return (
              <button
                key={preset.id}
                type="button"
                title={preset.label}
                onClick={() => updateSettings({ brandColor: preset.value })}
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

      <p className="rounded-xl bg-[var(--fog)] px-3 py-2 text-xs text-[var(--ink-muted)]">
        // MOCK: los cambios se guardan en localStorage del navegador, no en el servidor.
      </p>
    </div>
  );
}
