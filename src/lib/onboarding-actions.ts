"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { displayNameFromUser, requireUser } from "@/lib/auth";
import { onboardingPath } from "@/lib/onboarding";
import { isMercadoPagoConnected } from "@/lib/mercadopago";
import {
  claimOnboardingUsername,
  completeOnboarding,
  getMyStore,
  initialsFromName,
  isUsernameAvailable,
  normalizeUsername,
  patchOnboardingStore,
} from "@/lib/store";
import type { ActionResult } from "@/lib/actions";
import type { PaymentSettings, ProductType } from "@/lib/types";

async function afterSave(username: string) {
  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  revalidatePath(`/u/${username}`);
}

export async function saveHandleAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const check = await isUsernameAvailable(username, user.id);
  if (!check.ok) return { ok: false, error: check.error ?? "Usuario no disponible." };

  try {
    const store = await claimOnboardingUsername(
      user.id,
      username,
      displayNameFromUser(user),
    );
    await afterSave(store.creator.username);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo guardar el usuario.",
    };
  }
  redirect(onboardingPath("product-type"));
}

export async function saveProductTypesAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const types = formData.getAll("productType").map(String) as ProductType[];
  const intended = types.filter((t) => t === "digital" || t === "session");
  try {
    const store = await patchOnboardingStore(user.id, "product-type", {
      intended_product_types: intended,
    });
    await afterSave(store.creator.username);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo guardar.",
    };
  }
  redirect(onboardingPath("pagos"));
}

export async function savePaymentsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const connected = await isMercadoPagoConnected(user.id);
  const payment: PaymentSettings = {
    mercadoPago: connected ? "connected" : "later",
    transferEnabled: String(formData.get("transferEnabled") ?? "") === "1",
    transferHolder: String(formData.get("transferHolder") ?? "").trim() || undefined,
    transferRut: String(formData.get("transferRut") ?? "").trim() || undefined,
    transferEmail: String(formData.get("transferEmail") ?? "").trim() || undefined,
    transferBank: String(formData.get("transferBank") ?? "").trim() || undefined,
    transferAccount: String(formData.get("transferAccount") ?? "").trim() || undefined,
  };
  if (payment.transferEnabled) {
    if (!payment.transferHolder || !payment.transferBank || !payment.transferAccount) {
      return {
        ok: false,
        error: "Para transferencia indica titular, banco y número de cuenta.",
      };
    }
  }
  try {
    const store = await patchOnboardingStore(user.id, "pagos", {
      payment_settings: payment,
    });
    await afterSave(store.creator.username);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo guardar.",
    };
  }
  redirect(onboardingPath("download-expiry"));
}

export async function saveDownloadExpiryAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const raw = String(formData.get("expiry") ?? "7");
  const download_expiry_days = raw === "never" ? null : Number(raw);
  const allowed = new Set([1, 7, 30, 90]);
  if (raw !== "never" && !allowed.has(download_expiry_days as number)) {
    return { ok: false, error: "Elige una duración válida." };
  }
  try {
    const store = await patchOnboardingStore(user.id, "download-expiry", {
      download_expiry_days,
      download_max_count: 2,
    });
    await afterSave(store.creator.username);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo guardar.",
    };
  }
  redirect(onboardingPath("profile"));
}

export async function saveProfileAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  if (displayName.length < 2) {
    return { ok: false, error: "Ingresa tu nombre público." };
  }
  if (bio.length > 150) {
    return { ok: false, error: "La bio admite máximo 150 caracteres." };
  }
  const headline = bio.slice(0, 80) || displayName;
  const meta = user.user_metadata ?? {};
  const avatarUrl =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    null;
  try {
    const store = await patchOnboardingStore(user.id, "profile", {
      display_name: displayName,
      bio,
      headline,
      avatar_initials: initialsFromName(displayName),
      avatar_url: avatarUrl,
    });
    await afterSave(store.creator.username);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo guardar.",
    };
  }
  redirect(onboardingPath("socials"));
}

function cleanSocial(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export async function finishOnboardingAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const mine = await getMyStore(user.id);
  if (!mine) return { ok: false, error: "Primero elige tu usuario." };
  try {
    const store = await completeOnboarding(user.id, {
      social_links: {
        instagram: cleanSocial(String(formData.get("instagram") ?? "")),
        tiktok: cleanSocial(String(formData.get("tiktok") ?? "")),
        whatsapp: cleanSocial(String(formData.get("whatsapp") ?? "")),
      },
    });
    await afterSave(store.creator.username);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo terminar.",
    };
  }
  redirect("/dashboard");
}
