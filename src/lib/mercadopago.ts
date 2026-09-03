import type { Product } from "./types";
import { getAppBaseUrl } from "./urls";

export { getAppBaseUrl };

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN?.trim());
}

function getAccessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("Falta MP_ACCESS_TOKEN en el entorno");
  }
  return token;
}

function marketplaceFee(): number {
  const raw = Number(process.env.MP_MARKETPLACE_FEE ?? "0");
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 0;
}

export type CheckoutPreferenceItem = {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export async function createCheckoutPreference(input: {
  product?: Product;
  items?: CheckoutPreferenceItem[];
  purchaseToken: string;
  buyerName: string;
  buyerEmail: string;
  slotStart?: string;
  extraMetadata?: Record<string, string>;
}): Promise<{ id: string; initPoint: string }> {
  const base = getAppBaseUrl();
  const fee = marketplaceFee();

  const lineItems: CheckoutPreferenceItem[] =
    input.items && input.items.length > 0
      ? input.items
      : input.product
        ? [
            {
              id: input.product.id,
              title: input.product.name,
              description: input.product.description,
              quantity: 1,
              unitPrice: input.product.priceClp,
            },
          ]
        : [];

  if (lineItems.length === 0) {
    throw new Error("No hay ítems para cobrar");
  }

  const amountClp = lineItems.reduce(
    (sum, item) => sum + Math.round(item.unitPrice) * Math.max(1, item.quantity),
    0,
  );

  const body: Record<string, unknown> = {
    items: lineItems.map((item) => ({
      id: item.id.slice(0, 256),
      title: item.title.slice(0, 250),
      description: item.description.slice(0, 600),
      quantity: Math.max(1, Math.round(item.quantity)),
      currency_id: "CLP",
      unit_price: Math.round(item.unitPrice),
    })),
    payer: {
      name: input.buyerName,
      email: input.buyerEmail,
    },
    external_reference: input.purchaseToken,
    metadata: {
      pagate_token: input.purchaseToken,
      product_id: input.product?.id ?? lineItems[0].id,
      product_type: input.product?.type ?? "",
      buyer_name: input.buyerName,
      buyer_email: input.buyerEmail,
      slot_start: input.slotStart ?? "",
      amount_clp: String(amountClp),
      ...input.extraMetadata,
    },
    back_urls: {
      success: `${base}/api/mercadopago/return?result=success`,
      failure: `${base}/api/mercadopago/return?result=failure`,
      pending: `${base}/api/mercadopago/return?result=pending`,
    },
    auto_return: "approved",
    notification_url: `${base}/api/webhooks/mercadopago`,
    statement_descriptor: "PAGATE",
  };

  if (fee > 0) {
    body.marketplace_fee = fee;
  }

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    id?: string;
    init_point?: string;
    sandbox_init_point?: string;
    message?: string;
    error?: string;
    cause?: Array<{ description?: string; code?: string }>;
  };

  if (!res.ok || !data.id) {
    const cause = data.cause
      ?.map((c) => c.description || c.code)
      .filter(Boolean)
      .join("; ");
    throw new Error(
      cause ||
        data.message ||
        data.error ||
        `No se pudo crear preferencia MP (${res.status})`,
    );
  }

  // APP_USR de prueba → init_point (www). sandbox.mercadopago.* suele
  // dar ERR_TOO_MANY_REDIRECTS. Solo forzar sandbox con MP_FORCE_SANDBOX=1
  // o tokens legacy TEST-.
  const token = getAccessToken();
  const preferSandbox =
    process.env.MP_FORCE_SANDBOX === "1" || token.startsWith("TEST-");
  const initPoint = preferSandbox
    ? data.sandbox_init_point || data.init_point
    : data.init_point || data.sandbox_init_point;

  if (!initPoint) {
    throw new Error("Mercado Pago no devolvió URL de checkout");
  }

  return { id: data.id, initPoint };
}

export type MpPayment = {
  id: number | string;
  status: string;
  external_reference?: string | null;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export async function getPayment(paymentId: string): Promise<MpPayment> {
  const res = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
      cache: "no-store",
    },
  );
  const data = (await res.json()) as MpPayment & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message || `Error al leer pago ${paymentId}`);
  }
  return data;
}

/** Busca un pago aprobado por external_reference (token Pagate). */
export async function findApprovedPaymentByExternalReference(
  externalReference: string,
): Promise<MpPayment | null> {
  const url = new URL("https://api.mercadopago.com/v1/payments/search");
  url.searchParams.set("external_reference", externalReference);
  url.searchParams.set("sort", "date_created");
  url.searchParams.set("criteria", "desc");
  url.searchParams.set("range", "date_created");
  url.searchParams.set("begin_date", "NOW-30DAYS");
  url.searchParams.set("end_date", "NOW");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    cache: "no-store",
  });
  const data = (await res.json()) as {
    results?: MpPayment[];
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message || "No se pudo buscar el pago en Mercado Pago");
  }
  return (
    data.results?.find((p) => p.status === "approved") ??
    data.results?.[0] ??
    null
  );
}

/** Extrae payment id desde query de retorno Checkout Pro o body webhook. */
export function extractPaymentId(params: {
  payment_id?: string | null;
  collection_id?: string | null;
  "data.id"?: string | null;
  id?: string | null;
}): string | null {
  const raw =
    params.payment_id ||
    params.collection_id ||
    params["data.id"] ||
    params.id ||
    null;
  if (!raw || raw === "null") return null;
  return String(raw);
}
