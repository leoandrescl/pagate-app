import { randomBytes } from "crypto";
import {
  getPurchaseByToken,
  getStoreById,
  updatePurchaseCalendar,
  updatePurchasePayment,
  upsertPurchaseFromMetadata,
} from "@/lib/store";
import {
  createCalendarEventWithMeet,
  isGoogleConnected,
} from "@/lib/google-calendar";
import {
  findApprovedPaymentByExternalReference,
  resolveAccessTokenForPurchase,
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
  if (!token) return null;
  try {
    const existing = await getPurchaseByToken(token);
    const store = existing
      ? await getStoreById(existing.product.creatorId)
      : null;
    const accessToken = await resolveAccessTokenForPurchase(store?.ownerId ?? null);
    if (!accessToken) return null;
    const payment = await findApprovedPaymentByExternalReference(
      token,
      accessToken,
    );
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

  await fulfillSessionAfterPaid(purchase.token, `Pago MP: ${payment.id}`);

  const fresh = await getPurchaseByToken(token);
  return {
    purchase: fresh?.purchase ?? purchase,
    alreadyPaid: false,
  };
}

/** Crea Meet / evento de calendario cuando una sesión queda pagada (MP o transferencia). */
export async function fulfillSessionAfterPaid(
  token: string,
  paymentNote = "Pago confirmado",
): Promise<void> {
  const existing = await getPurchaseByToken(token);
  if (!existing || existing.purchase.status !== "paid") return;
  const { purchase, product } = existing;
  if (product.type !== "session") return;

  const store = await getStoreById(product.creatorId);
  const ownerId = store?.ownerId;
  if (
    purchase.slotStart &&
    purchase.slotEnd &&
    !purchase.googleEventId &&
    ownerId &&
    (await isGoogleConnected(ownerId))
  ) {
    try {
      const event = await createCalendarEventWithMeet(ownerId, {
        summary: `Pagate · sesión con ${purchase.buyerName}`,
        description: `Reserva Pagate.\nCliente: ${purchase.buyerName} <${purchase.buyerEmail}>\n${paymentNote}`,
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
      console.error("[pay] calendar after pay failed", err);
    }
  } else if (!purchase.meetUrl) {
    await updatePurchaseCalendar(purchase.token, {
      meetUrl: `https://meet.google.com/pagate-demo-${randomBytes(3).toString("hex")}`,
    });
  }
}
