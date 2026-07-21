"use server";

import { revalidatePath } from "next/cache";
import {
  createProduct,
  createPurchase,
  resetDemoStore,
} from "@/lib/demo-store";

export type ActionResult =
  | { ok: true; redirectTo?: string }
  | { ok: false; error: string };

export async function addProductAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("priceClp") ?? "").replace(/\D/g, "");
  const priceClp = Number(priceRaw);

  if (!name || name.length < 3) {
    return { ok: false, error: "Ponle un nombre al producto (mín. 3 caracteres)." };
  }
  if (!description || description.length < 10) {
    return { ok: false, error: "Agrega una descripción corta." };
  }
  if (!Number.isFinite(priceClp) || priceClp < 1000) {
    return { ok: false, error: "El precio mínimo demo es $1.000 CLP." };
  }

  await createProduct({ name, description, priceClp });
  revalidatePath("/dashboard");
  revalidatePath("/u/camila.nutri");
  return { ok: true };
}

export async function checkoutAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const productId = String(formData.get("productId") ?? "");
  const buyerName = String(formData.get("buyerName") ?? "").trim();
  const buyerEmail = String(formData.get("buyerEmail") ?? "").trim();

  if (!productId) {
    return { ok: false, error: "Producto inválido." };
  }
  if (!buyerName || buyerName.length < 2) {
    return { ok: false, error: "Ingresa tu nombre." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    return { ok: false, error: "Ingresa un email válido." };
  }

  // Simula latencia de pasarela (Webpay/Flow)
  await new Promise((r) => setTimeout(r, 1200));

  try {
    const purchase = await createPurchase({
      productId,
      buyerName,
      buyerEmail,
    });
    revalidatePath("/dashboard");
    return { ok: true, redirectTo: `/d/${purchase.token}?email=1` };
  } catch {
    return { ok: false, error: "No se pudo completar el pago mock." };
  }
}

export async function resetDemoAction(): Promise<void> {
  await resetDemoStore();
  revalidatePath("/dashboard");
  revalidatePath("/u/camila.nutri");
}
