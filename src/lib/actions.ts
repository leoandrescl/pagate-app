"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  createProduct,
  createPurchase,
  createStore,
  getMyStore,
  getProduct,
  getPurchaseByToken,
  getStoreById,
  getStoreForProduct,
  isTransferReady,
  isValidUsername,
  normalizeUsername,
  updateAvailability,
  updatePurchasePayment,
} from "@/lib/store";
import {
  createCheckoutPreference,
  resolveCheckoutAccessToken,
} from "@/lib/mercadopago";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fulfillSessionAfterPaid } from "@/lib/fulfill-payment";
import type { ProductType } from "@/lib/types";

export type ActionResult =
  | { ok: true; redirectTo?: string; username?: string }
  | { ok: false; error: string };

async function revalidateCreatorPaths(username: string) {
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/crear");
  revalidatePath(`/u/${username}`);
  revalidatePath(`/u/${username}/carrito`);
}

export async function createStoreAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const displayName = String(formData.get("displayName") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const addProduct = String(formData.get("addFirstProduct") ?? "") === "1";

  if (!isValidUsername(username)) {
    return {
      ok: false,
      error: "Usuario inválido. Usa 3–24 caracteres: letras minúsculas, números y puntos (ej. ana.coach).",
    };
  }
  if (displayName.length < 2) {
    return { ok: false, error: "Ingresa tu nombre público." };
  }
  if (headline.length < 4) {
    return { ok: false, error: "Escribe un headline corto (mín. 4 caracteres)." };
  }
  if (bio.length < 10) {
    return { ok: false, error: "Agrega una bio breve (mín. 10 caracteres)." };
  }

  let firstProduct:
    | {
        name: string;
        description: string;
        priceClp: number;
        type: ProductType;
        durationMinutes?: number;
      }
    | undefined;

  if (addProduct) {
    const name = String(formData.get("productName") ?? "").trim();
    const description = String(formData.get("productDescription") ?? "").trim();
    const priceRaw = String(formData.get("productPriceClp") ?? "").replace(
      /\D/g,
      "",
    );
    const priceClp = Number(priceRaw);
    const type =
      (String(formData.get("productType") ?? "digital") as ProductType) ||
      "digital";
    const durationRaw = Number(
      String(formData.get("productDurationMinutes") ?? "45"),
    );

    if (!name || name.length < 3) {
      return {
        ok: false,
        error: "Nombre del producto: mínimo 3 caracteres.",
      };
    }
    if (!description || description.length < 10) {
      return { ok: false, error: "Descripción del producto: mínimo 10 caracteres." };
    }
    if (!Number.isFinite(priceClp) || priceClp < 1000) {
      return { ok: false, error: "El precio mínimo es $1.000 CLP." };
    }
    if (type !== "digital" && type !== "session") {
      return { ok: false, error: "Tipo de producto inválido." };
    }

    firstProduct = {
      name,
      description,
      priceClp,
      type,
      durationMinutes: type === "session" ? durationRaw || 45 : undefined,
    };
  }

  try {
    const store = await createStore(user.id, {
      username,
      displayName,
      headline,
      bio,
      firstProduct,
    });
    await revalidateCreatorPaths(store.creator.username);
    return {
      ok: true,
      redirectTo: "/dashboard",
      username: store.creator.username,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo crear la tienda.";
    return { ok: false, error: message };
  }
}

export async function addProductAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const mine = await getMyStore(user.id);
  if (!mine) {
    return { ok: false, error: "Primero crea tu tienda." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("priceClp") ?? "").replace(/\D/g, "");
  const priceClp = Number(priceRaw);
  const type = (String(formData.get("type") ?? "digital") as ProductType) || "digital";
  const durationRaw = Number(String(formData.get("durationMinutes") ?? "45"));

  if (!name || name.length < 3) {
    return { ok: false, error: "Ingresa un nombre para el producto (mín. 3 caracteres)." };
  }
  if (!description || description.length < 10) {
    return { ok: false, error: "Agrega una descripción corta." };
  }
  if (!Number.isFinite(priceClp) || priceClp < 1000) {
    return { ok: false, error: "El precio mínimo es $1.000 CLP." };
  }
  if (type !== "digital" && type !== "session") {
    return { ok: false, error: "Tipo de producto inválido." };
  }

  await createProduct(mine.creator.id, {
    name,
    description,
    priceClp,
    type,
    durationMinutes: type === "session" ? durationRaw || 45 : undefined,
  });
  await revalidateCreatorPaths(mine.creator.username);
  return { ok: true };
}

export async function checkoutAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const productId = String(formData.get("productId") ?? "");
  const buyerName = String(formData.get("buyerName") ?? "").trim();
  const buyerEmail = String(formData.get("buyerEmail") ?? "").trim();
  const slotStart = String(formData.get("slotStart") ?? "").trim() || undefined;
  const productType = String(formData.get("productType") ?? "digital");

  if (!productId) {
    return { ok: false, error: "Producto inválido." };
  }
  if (!buyerName || buyerName.length < 2) {
    return { ok: false, error: "Ingresa tu nombre." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    return { ok: false, error: "Ingresa un email válido." };
  }
  if (productType === "session" && !slotStart) {
    return { ok: false, error: "Elige un horario para la sesión." };
  }

  const product = await getProduct(productId);
  if (!product) {
    return { ok: false, error: "Producto no encontrado." };
  }
  const store = await getStoreForProduct(productId);
  if (!store) {
    return { ok: false, error: "Tienda no encontrada." };
  }

  const method =
    String(formData.get("paymentMethod") ?? "mercadopago") === "transfer"
      ? "transfer"
      : "mercadopago";

  try {
    if (method === "transfer") {
      if (!isTransferReady(store.paymentSettings)) {
        return {
          ok: false,
          error: "Esta tienda no tiene transferencia configurada.",
        };
      }
      const purchase = await createPurchase({
        productId,
        buyerName,
        buyerEmail,
        slotStart,
        status: "pending",
        paymentMethod: "transfer",
      });
      revalidatePath("/dashboard");
      return { ok: true, redirectTo: `/checkout/transferencia?token=${purchase.token}` };
    }

    const accessToken = await resolveCheckoutAccessToken(store);
    if (!accessToken) {
      return {
        ok: false,
        error: "El vendedor aún no conecta su cuenta de Mercado Pago.",
      };
    }

    const purchase = await createPurchase({
      productId,
      buyerName,
      buyerEmail,
      slotStart,
      status: "pending",
      paymentMethod: "mercadopago",
    });

    const preference = await createCheckoutPreference({
      product,
      purchaseToken: purchase.token,
      buyerName,
      buyerEmail,
      slotStart,
      accessToken,
      applyMarketplaceFee: !store.ownerId,
    });

    await updatePurchasePayment(purchase.token, {
      mpPreferenceId: preference.id,
    });

    revalidatePath("/dashboard");
    return { ok: true, redirectTo: preference.initPoint };
  } catch (err) {
    console.error("[checkout]", err);
    const message =
      err instanceof Error ? err.message : "No se pudo iniciar el pago.";
    return { ok: false, error: message };
  }
}

export type CartCheckoutItem = {
  productId: string;
  name: string;
  priceClp: number;
  quantity: number;
  type: string;
};

export async function checkoutCartAction(input: {
  items: CartCheckoutItem[];
  sessionSlots: Record<string, string>;
  buyerName: string;
  buyerEmail: string;
  paymentMethod?: "mercadopago" | "transfer";
}): Promise<ActionResult> {
  const buyerName = input.buyerName.trim();
  const buyerEmail = input.buyerEmail.trim();
  const items = input.items.filter((item) => item.quantity > 0);

  if (items.length === 0) {
    return { ok: false, error: "El carrito está vacío." };
  }
  if (!buyerName || buyerName.length < 2) {
    return { ok: false, error: "Ingresa tu nombre." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    return { ok: false, error: "Ingresa un email válido." };
  }

  for (const item of items) {
    if (item.type === "session" && !input.sessionSlots[item.productId]) {
      return { ok: false, error: `Elige un horario para "${item.name}".` };
    }
  }

  try {
    const firstProduct = await getProduct(items[0].productId);
    const store = firstProduct
      ? await getStoreForProduct(firstProduct.id)
      : null;
    if (!store) {
      return { ok: false, error: "Tienda no encontrada." };
    }

    const method = input.paymentMethod === "transfer" ? "transfer" : "mercadopago";

    if (method === "transfer") {
      if (!isTransferReady(store.paymentSettings)) {
        return {
          ok: false,
          error: "Esta tienda no tiene transferencia configurada.",
        };
      }
      const purchases = [];
      for (const item of items) {
        const product = await getProduct(item.productId);
        if (!product) continue;
        const purchase = await createPurchase({
          productId: product.id,
          buyerName,
          buyerEmail,
          slotStart:
            product.type === "session"
              ? input.sessionSlots[item.productId]
              : undefined,
          status: "pending",
          paymentMethod: "transfer",
        });
        purchases.push(purchase);
      }
      const token = purchases[0]?.token;
      if (!token) return { ok: false, error: "No se pudo crear la compra." };
      revalidatePath("/dashboard");
      return { ok: true, redirectTo: `/checkout/transferencia?token=${token}` };
    }

    const accessToken = await resolveCheckoutAccessToken(store);
    if (!accessToken) {
      return {
        ok: false,
        error: "El vendedor aún no conecta su cuenta de Mercado Pago.",
      };
    }

    const purchases = [];
    for (const item of items) {
      const product = await getProduct(item.productId);
      if (!product) continue;
      const purchase = await createPurchase({
        productId: product.id,
        buyerName,
        buyerEmail,
        slotStart:
          product.type === "session"
            ? input.sessionSlots[item.productId]
            : undefined,
        status: "pending",
        paymentMethod: "mercadopago",
      });
      purchases.push(purchase);
    }

    const purchaseToken =
      purchases[0]?.token ?? `cart_${randomBytes(12).toString("hex")}`;
    const sessionItem = items.find((item) => item.type === "session");
    const firstSessionSlot = sessionItem
      ? input.sessionSlots[sessionItem.productId]
      : undefined;

    const preference = await createCheckoutPreference({
      items: items.map((item) => ({
        id: item.productId,
        title: item.name,
        description: item.name,
        quantity: item.quantity,
        unitPrice: item.priceClp,
      })),
      purchaseToken,
      buyerName,
      buyerEmail,
      slotStart: firstSessionSlot,
      extraMetadata: {
        cart_product_ids: items.map((item) => item.productId).join(","),
      },
      accessToken,
      applyMarketplaceFee: !store.ownerId,
    });

    for (const purchase of purchases) {
      await updatePurchasePayment(purchase.token, {
        mpPreferenceId: preference.id,
      });
    }

    revalidatePath("/dashboard");
    return { ok: true, redirectTo: preference.initPoint };
  } catch (err) {
    console.error("[checkout-cart]", err);
    const message =
      err instanceof Error ? err.message : "No se pudo iniciar el pago.";
    return { ok: false, error: message };
  }
}

export async function updateAvailabilityAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const mine = await getMyStore(user.id);
  if (!mine) {
    return { ok: false, error: "Primero crea tu tienda." };
  }

  const startHour = Number(formData.get("startHour"));
  const endHour = Number(formData.get("endHour"));
  const slotMinutes = Number(formData.get("slotMinutes"));

  if (![9, 10, 11].includes(startHour)) {
    return { ok: false, error: "Hora de inicio demo: 9, 10 u 11." };
  }
  if (![16, 17, 18, 19].includes(endHour) || endHour <= startHour) {
    return { ok: false, error: "Hora de fin debe ser posterior al inicio." };
  }
  if (![30, 45, 60].includes(slotMinutes)) {
    return { ok: false, error: "Duración de bloque inválida." };
  }

  await updateAvailability(mine.creator.id, { startHour, endHour, slotMinutes });
  await revalidateCreatorPaths(mine.creator.username);
  return { ok: true };
}

export async function confirmTransferPaidAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const mine = await getMyStore(user.id);
  if (!mine) redirect("/onboarding");
  const token = String(formData.get("token") ?? "");
  const found = token ? await getPurchaseByToken(token) : null;
  if (!found || found.product.creatorId !== mine.creator.id) {
    redirect("/dashboard?mp=error");
  }
  if (found.purchase.paymentMethod !== "transfer") {
    redirect("/dashboard");
  }
  await updatePurchasePayment(token, { status: "paid" });
  await fulfillSessionAfterPaid(token, "Pago por transferencia confirmado");
  const store = await getStoreById(found.product.creatorId);
  if (store) await revalidateCreatorPaths(store.creator.username);
  redirect("/dashboard?mp=transfer_paid");
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/dashboard");
  revalidatePath("/login");
  redirect("/login");
}
