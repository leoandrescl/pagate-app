"use server";

import { revalidatePath } from "next/cache";
import {
  createProduct,
  createPurchase,
  getProduct,
  resetDemoStore,
  updateAvailability,
  updatePurchaseCalendar,
} from "@/lib/demo-store";
import {
  createCalendarEventWithMeet,
  isGoogleConnected,
} from "@/lib/google-calendar";
import type { ProductType } from "@/lib/types";

export type ActionResult =
  | { ok: true; redirectTo?: string }
  | { ok: false; error: string };

export async function addProductAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("priceClp") ?? "").replace(/\D/g, "");
  const priceClp = Number(priceRaw);
  const type = (String(formData.get("type") ?? "digital") as ProductType) || "digital";
  const durationRaw = Number(String(formData.get("durationMinutes") ?? "45"));

  if (!name || name.length < 3) {
    return { ok: false, error: "Ingresa un nombre para el producto (mín. 3 caracteres)." };
  }
  if (!description || description.length < 10) {
    return { ok: false, error: "Agrega una descripción corta." };
  }
  if (!Number.isFinite(priceClp) || priceClp < 1000) {
    return { ok: false, error: "El precio mínimo demo es $1.000 CLP." };
  }
  if (type !== "digital" && type !== "session") {
    return { ok: false, error: "Tipo de producto inválido." };
  }

  await createProduct({
    name,
    description,
    priceClp,
    type,
    durationMinutes: type === "session" ? durationRaw || 45 : undefined,
  });
  revalidatePath("/dashboard");
  revalidatePath("/u/camila.nutri");
  return { ok: true };
}

export async function checkoutAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const productId = String(formData.get("productId") ?? "");
  const buyerName = String(formData.get("buyerName") ?? "").trim();
  const buyerEmail = String(formData.get("buyerEmail") ?? "").trim();
  const slotStart = String(formData.get("slotStart") ?? "").trim() || undefined;
  const productType = String(formData.get("productType") ?? "digital");

  if (!productId) {
    return { ok: false, error: "Producto inválido." };
  }
  if (!buyerName || buyerName.length < 2) {
    return { ok: false, error: "Ingresa tu nombre." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    return { ok: false, error: "Ingresa un email válido." };
  }
  if (productType === "session" && !slotStart) {
    return { ok: false, error: "Elige un horario para la sesión." };
  }

  await new Promise((r) => setTimeout(r, 800));

  try {
    let meetUrl: string | undefined;
    let googleEventId: string | undefined;

    if (
      productType === "session" &&
      slotStart &&
      (await isGoogleConnected())
    ) {
      const product = await getProduct(productId);
      const duration = product?.durationMinutes ?? 45;
      const slotEnd = new Date(
        new Date(slotStart).getTime() + duration * 60 * 1000,
      ).toISOString();

      try {
        const event = await createCalendarEventWithMeet({
          summary: `Pagate · sesión con ${buyerName}`,
          description: `Reserva Pagate.\nCliente: ${buyerName} <${buyerEmail}>`,
          startIso: slotStart,
          endIso: slotEnd,
          attendeeEmail: buyerEmail,
          attendeeName: buyerName,
        });
        meetUrl = event.meetUrl;
        googleEventId = event.eventId;
      } catch (err) {
        console.error("[google] create event failed", err);
        return {
          ok: false,
          error:
            "No se pudo crear el evento en Google Calendar. Reconecta el calendario e intenta de nuevo.",
        };
      }
    }

    const purchase = await createPurchase({
      productId,
      buyerName,
      buyerEmail,
      slotStart,
    });

    if (googleEventId || meetUrl) {
      await updatePurchaseCalendar(purchase.token, { meetUrl, googleEventId });
    } else if (productType === "session") {
      const { randomBytes } = await import("crypto");
      await updatePurchaseCalendar(purchase.token, {
        meetUrl: `https://meet.google.com/pagate-demo-${randomBytes(3).toString("hex")}`,
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/u/camila.nutri");
    return { ok: true, redirectTo: `/d/${purchase.token}?email=1` };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo completar el pago mock.";
    return { ok: false, error: message };
  }
}

export async function updateAvailabilityAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const startHour = Number(formData.get("startHour"));
  const endHour = Number(formData.get("endHour"));
  const slotMinutes = Number(formData.get("slotMinutes"));

  if (![9, 10, 11].includes(startHour)) {
    return { ok: false, error: "Hora de inicio demo: 9, 10 u 11." };
  }
  if (![16, 17, 18, 19].includes(endHour) || endHour <= startHour) {
    return { ok: false, error: "Hora de fin debe ser posterior al inicio." };
  }
  if (![30, 45, 60].includes(slotMinutes)) {
    return { ok: false, error: "Duración de bloque inválida." };
  }

  await updateAvailability({ startHour, endHour, slotMinutes });
  revalidatePath("/dashboard");
  revalidatePath("/u/camila.nutri");
  return { ok: true };
}

export async function resetDemoAction(): Promise<void> {
  await resetDemoStore();
  revalidatePath("/dashboard");
  revalidatePath("/u/camila.nutri");
}
