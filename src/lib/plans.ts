import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import type { MpPayment } from "./mercadopago";

/**
 * Planes Pagate.
 *
 * - Lo que ve el front: lanzamiento $9.990 (normal $14.990 tachado).
 * - Lo que se cobra hoy en Mercado Pago: $990 (precio de prueba
 *   pre-lanzamiento; el dinero llega a la cuenta de plataforma).
 *   AL LANZAR: subir PRO_CHARGE_CLP a 9990. Nada más cambia.
 */
export const PRO_DISPLAY_PRICE_CLP = 9990;
export const PRO_REGULAR_PRICE_CLP = 14990;
export const PRO_CHARGE_CLP = 990;

export const FREE_MAX_PRODUCTS = 3;
export const FREE_MAX_SALES = 5;
export const PRO_DURATION_DAYS = 30;

/** Marca que identifica un pago de suscripción Pro en metadata de MP. */
export const PLAN_PRO_KIND = "plan_pro";

export type ProStatus = {
  isPro: boolean;
  /** ISO de vencimiento de la suscripción vigente, o null. */
  expiresAt: string | null;
};

function metaString(
  metadata: MpPayment["metadata"] | undefined,
  key: string,
): string {
  const v = metadata?.[key];
  return v == null ? "" : String(v);
}

/** ¿El usuario tiene Pro vigente? Seguro ante tabla inexistente: gratis. */
export async function getProStatus(userId: string | null): Promise<ProStatus> {
  const fallback: ProStatus = { isPro: false, expiresAt: null };
  if (!userId || !isSupabaseAdminConfigured()) return fallback;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("pro_subscriptions")
      .select("expires_at")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data?.expires_at) return fallback;
    return { isPro: true, expiresAt: data.expires_at as string };
  } catch {
    // Tabla aún no migrada en Supabase: nadie es Pro, nada se rompe.
    return fallback;
  }
}

/**
 * Registra un pago Pro aprobado. Idempotente por mp_payment_id.
 * Si ya era Pro vigente, extiende desde el vencimiento actual.
 * Devuelve el nuevo vencimiento (ISO).
 */
export async function activateProSubscription(input: {
  userId: string;
  mpPaymentId: string;
  amountClp: number;
}): Promise<string> {
  const admin = createAdminClient();
  const seen = await admin
    .from("pro_subscriptions")
    .select("id")
    .eq("mp_payment_id", input.mpPaymentId)
    .maybeSingle();
  if (!seen.error && seen.data) {
    const current = await getProStatus(input.userId);
    if (current.expiresAt) return current.expiresAt;
  }
  const current = await getProStatus(input.userId);
  const baseMs =
    current.isPro && current.expiresAt
      ? new Date(current.expiresAt).getTime()
      : Date.now();
  const expiresAt = new Date(
    baseMs + PRO_DURATION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { error } = await admin.from("pro_subscriptions").insert({
    user_id: input.userId,
    mp_payment_id: input.mpPaymentId,
    amount_clp: Math.max(0, Math.round(input.amountClp)),
    expires_at: expiresAt,
  });
  if (error) throw error;
  return expiresAt;
}

/**
 * Si el pago aprobado es de suscripción Pro, la activa y devuelve
 * el resultado. Null cuando NO es un pago de plan (seguir flujo normal).
 * No toca para nada el flujo de compras de productos.
 */
export async function fulfillPlanPayment(
  payment: MpPayment,
): Promise<{ userId: string; expiresAt: string } | null> {
  if (payment.status !== "approved") return null;
  if (metaString(payment.metadata, "kind") !== PLAN_PRO_KIND) return null;
  const userId = metaString(payment.metadata, "user_id");
  if (!userId) {
    console.error("[plan] pago Pro sin user_id", payment.id);
    return null;
  }
  const amountClp = Number(metaString(payment.metadata, "amount_clp") || 0);
  const expiresAt = await activateProSubscription({
    userId,
    mpPaymentId: String(payment.id),
    amountClp: Number.isFinite(amountClp) ? amountClp : 0,
  });
  console.log("[plan] Pro activado", { userId, payment: payment.id, expiresAt });
  return { userId, expiresAt };
}

/** Días restantes de Pro (redondeado hacia abajo, mín. 0). */
export function proDaysLeft(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}
