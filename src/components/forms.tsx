"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  addProductAction,
  checkoutAction,
  type ActionResult,
} from "@/lib/actions";

const initial: ActionResult | null = null;

export function AddProductForm() {
  const [state, formAction, pending] = useActionState(addProductAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          Nombre del producto
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Ej. Guía de finanzas personales"
          className="field"
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={3}
          placeholder="Qué recibe el comprador y por qué le sirve."
          className="field resize-y"
        />
      </div>
      <div>
        <label htmlFor="priceClp" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          Precio (CLP)
        </label>
        <input
          id="priceClp"
          name="priceClp"
          required
          inputMode="numeric"
          placeholder="7990"
          className="field"
        />
      </div>
      {state && !state.ok ? (
        <p className="text-sm text-[var(--coral)]" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-[var(--teal-deep)]">Producto publicado en tu vitrina.</p>
      ) : null}
      <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
        {pending ? "Publicando…" : "Publicar producto"}
      </button>
    </form>
  );
}

export function CheckoutForm({
  productId,
  productName,
  priceLabel,
}: {
  productId: string;
  productName: string;
  priceLabel: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(checkoutAction, initial);

  useEffect(() => {
    if (state?.ok && state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/70 p-4">
        <p className="text-sm text-[var(--ink-muted)]">Vas a comprar</p>
        <p className="mt-1 font-display text-xl text-[var(--ink)]">{productName}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--teal-deep)]">
          {priceLabel}
        </p>
      </div>
      <div>
        <label htmlFor="buyerName" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          Tu nombre
        </label>
        <input
          id="buyerName"
          name="buyerName"
          required
          autoComplete="name"
          placeholder="María Pérez"
          className="field"
        />
      </div>
      <div>
        <label htmlFor="buyerEmail" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          Email (aquí llega el link de descarga)
        </label>
        <input
          id="buyerEmail"
          name="buyerEmail"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@email.cl"
          className="field"
        />
      </div>
      <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
        Demo: el pago simula Webpay / transferencia vía Flow. No se cobra nada real.
      </p>
      {state && !state.ok ? (
        <p className="text-sm text-[var(--coral)]" role="alert">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Procesando pago mock…" : `Pagar ${priceLabel}`}
      </button>
    </form>
  );
}
