import { NextResponse } from "next/server";
import {
  extractPaymentId,
  getAppBaseUrl,
  getPayment,
} from "@/lib/mercadopago";
import {
  fulfillApprovedPayment,
  syncPurchaseFromMercadoPago,
} from "@/lib/fulfill-payment";
import { getPurchaseByToken, updatePurchasePayment } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = searchParams.get("result") || "unknown";
  const base = getAppBaseUrl();

  const paymentId = extractPaymentId({
    payment_id: searchParams.get("payment_id"),
    collection_id: searchParams.get("collection_id"),
    id: searchParams.get("id"),
  });

  const externalRef = searchParams.get("external_reference");
  const mpApproved =
    result === "success" ||
    searchParams.get("status") === "approved" ||
    searchParams.get("collection_status") === "approved";

  try {
    if (paymentId && mpApproved) {
      const payment = await getPayment(paymentId);
      const fulfilled = await fulfillApprovedPayment(payment);
      if (fulfilled) {
        return NextResponse.redirect(
          new URL(`/d/${fulfilled.purchase.token}?email=1&mp=1`, base),
        );
      }
    }

    if (externalRef) {
      const synced = await syncPurchaseFromMercadoPago(externalRef);
      if (synced) {
        return NextResponse.redirect(
          new URL(`/d/${synced.purchase.token}?email=1&mp=1`, base),
        );
      }

      const found = await getPurchaseByToken(externalRef);
      if (found?.purchase.status === "paid") {
        return NextResponse.redirect(
          new URL(`/d/${found.purchase.token}?email=1&mp=1`, base),
        );
      }
      if (result === "failure" || result === "pending") {
        await updatePurchasePayment(externalRef, {
          status: result === "failure" ? "rejected" : "pending",
        });
        return NextResponse.redirect(
          new URL(
            `/checkout/mp-result?status=${result}&token=${externalRef}`,
            base,
          ),
        );
      }

      // success sin payment_id usable: manda al comprobante; /d sincroniza con MP
      if (mpApproved) {
        return NextResponse.redirect(
          new URL(`/d/${externalRef}?email=1&mp=1`, base),
        );
      }
    }
  } catch (err) {
    console.error("[mp] return handler", err);
  }

  return NextResponse.redirect(
    new URL(
      `/checkout/mp-result?status=${result}${externalRef ? `&token=${externalRef}` : ""}`,
      base,
    ),
  );
}
