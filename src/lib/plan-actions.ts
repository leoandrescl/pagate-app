"use server";

import { displayNameFromUser, requireUser } from "@/lib/auth";
import {
  createCheckoutPreference,
  resolveAccessTokenForPurchase,
} from "@/lib/mercadopago";
import {
  PLAN_PRO_KIND,
  PRO_CHARGE_CLP,
  PRO_DURATION_DAYS,
} from "@/lib/plans";
import type { ActionResult } from "@/lib/actions";

/**
 * Crea la preferencia de pago de la suscripción Pro.
 * Usa el token de PLATAFORMA (la plata llega a Pagate), nunca el del
 * vendedor. No modifica el flujo de checkout de productos.
 */
export async function createProCheckoutAction(): Promise<ActionResult> {
  const user = await requireUser();
  const buyerEmail = (user.email ?? "").trim();
  if (!buyerEmail) {
    return { ok: false, error: "Tu cuenta no tiene email. Entra de nuevo." };
  }
  // ownerId null => token de plataforma (MP_ACCESS_TOKEN). Sin cambios de config.
  const accessToken = await resolveAccessTokenForPurchase(null);
  if (!accessToken) {
    return { ok: false, error: "Pagos momentáneamente no disponibles." };
  }
  const purchaseToken = `planpro_${user.id.replace(/-/g, "")}_${Date.now()}`;
  try {
    const preference = await createCheckoutPreference({
      items: [
        {
          id: "plan-pro",
          title: `Plan Pro Pagate · ${PRO_DURATION_DAYS} días`,
          description: "Suscripción mensual al Plan Pro (productos y ventas sin tope).",
          quantity: 1,
          unitPrice: PRO_CHARGE_CLP,
        },
      ],
      purchaseToken,
      buyerName: displayNameFromUser(user) || "Vendedor Pagate",
      buyerEmail,
      extraMetadata: { kind: PLAN_PRO_KIND, user_id: user.id },
      accessToken,
    });
    return { ok: true, redirectTo: preference.initPoint };
  } catch (err) {
    console.error("[plan] checkout", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo iniciar el pago.",
    };
  }
}
