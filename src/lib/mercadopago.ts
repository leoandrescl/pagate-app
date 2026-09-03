import type { MercadoPagoTokenStore, Product, StoreBundle } from "./types";
import { getAppBaseUrl, getStudioUrl } from "./urls";
import {
  readMercadoPagoTokensByMpUserId,
  readMercadoPagoTokensForUser,
  writeMercadoPagoTokensForUser,
} from "./store";

export { getAppBaseUrl };

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN?.trim());
}

export function isMercadoPagoOAuthConfigured(): boolean {
  return Boolean(
    process.env.MP_CLIENT_ID?.trim() && process.env.MP_CLIENT_SECRET?.trim(),
  );
}

function platformAccessToken(): string | null {
  return process.env.MP_ACCESS_TOKEN?.trim() || null;
}

export function getMpOAuthRedirectUri(): string {
  if (process.env.MP_OAUTH_REDIRECT_URI?.trim()) {
    return process.env.MP_OAUTH_REDIRECT_URI.trim();
  }
  return `${getStudioUrl()}/api/mercadopago/callback`;
}

export function getMercadoPagoAuthUrl(state: string): string {
  if (!isMercadoPagoOAuthConfigured()) {
    throw new Error("Faltan MP_CLIENT_ID y MP_CLIENT_SECRET");
  }
  const params = new URLSearchParams({
    client_id: process.env.MP_CLIENT_ID!,
    response_type: "code",
    platform_id: "mp",
    state,
    redirect_uri: getMpOAuthRedirectUri(),
  });
  return `https://auth.mercadopago.com/authorization?${params.toString()}`;
}

async function refreshSellerToken(
  userId: string,
  tokens: MercadoPagoTokenStore,
): Promise<string> {
  if (!tokens.refresh_token || !isMercadoPagoOAuthConfigured()) {
    return tokens.access_token;
  }
  const expired =
    tokens.expires_at && new Date(tokens.expires_at).getTime() < Date.now() + 60_000;
  if (!expired) return tokens.access_token;

  const res = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.MP_CLIENT_ID,
      client_secret: process.env.MP_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    public_key?: string;
    user_id?: number | string;
    live_mode?: boolean;
    expires_in?: number;
    message?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.message || "No se pudo renovar el token de Mercado Pago");
  }
  const next: MercadoPagoTokenStore = {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? tokens.refresh_token,
    public_key: data.public_key ?? tokens.public_key,
    mp_user_id: data.user_id != null ? String(data.user_id) : tokens.mp_user_id,
    live_mode: data.live_mode ?? tokens.live_mode,
    expires_at: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : tokens.expires_at,
  };
  await writeMercadoPagoTokensForUser(userId, next);
  return next.access_token;
}

export async function exchangeMercadoPagoCode(
  code: string,
): Promise<MercadoPagoTokenStore> {
  if (!isMercadoPagoOAuthConfigured()) {
    throw new Error("OAuth de Mercado Pago no está configurado");
  }
  const res = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.MP_CLIENT_ID,
      client_secret: process.env.MP_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: getMpOAuthRedirectUri(),
      test_token: process.env.MP_TEST_MODE === "1",
    }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    public_key?: string;
    user_id?: number | string;
    live_mode?: boolean;
    expires_in?: number;
    message?: string;
    error?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(
      data.message || data.error || "No se pudo conectar Mercado Pago",
    );
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    public_key: data.public_key,
    mp_user_id: data.user_id != null ? String(data.user_id) : undefined,
    live_mode: data.live_mode,
    expires_at: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null,
  };
}

export async function isMercadoPagoConnected(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const tokens = await readMercadoPagoTokensForUser(userId);
  return Boolean(tokens?.access_token);
}

/** Token del vendedor (OAuth). Demo Camila usa el token de Pagate. */
export async function resolveCheckoutAccessToken(
  store: StoreBundle,
): Promise<string | null> {
  if (!store.ownerId) {
    return platformAccessToken();
  }
  const tokens = await readMercadoPagoTokensForUser(store.ownerId);
  if (!tokens?.access_token) return null;
  try {
    return await refreshSellerToken(store.ownerId, tokens);
  } catch {
    return tokens.access_token;
  }
}

export async function resolveAccessTokenForPurchase(
  ownerId: string | null,
): Promise<string | null> {
  if (!ownerId) return platformAccessToken();
  const tokens = await readMercadoPagoTokensForUser(ownerId);
  if (!tokens?.access_token) return platformAccessToken();
  try {
    return await refreshSellerToken(ownerId, tokens);
  } catch {
    return tokens.access_token;
  }
}

export async function resolveAccessTokenForMpUser(
  mpUserId: string | null,
): Promise<string | null> {
  if (!mpUserId) return platformAccessToken();
  const found = await readMercadoPagoTokensByMpUserId(mpUserId);
  if (!found) return platformAccessToken();
  try {
    return await refreshSellerToken(found.userId, found.tokens);
  } catch {
    return found.tokens.access_token;
  }
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
  accessToken: string;
  applyMarketplaceFee?: boolean;
}): Promise<{ id: string; initPoint: string }> {
  const base = getAppBaseUrl();
  const fee = input.applyMarketplaceFee ? marketplaceFee() : 0;
  const token = input.accessToken;

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
    notification_url: `${base}/api/webhooks/mercadopago`,
    statement_descriptor: "PAGATE",
  };

  // auto_return exige HTTPS público; en localhost MP responde
  // "back_url.success must be defined".
  if (/^https:\/\//i.test(base) && !/localhost|127\.0\.0\.1/i.test(base)) {
    body.auto_return = "approved";
  }

  if (fee > 0) {
    body.marketplace_fee = fee;
  }

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
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

export async function getPayment(
  paymentId: string,
  accessToken?: string | null,
): Promise<MpPayment> {
  const token = accessToken || platformAccessToken();
  if (!token) {
    throw new Error("Falta token de Mercado Pago");
  }
  const res = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
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
  accessToken?: string | null,
): Promise<MpPayment | null> {
  const token = accessToken || platformAccessToken();
  if (!token) {
    throw new Error("Falta token de Mercado Pago");
  }
  const url = new URL("https://api.mercadopago.com/v1/payments/search");
  url.searchParams.set("external_reference", externalReference);
  url.searchParams.set("sort", "date_created");
  url.searchParams.set("criteria", "desc");
  url.searchParams.set("range", "date_created");
  url.searchParams.set("begin_date", "NOW-30DAYS");
  url.searchParams.set("end_date", "NOW");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
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
