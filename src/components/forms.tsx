"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addProductAction,
  checkoutAction,
  updateAvailabilityAction,
  type ActionResult,
} from "@/lib/actions";
import { CouponField, OrderSummary } from "@/components/coupon-field";
import { formatSlotChile } from "@/lib/slots";
import type { CommunityPlatform } from "@/lib/mock-data";
import { useStoreSettings } from "@/lib/store-settings-context";
import type { ProductType } from "@/lib/types";
import { PaymentMethodPicker } from "@/components/payment-method-picker";

const initial: ActionResult | null = null;

type ProductFormType = ProductType | "community";

export function AddProductForm() {
  const [state, formAction, pending] = useActionState(addProductAction, initial);
  const { addCommunityProduct } = useStoreSettings();
  const [type, setType] = useState<ProductFormType>("digital");
  const [communityPlatform, setCommunityPlatform] = useState<CommunityPlatform>("whatsapp");
  const [communityInvite, setCommunityInvite] = useState("");
  const [communitySuccess, setCommunitySuccess] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);

  function handleCommunitySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = String(new FormData(form).get("name") ?? "").trim();
    const description = String(new FormData(form).get("description") ?? "").trim();
    const priceRaw = String(new FormData(form).get("priceClp") ?? "").replace(/\D/g, "");
    const priceClp = Number(priceRaw);

    if (!name || name.length < 3) {
      setCommunityError("Ingresa un nombre para el producto (mín. 3 caracteres).");
      return;
    }
    if (!description || description.length < 10) {
      setCommunityError("Agrega una descripción corta.");
      return;
    }
    if (!Number.isFinite(priceClp) || priceClp < 1000) {
      setCommunityError("El precio mínimo demo es $1.000 CLP.");
      return;
    }
    if (!communityInvite.trim()) {
      setCommunityError("Ingresa el link de invitación.");
      return;
    }

    addCommunityProduct({
      name,
      description,
      priceClp,
      platform: communityPlatform,
      inviteUrl: communityInvite.trim(),
    });
    setCommunityError(null);
    setCommunitySuccess(true);
    form.reset();
    setCommunityInvite("");
    setTimeout(() => setCommunitySuccess(false), 4000);
  }

  if (type === "community") {
    return (
      <form onSubmit={handleCommunitySubmit} className="space-y-4">
        <ProductTypeSelector type={type} setType={setType} />
        <ProductFields type={type} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
            Plataforma
          </label>
          <select
            value={communityPlatform}
            onChange={(e) => setCommunityPlatform(e.target.value as CommunityPlatform)}
            className="field"
          >
            <option value="telegram">Telegram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="zoom">Zoom</option>
          </select>
        </div>
        <div>
          <label htmlFor="inviteUrl" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
            Link de invitación
          </label>
          <input
            id="inviteUrl"
            value={communityInvite}
            onChange={(e) => setCommunityInvite(e.target.value)}
            required
            placeholder="https://chat.whatsapp.com/…"
            className="field"
          />
        </div>
        {communityError ? (
          <p className="text-sm text-[var(--coral)]" role="alert">{communityError}</p>
        ) : null}
        {communitySuccess ? (
          <p className="text-sm text-[var(--teal-deep)]">
            Producto de comunidad agregado a la vitrina (local).
          </p>
        ) : null}
        <button type="submit" className="btn-primary w-full sm:w-auto">
          Publicar acceso a comunidad
        </button>
        <p className="text-xs text-[var(--ink-muted)]">
          // MOCK: se guarda en localStorage, visible en la vitrina pública.
        </p>
      </form>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="type" value={type} />
      <ProductTypeSelector type={type} setType={setType} />
      <ProductFields type={type} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2" />
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

function ProductTypeSelector({
  type,
  setType,
}: {
  type: ProductFormType;
  setType: (t: ProductFormType) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
        Tipo
      </label>
      <div className="flex flex-wrap gap-2">
        <label className="flex flex-1 min-w-[7rem] cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm has-[:checked]:border-[var(--teal)] has-[:checked]:bg-[var(--mint)]/40">
          <input
            type="radio"
            name="type"
            value="digital"
            checked={type === "digital"}
            onChange={() => setType("digital")}
          />
          PDF / digital
        </label>
        <label className="flex flex-1 min-w-[7rem] cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm has-[:checked]:border-[var(--teal)] has-[:checked]:bg-[var(--mint)]/40">
          <input
            type="radio"
            name="type"
            value="session"
            checked={type === "session"}
            onChange={() => setType("session")}
          />
          Sesión 1:1
        </label>
        <label className="flex flex-1 min-w-[7rem] cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm has-[:checked]:border-[var(--teal)] has-[:checked]:bg-[var(--mint)]/40">
          <input
            type="radio"
            name="type"
            value="community"
            checked={type === "community"}
            onChange={() => setType("community")}
          />
          Acceso a comunidad
        </label>
      </div>
    </div>
  );
}

function ProductFields({ type }: { type: ProductFormType }) {
  return (
    <>
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
              : type === "community"
                ? "Ej. Comunidad de nutrición"
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
      <div>
        <label htmlFor="priceClp" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          Precio (CLP)
        </label>
        <input
          id="priceClp"
          name="priceClp"
          required
          inputMode="numeric"
          placeholder={type === "session" ? "35000" : type === "community" ? "12990" : "7990"}
          className="field"
        />
      </div>
    </>
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
  priceClp,
  priceLabel,
  durationMinutes,
  slots,
  googleConnected = false,
  isCommunity = false,
  mercadopagoEnabled = false,
  transferEnabled = false,
}: {
  productId: string;
  productName: string;
  productType: ProductType | "community";
  priceClp: number;
  priceLabel: string;
  durationMinutes?: number;
  slots: string[];
  googleConnected?: boolean;
  isCommunity?: boolean;
  mercadopagoEnabled?: boolean;
  transferEnabled?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(checkoutAction, initial);
  const [selectedSlot, setSelectedSlot] = useState(slots[0] ?? "");
  const [discountClp, setDiscountClp] = useState(0);
  const [totalClp, setTotalClp] = useState(priceClp);
  const [paymentMethod, setPaymentMethod] = useState<"mercadopago" | "transfer">(
    mercadopagoEnabled ? "mercadopago" : "transfer",
  );

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
  const effectiveTotal = totalClp || priceClp;

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

      {isCommunity ? (
        <div className="rounded-xl bg-[var(--mint)]/40 px-4 py-3 text-sm text-[var(--teal-deep)]">
          Recibirás el link de acceso por correo tras la compra.
        </div>
      ) : null}

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

      <CouponField
        subtotalClp={priceClp}
        onApplied={({ discountClp: d, totalClp: t }) => {
          setDiscountClp(d);
          setTotalClp(t);
        }}
      />

      {discountClp > 0 ? (
        <OrderSummary
          subtotalClp={priceClp}
          discountClp={discountClp}
          totalClp={effectiveTotal}
        />
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
            : isCommunity
              ? "Email (aquí llega el link de acceso)"
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
      <PaymentMethodPicker
        mercadopago={mercadopagoEnabled}
        transfer={transferEnabled}
        value={paymentMethod}
        onChange={setPaymentMethod}
      />

      <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
        {paymentMethod === "transfer"
          ? "Después verás los datos para transferir. El vendedor confirma el pago y ahí se libera la entrega."
          : "Pagas con Mercado Pago. El dinero llega a la cuenta del vendedor."}
      </p>
      {state && !state.ok ? (
        <p className="text-sm text-[var(--coral)]" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={
          pending ||
          (isSession && !selectedSlot) ||
          (!mercadopagoEnabled && !transferEnabled)
        }
        className="btn-primary w-full"
      >
        {pending
          ? paymentMethod === "transfer"
            ? "Preparando datos de transferencia…"
            : "Redirigiendo a Mercado Pago…"
          : paymentMethod === "transfer"
            ? `Ver datos para transferir · ${priceLabel}`
            : isSession
              ? `Reservar y pagar ${priceLabel}`
              : discountClp > 0
                ? `Pagar con Mercado Pago · ${new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(effectiveTotal)}`
                : `Pagar con Mercado Pago · ${priceLabel}`}
      </button>
    </form>
  );
}
