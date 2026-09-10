"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  createCoupon,
  createProduct,
  createPurchase,
  createStore,
  deleteCoupon,
  getMyStore,
  getProduct,
  getPurchaseByToken,
  getStoreById,
  getStoreForProduct,
  isTransferReady,
  isValidUsername,
  listCoupons,
  normalizeUsername,
  setCouponActive,
  updateAvailability,
  updatePurchasePayment,
  updateStoreAppearance,
  validateCouponRpc,
} from "@/lib/store";
import {
  createCheckoutPreference,
  resolveCheckoutAccessToken,
} from "@/lib/mercadopago";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fulfillSessionAfterPaid } from "@/lib/fulfill-payment";
import { validateProductFile } from "@/lib/product-file-rules";
import { BRAND_COLOR_PRESETS } from "@/lib/mock-data";
import { distributeDiscount, normalizeCouponCode } from "@/lib/pricing";
import type { CouponDiscountType, ProductType } from "@/lib/types";

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

/** Convierte `YYYY-MM-DD` al instante UTC de fin de ese día en America/Santiago
 *  (el cupón queda válido durante todo el día en Chile). */
function couponExpiryIso(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const wall = Date.UTC(y, m - 1, d, 23, 59, 59, 999);
  const tz = "America/Santiago";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(wall));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const localAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  const offset = localAsUtc - wall;
  return new Date(wall - offset).toISOString();
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
  const fileEntry = formData.get("file");
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;

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
  if (type === "digital") {
    if (!file) {
      return { ok: false, error: "Sube el PDF u otro archivo del producto." };
    }
    const fileError = validateProductFile(file);
    if (fileError) return { ok: false, error: fileError };
  }

  try {
    await createProduct(mine.creator.id, {
      name,
      description,
      priceClp,
      type,
      durationMinutes: type === "session" ? durationRaw || 45 : undefined,
      file: type === "digital" ? file ?? undefined : undefined,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo publicar el producto.";
    return { ok: false, error: message };
  }
  await revalidateCreatorPaths(mine.creator.username);
  return { ok: true };
}

export type ValidateCouponResult =
  | { ok: true; code: string; discountClp: number; totalClp: number }
  | { ok: false; error: string };

/** Valida un cupón de forma server-side vía RPC (vista previa). Respuesta mínima. */
export async function validateCouponAction(
  storeId: string,
  code: string,
  subtotalClp: number,
): Promise<ValidateCouponResult> {
  const normalized = normalizeCouponCode(code);
  if (!storeId || !normalized) return { ok: false, error: "Cupón no válido" };
  const sub = Math.max(0, Math.round(Number(subtotalClp) || 0));
  const result = await validateCouponRpc(storeId, normalized, sub);
  if (!result.valid) return { ok: false, error: "Cupón no válido" };
  const discountClp = Math.max(0, Math.round(result.discount));
  return {
    ok: true,
    code: normalized,
    discountClp,
    totalClp: Math.max(0, sub - discountClp),
  };
}

export async function createCouponAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const mine = await getMyStore(user.id);
  if (!mine) return { ok: false, error: "Primero crea tu tienda." };

  const code = normalizeCouponCode(String(formData.get("code") ?? ""));
  const discountType: CouponDiscountType =
    String(formData.get("type") ?? "percentage") === "fixed"
      ? "fixed"
      : "percentage";
  const valueRaw = String(formData.get("value") ?? "").replace(",", ".").trim();
  const discountValue = Number(valueRaw);
  const expiresAt = String(formData.get("expiresAt") ?? "").trim();

  if (!/^[A-Z0-9_-]{6,24}$/.test(code)) {
    return {
      ok: false,
      error: "El código debe tener 6–24 caracteres: letras, números, \"_\" o \"-\".",
    };
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { ok: false, error: "Ingresa un valor válido." };
  }
  if (discountType === "percentage" && discountValue > 100) {
    return { ok: false, error: "El porcentaje no puede superar 100%." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) {
    return { ok: false, error: "Elige una fecha de vigencia." };
  }

  try {
    await createCoupon(mine.creator.id, {
      code,
      discountType,
      discountValue,
      expiresAt: couponExpiryIso(expiresAt),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo crear el cupón.",
    };
  }
  await revalidateCreatorPaths(mine.creator.username);
  return { ok: true };
}

export async function toggleCouponAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const mine = await getMyStore(user.id);
  if (!mine) redirect("/onboarding");
  const couponId = String(formData.get("couponId") ?? "");
  const coupon = (await listCoupons(mine.creator.id)).find(
    (c) => c.id === couponId,
  );
  if (!coupon) redirect("/dashboard?mp=error");
  await setCouponActive(mine.creator.id, couponId, !coupon.active);
  await revalidateCreatorPaths(mine.creator.username);
  redirect("/dashboard");
}

export async function deleteCouponAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const mine = await getMyStore(user.id);
  if (!mine) redirect("/onboarding");
  const couponId = String(formData.get("couponId") ?? "");
  await deleteCoupon(mine.creator.id, couponId);
  await revalidateCreatorPaths(mine.creator.username);
  redirect("/dashboard");
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
  const couponCode = normalizeCouponCode(String(formData.get("couponCode") ?? ""));

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

  let couponId: string | null = null;
  let discountClp = 0;
  if (couponCode) {
    const result = await validateCouponRpc(store.creator.id, couponCode, product.priceClp);
    if (!result.valid) return { ok: false, error: "Cupón no válido" };
    couponId = result.couponId;
    discountClp = result.discount;
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
        couponId,
        discountClp,
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
      couponId,
      discountClp,
    });

    const preference = await createCheckoutPreference({
      product,
      purchaseToken: purchase.token,
      buyerName,
      buyerEmail,
      slotStart,
      accessToken,
      applyMarketplaceFee: !store.ownerId,
      discountClp,
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
  couponCode?: string;
}): Promise<ActionResult> {
  const buyerName = input.buyerName.trim();
  const buyerEmail = input.buyerEmail.trim();
  const items = input.items.filter((item) => item.quantity > 0);
  const couponCode = normalizeCouponCode(input.couponCode ?? "");

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
    // Precios y productos SIEMPRE desde el servidor. Nunca se confía en priceClp del cliente.
    const serverItems: {
      product: Awaited<ReturnType<typeof getProduct>>;
      quantity: number;
      slotStart?: string;
    }[] = [];

    for (const item of items) {
      const product = await getProduct(item.productId);
      if (!product) {
        return { ok: false, error: "Producto no encontrado." };
      }
      serverItems.push({
        product,
        quantity: item.quantity,
        slotStart:
          product.type === "session" ? input.sessionSlots[item.productId] : undefined,
      });
    }

    const firstProduct = serverItems[0]?.product ?? null;
    const store = firstProduct
      ? await getStoreForProduct(firstProduct.id)
      : null;
    if (!store) {
      return { ok: false, error: "Tienda no encontrada." };
    }

    let couponId: string | null = null;
    const subtotalClp = serverItems.reduce(
      (sum, it) => sum + (it.product?.priceClp ?? 0) * it.quantity,
      0,
    );
    let discountClp = 0;
    if (couponCode) {
      const result = await validateCouponRpc(store.creator.id, couponCode, subtotalClp);
      if (!result.valid) return { ok: false, error: "Cupón no válido" };
      couponId = result.couponId;
      discountClp = result.discount;
    }
    const discounts = discountClp > 0
      ? distributeDiscount(
          serverItems.map((it) => (it.product?.priceClp ?? 0) * it.quantity),
          discountClp,
        )
      : serverItems.map(() => 0);

    const method = input.paymentMethod === "transfer" ? "transfer" : "mercadopago";

    const createPurchases = async () => {
      const purchases = [];
      for (let i = 0; i < serverItems.length; i++) {
        const it = serverItems[i];
        if (!it.product) continue;
        const share = discounts[i] ?? 0;
        const purchase = await createPurchase({
          productId: it.product.id,
          buyerName,
          buyerEmail,
          slotStart: it.slotStart,
          status: "pending",
          paymentMethod: method,
          couponId: couponId && share > 0 ? couponId : null,
          discountClp: share,
        });
        purchases.push(purchase);
      }
      return purchases;
    };

    if (method === "transfer") {
      if (!isTransferReady(store.paymentSettings)) {
        return {
          ok: false,
          error: "Esta tienda no tiene transferencia configurada.",
        };
      }
      const purchases = await createPurchases();
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

    const purchases = await createPurchases();

    const purchaseToken =
      purchases[0]?.token ?? `cart_${randomBytes(12).toString("hex")}`;
    const sessionItem = serverItems.find((it) => it.product?.type === "session");
    const firstSessionSlot = sessionItem?.slotStart;

    const preference = await createCheckoutPreference({
      items: serverItems.map((it) => ({
        id: it.product!.id,
        title: it.product!.name,
        description: it.product!.description,
        quantity: it.quantity,
        unitPrice: it.product!.priceClp,
      })),
      purchaseToken,
      buyerName,
      buyerEmail,
      slotStart: firstSessionSlot,
      extraMetadata: {
        cart_product_ids: serverItems.map((it) => it.product!.id).join(","),
      },
      accessToken,
      applyMarketplaceFee: !store.ownerId,
      discountClp,
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
    return { ok: false, error: "Hora de inicio: 9, 10 u 11." };
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

function cleanOptionalUrl(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export async function updateStoreAppearanceAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const mine = await getMyStore(user.id);
  if (!mine) {
    return { ok: false, error: "Primero crea tu tienda." };
  }

  const headline = String(formData.get("headline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const bannerRaw = String(formData.get("bannerUrl") ?? "").trim();
  const brandColor = String(formData.get("brandColor") ?? "").trim();
  const allowedColors = BRAND_COLOR_PRESETS.map((p) => p.value) as string[];

  if (headline.length < 4) {
    return { ok: false, error: "El titular debe tener al menos 4 caracteres." };
  }
  if (bio.length > 300) {
    return { ok: false, error: "La bio admite máximo 300 caracteres." };
  }
  if (bannerRaw && !/^https?:\/\//i.test(bannerRaw)) {
    return { ok: false, error: "El banner debe ser una URL http(s)." };
  }
  if (!allowedColors.includes(brandColor)) {
    return { ok: false, error: "Color de marca inválido." };
  }

  try {
    await updateStoreAppearance(mine.creator.id, {
      headline,
      bio,
      bannerUrl: bannerRaw || null,
      brandColor,
      socialLinks: {
        instagram: cleanOptionalUrl(String(formData.get("instagram") ?? "")),
        tiktok: cleanOptionalUrl(String(formData.get("tiktok") ?? "")),
        whatsapp: cleanOptionalUrl(String(formData.get("whatsapp") ?? "")),
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo guardar.",
    };
  }

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
