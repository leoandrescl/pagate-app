import { randomBytes } from "crypto";
import {
  getProduct,
  getPurchaseByToken,
  updatePurchaseCalendar,
  updatePurchasePayment,
  upsertPurchaseFromMetadata,
} from "@/lib/demo-store";
import {
  createCalendarEventWithMeet,
  isGoogleConnected,
} from "@/lib/google-calendar";
import {
  findApprovedPaymentByExternalReference,
  isMercadoPagoConfigured,
  type MpPayment,
} from "@/lib/mercadopago";
import type { Purchase } from "@/lib/types";

function metaString(
  metadata: MpPayment["metadata"] | undefined,
  key: string,
): string {
  const v = metadata?.[key];
  return v == null ? "" : String(v);
}

/** Si el store local quedó desfasado (p. ej. /tmp en Vercel), relee MP y cumple. */
export async function syncPurchaseFromMercadoPago(
  token: string,
): Promise<{ purchase: Purchase; alreadyPaid: boolean } | null> {
  if (!isMercadoPagoConfigured() || !token) return null;
  try {
    const payment = await findApprovedPaymentByExternalReference(token);
    if (!payment || payment.status !== "approved") return null;
    return fulfillApprovedPayment(payment);
  } catch (err) {
    console.error("[mp] sync purchase", token, err);
    return null;
  }
}

export async function fulfillApprovedPayment(
  payment: MpPayment,
): Promise<{ purchase: Purchase; alreadyPaid: boolean } | null> {
  if (payment.status !== "approved") {
    return null;
  }

  const token =
    metaString(payment.metadata, "pagate_token") ||
    payment.external_reference ||
    "";
  if (!token) {
    console.error("[mp] payment without pagate token", payment.id);
    return null;
  }

  const existing = await getPurchaseByToken(token);
  if (existing?.purchase.status === "paid") {
    await updatePurchasePayment(token, {
      mpPaymentId: String(payment.id),
    });
    return { purchase: existing.purchase, alreadyPaid: true };
  }

  const productId =
    metaString(payment.metadata, "product_id") ||
    existing?.purchase.productId ||
    "";
  const buyerName =
    metaString(payment.metadata, "buyer_name") ||
    existing?.purchase.buyerName ||
    "Comprador";
  const buyerEmail =
    metaString(payment.metadata, "buyer_email") ||
    existing?.purchase.buyerEmail ||
    "";
  const slotStart =
    metaString(payment.metadata, "slot_start") ||
    existing?.purchase.slotStart ||
    undefined;
  const amountClp = Number(
    metaString(payment.metadata, "amount_clp") ||
      existing?.purchase.amountClp ||
      0,
  );

  if (!productId || !buyerEmail) {
    console.error("[mp] incomplete metadata for token", token);
    return null;
  }

  const purchase = await upsertPurchaseFromMetadata({
    token,
    productId,
    buyerName,
    buyerEmail,
    amountClp,
    slotStart: slotStart || undefined,
    status: "paid",
    mpPaymentId: String(payment.id),
  });

  const product = await getProduct(productId);
  if (
    product?.type === "session" &&
    purchase.slotStart &&
    purchase.slotEnd &&
    !purchase.googleEventId &&
    (await isGoogleConnected())
  ) {
    try {
      const event = await createCalendarEventWithMeet({
        summary: `Pagate · sesión con ${purchase.buyerName}`,
        description: `Reserva Pagate.\nCliente: ${purchase.buyerName} <${purchase.buyerEmail}>\nPago MP: ${payment.id}`,
        startIso: purchase.slotStart,
        endIso: purchase.slotEnd,
        attendeeEmail: purchase.buyerEmail,
        attendeeName: purchase.buyerName,
      });
      await updatePurchaseCalendar(purchase.token, {
        meetUrl: event.meetUrl,
        googleEventId: event.eventId,
      });
    } catch (err) {
      console.error("[mp] calendar after pay failed", err);
    }
  } else if (product?.type === "session" && !purchase.meetUrl) {
    await updatePurchaseCalendar(purchase.token, {
      meetUrl: `https://meet.google.com/pagate-demo-${randomBytes(3).toString("hex")}`,
    });
  }

  const fresh = await getPurchaseByToken(token);
  return {
    purchase: fresh?.purchase ?? purchase,
    alreadyPaid: false,
  };
}
