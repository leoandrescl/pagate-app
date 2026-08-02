"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createStoreAction, type ActionResult } from "@/lib/actions";
import { seedClientStoreSettings } from "@/lib/store-settings-context";

const initial: ActionResult | null = null;

export function CreateStoreForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createStoreAction, initial);
  const [username, setUsername] = useState("");
  const [addFirstProduct, setAddFirstProduct] = useState(true);
  const [productType, setProductType] = useState<"digital" | "session">(
    "digital",
  );

  useEffect(() => {
    if (!state?.ok || !state.redirectTo) return;
    const form = document.getElementById(
      "create-store-form",
    ) as HTMLFormElement | null;
    const headline =
      (form?.elements.namedItem("headline") as HTMLInputElement | null)
        ?.value ?? "";
    const bio =
      (form?.elements.namedItem("bio") as HTMLTextAreaElement | null)?.value ??
      "";
    seedClientStoreSettings({ headline, bio });
    router.push(state.redirectTo);
  }, [state, router]);

  const previewUser =
    username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "") || "tu-usuario";

  return (
    <form
      id="create-store-form"
      action={formAction}
      className="space-y-5 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 backdrop-blur-sm sm:p-8"
    >
      <div>
        <label
          htmlFor="username"
          className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]"
        >
          Usuario (link de tu tienda)
        </label>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-[var(--ink-muted)]">
            /u/
          </span>
          <input
            id="username"
            name="username"
            required
            autoComplete="username"
            placeholder="ana.coach"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="field"
            maxLength={24}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--ink-muted)]">
          Tu tienda quedará en{" "}
          <span className="font-semibold text-[var(--ink)]">
            /u/{previewUser}
          </span>
        </p>
      </div>

      <div>
        <label
          htmlFor="displayName"
          className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]"
        >
          Nombre público
        </label>
        <input
          id="displayName"
          name="displayName"
          required
          placeholder="Ana Rojas"
          className="field"
        />
      </div>

      <div>
        <label
          htmlFor="headline"
          className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]"
        >
          Headline
        </label>
        <input
          id="headline"
          name="headline"
          required
          placeholder="Coach de hábitos · sesiones 1:1"
          className="field"
        />
      </div>

      <div>
        <label
          htmlFor="bio"
          className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]"
        >
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          required
          rows={3}
          placeholder="Cuéntale a tus clientes qué ofreces y para quién es."
          className="field resize-y"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--fog)]/60 px-4 py-3">
        <input
          type="checkbox"
          name="addFirstProduct"
          value="1"
          checked={addFirstProduct}
          onChange={(e) => setAddFirstProduct(e.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-semibold text-[var(--ink)]">
            Agregar mi primer producto
          </span>
          <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">
            Opcional. También puedes publicar después desde el panel.
          </span>
        </span>
      </label>

      {addFirstProduct ? (
        <div className="space-y-4 rounded-xl border border-[var(--line)] bg-white/70 p-4">
          <div className="flex flex-wrap gap-2">
            <label className="flex flex-1 min-w-[7rem] cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm has-[:checked]:border-[var(--teal)] has-[:checked]:bg-[var(--mint)]/40">
              <input
                type="radio"
                name="productType"
                value="digital"
                checked={productType === "digital"}
                onChange={() => setProductType("digital")}
                className="accent-[var(--teal)]"
              />
              Digital
            </label>
            <label className="flex flex-1 min-w-[7rem] cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm has-[:checked]:border-[var(--teal)] has-[:checked]:bg-[var(--mint)]/40">
              <input
                type="radio"
                name="productType"
                value="session"
                checked={productType === "session"}
                onChange={() => setProductType("session")}
                className="accent-[var(--teal)]"
              />
              Sesión 1:1
            </label>
          </div>
          <div>
            <label
              htmlFor="productName"
              className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]"
            >
              Nombre del producto
            </label>
            <input
              id="productName"
              name="productName"
              required={addFirstProduct}
              placeholder={
                productType === "session"
                  ? "Ej. Mentoría 45 minutos"
                  : "Ej. Guía de meal prep"
              }
              className="field"
            />
          </div>
          <div>
            <label
              htmlFor="productDescription"
              className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]"
            >
              Descripción
            </label>
            <textarea
              id="productDescription"
              name="productDescription"
              required={addFirstProduct}
              rows={2}
              placeholder="Qué recibe el comprador."
              className="field resize-y"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="productPriceClp"
                className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]"
              >
                Precio (CLP)
              </label>
              <input
                id="productPriceClp"
                name="productPriceClp"
                required={addFirstProduct}
                inputMode="numeric"
                placeholder={productType === "session" ? "35000" : "7990"}
                className="field"
              />
            </div>
            {productType === "session" ? (
              <div>
                <label
                  htmlFor="productDurationMinutes"
                  className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]"
                >
                  Duración (min)
                </label>
                <input
                  id="productDurationMinutes"
                  name="productDurationMinutes"
                  type="number"
                  min={15}
                  max={180}
                  defaultValue={45}
                  className="field"
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {state && !state.ok ? (
        <p className="rounded-xl bg-[var(--fog)] px-3 py-2 text-sm text-[var(--coral)]">
          {state.error}
        </p>
      ) : null}

      <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
        Demo sin cuenta real: al crear, reemplazas la tienda de ejemplo en este
        entorno. Puedes volver a Camila con “Reiniciar demo” en el panel.
      </p>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Creando tienda…" : "Crear mi tienda"}
      </button>
    </form>
  );
}
