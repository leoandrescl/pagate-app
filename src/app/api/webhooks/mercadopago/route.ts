import { NextResponse } from "next/server";
import { getPayment } from "@/lib/mercadopago";
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

    const topic =
      url.searchParams.get("type") ||
      url.searchParams.get("topic") ||
      "";

    if (request.method === "POST") {
      const body = (await request.json().catch(() => null)) as {
        type?: string;
        action?: string;
        data?: { id?: string };
      } | null;
      if (body?.data?.id) {
        paymentId = String(body.data.id);
      }
      if (!topic && body?.type) {
        // payment
      }
    }

    if (!paymentId) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Solo nos interesan pagos
    if (topic && !String(topic).includes("payment")) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const payment = await getPayment(paymentId);
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
