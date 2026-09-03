import { NextResponse } from "next/server";
import { getPayment, resolveAccessTokenForMpUser } from "@/lib/mercadopago";
import { fulfillApprovedPayment } from "@/lib/fulfill-payment";

export async function GET(request: Request) {
  // Mercado Pago a veces consulta con GET topic/id
  return handleWebhook(request);
}

export async function POST(request: Request) {
  return handleWebhook(request);
}

async function handleWebhook(request: Request) {
  try {
    const url = new URL(request.url);
    let paymentId =
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      "";

    let topic =
      url.searchParams.get("type") ||
      url.searchParams.get("topic") ||
      "";
    let mpUserId: string | null =
      url.searchParams.get("user_id") ||
      url.searchParams.get("userId") ||
      null;

    if (request.method === "POST") {
      const body = (await request.json().catch(() => null)) as {
        type?: string;
        action?: string;
        user_id?: number | string;
        data?: { id?: string };
      } | null;
      if (body?.data?.id) {
        paymentId = String(body.data.id);
      }
      if (body?.type && !topic) {
        topic = body.type;
      }
      if (body?.user_id) {
        mpUserId = String(body.user_id);
      }
    }

    if (!paymentId) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Solo nos interesan pagos
    if (topic && !String(topic).includes("payment")) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const accessToken = await resolveAccessTokenForMpUser(mpUserId);
    const payment = await getPayment(paymentId, accessToken);
    if (payment.status === "approved") {
      await fulfillApprovedPayment(payment);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mp] webhook", err);
    // 200 para evitar reintentos agresivos en errores de parsing; MP reintenta igual si 5xx
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
