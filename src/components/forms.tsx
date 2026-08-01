"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addProductAction,
  checkoutAction,
  updateAvailabilityAction,
  type ActionResult,
} from "@/lib/actions";
import { formatSlotChile } from "@/lib/slots";
import type { ProductType } from "@/lib/types";

const initial: ActionResult | null = null;

export function AddProductForm() {
  const [state, formAction, pending] = useActionState(addProductAction, initial);
  const [type, setType] = useState<ProductType>("digital");

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          Tipo
        </label>
        <div className="flex gap-2">
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm has-[:checked]:border-[var(--teal)] has-[:checked]:bg-[var(--mint)]/40">
            <input
              type="radio"
              name="type"
              value="digital"
              checked={type === "digital"}
              onChange={() => setType("digital")}
            />
            PDF / digital
          </label>
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm has-[:checked]:border-[var(--teal)] has-[:checked]:bg-[var(--mint)]/40">
            <input
              type="radio"
              name="type"
              value="session"
              checked={type === "session"}
              onChange={() => setType("session")}
            />
            Sesión 1:1
          </label>
        </div>
      </div>
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder={
            type === "session"
              ? "Ej. Mentoría 45 minutos"
              : "Ej. Guía de finanzas personales"
          }
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="priceClp" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
            Precio (CLP)
          </label>
          <input
            id="priceClp"
            name="priceClp"
            required
            inputMode="numeric"
            placeholder={type === "session" ? "35000" : "7990"}
            className="field"
          />
        </div>
        {type === "session" ? (
          <div>
            <label
              htmlFor="durationMinutes"
              className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]"
            >
              Duración (min)
            </label>
            <select id="durationMinutes" name="durationMinutes" className="field" defaultValue="45">
              <option value="30">30</option>
              <option value="45">45</option>
              <option value="60">60</option>
            </select>
          </div>
        ) : null}
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

export function AvailabilityForm({
  startHour,
  endHour,
  slotMinutes,
}: {
  startHour: number;
  endHour: number;
  slotMinutes: number;
}) {
  const [state, formAction, pending] = useActionState(
    updateAvailabilityAction,
    initial,
  );

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-xs text-[var(--ink-muted)]">
        Lun–vie · zona America/Santiago. Si Google está conectado, los horarios
        ocupados se excluyen automáticamente.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="startHour" className="mb-1 block text-xs text-[var(--ink-muted)]">
            Desde
          </label>
          <select id="startHour" name="startHour" className="field" defaultValue={startHour}>
            <option value="9">09:00</option>
            <option value="10">10:00</option>
            <option value="11">11:00</option>
          </select>
        </div>
        <div>
          <label htmlFor="endHour" className="mb-1 block text-xs text-[var(--ink-muted)]">
            Hasta
          </label>
          <select id="endHour" name="endHour" className="field" defaultValue={endHour}>
            <option value="16">16:00</option>
            <option value="17">17:00</option>
            <option value="18">18:00</option>
            <option value="19">19:00</option>
          </select>
        </div>
        <div>
          <label htmlFor="slotMinutes" className="mb-1 block text-xs text-[var(--ink-muted)]">
            Bloque
          </label>
          <select
            id="slotMinutes"
            name="slotMinutes"
            className="field"
            defaultValue={slotMinutes}
          >
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
          </select>
        </div>
      </div>
      {state && !state.ok ? (
        <p className="text-sm text-[var(--coral)]">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-[var(--teal-deep)]">Disponibilidad actualizada.</p>
      ) : null}
      <button type="submit" disabled={pending} className="btn-ghost text-sm">
        {pending ? "Guardando…" : "Guardar horarios"}
      </button>
    </form>
  );
}

export function CheckoutForm({
  productId,
  productName,
  productType,
  priceLabel,
  durationMinutes,
  slots,
  googleConnected = false,
}: {
  productId: string;
  productName: string;
  productType: ProductType;
  priceLabel: string;
  durationMinutes?: number;
  slots: string[];
  googleConnected?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(checkoutAction, initial);
  const [selectedSlot, setSelectedSlot] = useState(slots[0] ?? "");

  useEffect(() => {
    if (state?.ok && state.redirectTo) {
      // Checkout Pro (Mercado Pago) u otras URLs absolutas
      if (state.redirectTo.startsWith("http")) {
        window.location.href = state.redirectTo;
      } else {
        router.push(state.redirectTo);
      }
    }
  }, [state, router]);

  const isSession = productType === "session";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="productType" value={productType} />
      {isSession ? (
        <input type="hidden" name="slotStart" value={selectedSlot} />
      ) : null}

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/70 p-4">
        <p className="text-sm text-[var(--ink-muted)]">
          {isSession ? "Vas a agendar" : "Vas a comprar"}
        </p>
        <p className="mt-1 font-display text-xl text-[var(--ink)]">{productName}</p>
        {isSession && durationMinutes ? (
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{durationMinutes} minutos · videollamada</p>
        ) : null}
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--teal-deep)]">
          {priceLabel}
        </p>
      </div>

      {isSession ? (
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--ink-muted)]">Elige un horario</p>
          {slots.length === 0 ? (
            <p className="rounded-xl bg-[var(--fog)] px-3 py-2 text-sm text-[var(--coral)]">
              No hay horarios libres. Prueba reiniciar la demo o ajustar disponibilidad.
            </p>
          ) : (
            <div className="grid max-h-52 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {slots.map((slot) => {
                const active = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                      active
                        ? "border-[var(--teal)] bg-[var(--mint)]/50 text-[var(--teal-deep)]"
                        : "border-[var(--line)] bg-white/70 hover:border-[var(--teal)]/50"
                    }`}
                  >
                    {formatSlotChile(slot)}
                  </button>
                );
              })}
            </div>
          )}
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            {googleConnected
              ? "Horarios sincronizados con Google Calendar · Meet real al confirmar"
              : "Agenda local · conecta Google Calendar en el panel para Meet real"}
          </p>
        </div>
      ) : null}

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
          {isSession
            ? "Email (confirmación de la cita)"
            : "Email (aquí llega el link de descarga)"}
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
        Pago con Mercado Pago (Checkout Pro). En prueba usa el usuario TEST de MP;
        la comisión de Pagate es $0 — solo aplica la de Mercado Pago.
      </p>
      {state && !state.ok ? (
        <p className="text-sm text-[var(--coral)]" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || (isSession && !selectedSlot)}
        className="btn-primary w-full"
      >
        {pending
          ? "Redirigiendo a Mercado Pago…"
          : isSession
            ? `Reservar y pagar ${priceLabel}`
            : `Pagar con Mercado Pago · ${priceLabel}`}
      </button>
    </form>
  );
}
