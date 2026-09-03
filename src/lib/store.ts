import { randomBytes, randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import type {
  Availability,
  Creator,
  DownloadPolicy,
  GoogleCalendarConnection,
  GoogleTokenStore,
  OnboardingStepId,
  PaymentSettings,
  Product,
  ProductType,
  Purchase,
  StoreBundle,
  StoreSocialLinks,
} from "./types";
import { advanceOnboardingStep } from "./onboarding";

export type { StoreBundle } from "./types";

export const DEFAULT_AVAILABILITY: Availability = {
  timezone: "America/Santiago",
  weekdays: [1, 2, 3, 4, 5],
  startHour: 10,
  endHour: 18,
  slotMinutes: 60,
};

export const DEMO_STORE_ID = "11111111-1111-4111-8111-111111111111";
export const DEMO_USERNAME = "camila.nutri";
const RESERVED_USERNAMES = new Set([
  DEMO_USERNAME,
  "pagate",
  "studio",
  "www",
  "admin",
  "api",
  "login",
  "onboarding",
  "dashboard",
  "crear",
  "checkout",
]);

type StoreRow = {
  id: string;
  owner_id: string | null;
  username: string;
  display_name: string;
  bio: string;
  headline: string;
  avatar_initials: string;
  availability: Availability | null;
  google_calendar: GoogleCalendarConnection | null;
  onboarding_completed_at: string | null;
  onboarding_step: OnboardingStepId | null;
  intended_product_types: string[] | null;
  download_expiry_days: number | null;
  download_max_count: number | null;
  payment_settings: PaymentSettings | null;
  social_links: StoreSocialLinks | null;
  avatar_url: string | null;
};

type ProductRow = {
  id: string;
  store_id: string;
  type: ProductType;
  name: string;
  description: string;
  price_clp: number;
  duration_minutes: number | null;
  file_name: string | null;
  file_path: string | null;
  created_at: string;
};

type PurchaseRow = {
  id: string;
  token: string;
  product_id: string;
  store_id: string;
  buyer_name: string;
  buyer_email: string;
  amount_clp: number;
  status: Purchase["status"];
  downloads_remaining: number;
  expires_at: string;
  created_at: string;
  slot_start: string | null;
  slot_end: string | null;
  meet_url: string | null;
  google_event_id: string | null;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
};

export const DEMO_CREATOR: Creator = {
  id: DEMO_STORE_ID,
  username: DEMO_USERNAME,
  displayName: "Camila Rojas",
  bio: "Nutricionista clínica. Planes descargables, guías prácticas y sesiones 1:1 por videollamada.",
  headline: "Nutrición simple para tu semana",
  avatarInitials: "CR",
  availability: DEFAULT_AVAILABILITY,
};

function demoProducts(): Product[] {
  return [
    {
      id: "prod_sesion_nutri",
      creatorId: DEMO_STORE_ID,
      type: "session",
      name: "Sesión nutricional 1:1 (45 min)",
      description:
        "Videollamada para revisar tu alimentación y armar un plan semanal. Eliges horario al pagar.",
      priceClp: 35000,
      durationMinutes: 45,
      createdAt: new Date(0).toISOString(),
    },
    {
      id: "prod_guia_semana",
      creatorId: DEMO_STORE_ID,
      type: "digital",
      name: "Guía de meal prep (7 días)",
      description:
        "Menús, lista de compras y tip de batch cooking en PDF. Ideal para empezar sin complicarte.",
      priceClp: 7990,
      fileName: "guia-meal-prep-pagate.pdf",
      filePath: "/demo/guia-meal-prep-pagate.pdf",
      createdAt: new Date(0).toISOString(),
    },
    {
      id: "prod_habitos",
      creatorId: DEMO_STORE_ID,
      type: "digital",
      name: "Workbook: hábitos alimentarios",
      description:
        "Plantillas imprimibles para registrar comidas, hambre real y metas semanales.",
      priceClp: 4990,
      fileName: "workbook-habitos-pagate.pdf",
      filePath: "/demo/workbook-habitos-pagate.pdf",
      createdAt: new Date(0).toISOString(),
    },
  ];
}

function sortProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    if (a.type !== b.type) return a.type === "session" ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function creatorFromRow(row: StoreRow): Creator {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    headline: row.headline,
    avatarInitials: row.avatar_initials,
    availability: {
      ...DEFAULT_AVAILABILITY,
      ...(row.availability ?? {}),
    },
    googleCalendar: row.google_calendar ?? undefined,
  };
}

function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    creatorId: row.store_id,
    type: row.type,
    name: row.name,
    description: row.description,
    priceClp: row.price_clp,
    durationMinutes: row.duration_minutes ?? undefined,
    fileName: row.file_name ?? undefined,
    filePath: row.file_path ?? undefined,
    createdAt: row.created_at,
  };
}

function purchaseFromRow(row: PurchaseRow): Purchase {
  return {
    id: row.id,
    token: row.token,
    productId: row.product_id,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    amountClp: row.amount_clp,
    status: row.status,
    downloadsRemaining: row.downloads_remaining,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    slotStart: row.slot_start ?? undefined,
    slotEnd: row.slot_end ?? undefined,
    meetUrl: row.meet_url ?? undefined,
    googleEventId: row.google_event_id ?? undefined,
    mpPreferenceId: row.mp_preference_id ?? undefined,
    mpPaymentId: row.mp_payment_id ?? undefined,
  };
}

function db() {
  return createAdminClient();
}

async function fetchProducts(storeId: string): Promise<Product[]> {
  const { data, error } = await db()
    .from("products")
    .select("*")
    .eq("store_id", storeId);
  if (error) throw new Error(error.message);
  return sortProducts((data as ProductRow[]).map(productFromRow));
}

async function fetchPurchases(storeId: string): Promise<Purchase[]> {
  const { data, error } = await db()
    .from("purchases")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as PurchaseRow[]).map(purchaseFromRow);
}

async function fetchStoreRowById(id: string): Promise<StoreRow | null> {
  const { data, error } = await db()
    .from("stores")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as StoreRow | null) ?? null;
}

const DEFAULT_PAYMENT: PaymentSettings = {
  mercadoPago: "later",
  goCuotas: false,
  transferEnabled: false,
};

function paymentFromRow(row: StoreRow): PaymentSettings {
  return { ...DEFAULT_PAYMENT, ...(row.payment_settings ?? {}) };
}

function socialFromRow(row: StoreRow): StoreSocialLinks {
  return row.social_links ?? {};
}

function onboardingFields(row: StoreRow) {
  const step = row.onboarding_step;
  const valid: OnboardingStepId[] = [
    "handle",
    "product-type",
    "pagos",
    "download-expiry",
    "profile",
    "socials",
    "done",
  ];
  return {
    onboardingCompletedAt: row.onboarding_completed_at,
    onboardingStep: valid.includes(step as OnboardingStepId)
      ? (step as OnboardingStepId)
      : "handle",
    intendedProductTypes: ((row.intended_product_types ?? []).filter(
      (t) => t === "digital" || t === "session",
    ) ?? []) as ProductType[],
    downloadExpiryDays: row.download_expiry_days,
    downloadMaxCount: row.download_max_count ?? 2,
    paymentSettings: paymentFromRow(row),
    socialLinks: socialFromRow(row),
    avatarUrl: row.avatar_url,
  };
}

async function bundleFromRow(row: StoreRow): Promise<StoreBundle> {
  const [products, purchases] = await Promise.all([
    fetchProducts(row.id),
    fetchPurchases(row.id),
  ]);
  return {
    creator: creatorFromRow(row),
    products,
    purchases,
    ownerId: row.owner_id,
    ...onboardingFields(row),
  };
}

function demoBundle(): StoreBundle {
  return {
    creator: DEMO_CREATOR,
    products: demoProducts(),
    purchases: [],
    ownerId: null,
    onboardingCompletedAt: new Date(0).toISOString(),
    onboardingStep: "done",
    intendedProductTypes: ["digital", "session"],
    downloadExpiryDays: 7,
    downloadMaxCount: 5,
    paymentSettings: DEFAULT_PAYMENT,
    socialLinks: {},
    avatarUrl: null,
  };
}

export async function getStoreByUsername(
  username: string,
): Promise<StoreBundle | null> {
  if (!isSupabaseAdminConfigured()) {
    if (username.toLowerCase() === DEMO_USERNAME) return demoBundle();
    return null;
  }
  const { data, error } = await db()
    .from("stores")
    .select("*")
    .ilike("username", username)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return bundleFromRow(data as StoreRow);
}

export async function getStoreById(
  storeId: string,
): Promise<StoreBundle | null> {
  if (!isSupabaseAdminConfigured()) {
    if (storeId === DEMO_STORE_ID) return demoBundle();
    return null;
  }
  const row = await fetchStoreRowById(storeId);
  if (!row) return null;
  return bundleFromRow(row);
}

export async function getMyStore(userId: string): Promise<StoreBundle | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const { data, error } = await db()
    .from("stores")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return bundleFromRow(data as StoreRow);
}

export async function getCreatorByUsername(
  username: string,
): Promise<Creator | null> {
  const store = await getStoreByUsername(username);
  return store?.creator ?? null;
}

export async function listProductsByUsername(
  username: string,
): Promise<Product[]> {
  const store = await getStoreByUsername(username);
  return store?.products ?? [];
}

export async function getProduct(productId: string): Promise<Product | null> {
  if (!isSupabaseAdminConfigured()) {
    return demoProducts().find((p) => p.id === productId) ?? null;
  }
  const { data, error } = await db()
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? productFromRow(data as ProductRow) : null;
}

export async function getStoreForProduct(
  productId: string,
): Promise<StoreBundle | null> {
  const product = await getProduct(productId);
  if (!product) return null;
  return getStoreById(product.creatorId);
}

export async function createProduct(
  storeId: string,
  input: {
    name: string;
    description: string;
    priceClp: number;
    type: ProductType;
    durationMinutes?: number;
  },
): Promise<Product> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase no está configurado.");
  }
  const isSession = input.type === "session";
  const product: Product = {
    id: `prod_${randomBytes(4).toString("hex")}`,
    creatorId: storeId,
    type: input.type,
    name: input.name.trim(),
    description: input.description.trim(),
    priceClp: Math.max(0, Math.round(input.priceClp)),
    durationMinutes: isSession ? input.durationMinutes ?? 45 : undefined,
    fileName: isSession ? undefined : "guia-meal-prep-pagate.pdf",
    filePath: isSession ? undefined : "/demo/guia-meal-prep-pagate.pdf",
    createdAt: new Date().toISOString(),
  };
  const { error } = await db().from("products").insert({
    id: product.id,
    store_id: storeId,
    type: product.type,
    name: product.name,
    description: product.description,
    price_clp: product.priceClp,
    duration_minutes: product.durationMinutes ?? null,
    file_name: product.fileName ?? null,
    file_path: product.filePath ?? null,
    created_at: product.createdAt,
  });
  if (error) throw new Error(error.message);
  return product;
}

export function digitalDownloadFields(
  store: StoreBundle,
  type: ProductType,
  paid: boolean,
): { downloadsRemaining: number; expiresAt: string } {
  const fallbackExpiry = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  if (type !== "digital" || !paid) {
    return { downloadsRemaining: 0, expiresAt: fallbackExpiry };
  }
  const days = store.downloadExpiryDays;
  const expiresAt =
    days == null
      ? "2099-12-31T23:59:59.000Z"
      : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  return {
    downloadsRemaining: store.downloadMaxCount || 2,
    expiresAt,
  };
}

export function downloadPolicyForStore(store: StoreBundle): DownloadPolicy {
  return {
    expiryDays: store.downloadExpiryDays,
    maxCount: store.downloadMaxCount,
  };
}

export async function updateAvailability(
  storeId: string,
  patch: Partial<Availability>,
): Promise<Availability> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase no está configurado.");
  }
  const row = await fetchStoreRowById(storeId);
  if (!row) throw new Error("Tienda no encontrada");
  const availability = {
    ...DEFAULT_AVAILABILITY,
    ...(row.availability ?? {}),
    ...patch,
  };
  const { error } = await db()
    .from("stores")
    .update({ availability })
    .eq("id", storeId);
  if (error) throw new Error(error.message);
  return availability;
}

export async function createPurchase(input: {
  productId: string;
  buyerName: string;
  buyerEmail: string;
  slotStart?: string;
  status?: Purchase["status"];
}): Promise<Purchase> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase no está configurado.");
  }
  const product = await getProduct(input.productId);
  if (!product) throw new Error("Producto no encontrado");
  const store = await getStoreById(product.creatorId);
  if (!store) throw new Error("Tienda no encontrada");

  if (product.type === "session") {
    if (!input.slotStart) throw new Error("Debes elegir un horario");
    const taken = store.purchases.some(
      (p) =>
        p.slotStart === input.slotStart &&
        (p.status === "paid" || p.status === "pending"),
    );
    if (taken) throw new Error("Ese horario ya fue reservado");
  }

  const duration = product.durationMinutes ?? 45;
  const slotStart = input.slotStart;
  const slotEnd = slotStart
    ? new Date(new Date(slotStart).getTime() + duration * 60 * 1000).toISOString()
    : undefined;
  const status = input.status ?? "paid";
  const downloads = digitalDownloadFields(store, product.type, status === "paid");

  const purchase: Purchase = {
    id: `pur_${randomBytes(4).toString("hex")}`,
    token: randomBytes(12).toString("hex"),
    productId: product.id,
    buyerName: input.buyerName.trim(),
    buyerEmail: input.buyerEmail.trim().toLowerCase(),
    amountClp: product.priceClp,
    status,
    downloadsRemaining: downloads.downloadsRemaining,
    expiresAt: downloads.expiresAt,
    createdAt: new Date().toISOString(),
    slotStart,
    slotEnd,
    meetUrl: undefined,
  };

  const { error } = await db().from("purchases").insert(purchaseToRow(purchase, product.creatorId));
  if (error) throw new Error(error.message);
  return purchase;
}

function purchaseToRow(purchase: Purchase, storeId: string) {
  return {
    id: purchase.id,
    token: purchase.token,
    product_id: purchase.productId,
    store_id: storeId,
    buyer_name: purchase.buyerName,
    buyer_email: purchase.buyerEmail,
    amount_clp: purchase.amountClp,
    status: purchase.status,
    downloads_remaining: purchase.downloadsRemaining,
    expires_at: purchase.expiresAt,
    created_at: purchase.createdAt,
    slot_start: purchase.slotStart ?? null,
    slot_end: purchase.slotEnd ?? null,
    meet_url: purchase.meetUrl ?? null,
    google_event_id: purchase.googleEventId ?? null,
    mp_preference_id: purchase.mpPreferenceId ?? null,
    mp_payment_id: purchase.mpPaymentId ?? null,
  };
}

export async function updatePurchaseCalendar(
  token: string,
  data: { meetUrl?: string; googleEventId?: string },
): Promise<Purchase | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const patch: Record<string, string> = {};
  if (data.meetUrl) patch.meet_url = data.meetUrl;
  if (data.googleEventId) patch.google_event_id = data.googleEventId;
  if (Object.keys(patch).length === 0) {
    const found = await getPurchaseByToken(token);
    return found?.purchase ?? null;
  }
  const { error } = await db().from("purchases").update(patch).eq("token", token);
  if (error) throw new Error(error.message);
  return (await getPurchaseByToken(token))?.purchase ?? null;
}

export async function updatePurchasePayment(
  token: string,
  data: {
    status?: Purchase["status"];
    mpPreferenceId?: string;
    mpPaymentId?: string;
  },
): Promise<Purchase | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const found = await getPurchaseByToken(token);
  if (!found) return null;

  const patch: Record<string, string | number> = {};
  if (data.status) {
    patch.status = data.status;
    if (data.status === "paid" && found.purchase.downloadsRemaining === 0) {
      if (found.product.type === "digital") {
        const store = await getStoreById(found.product.creatorId);
        patch.downloads_remaining = store?.downloadMaxCount ?? 5;
        if (store) {
          patch.expires_at = digitalDownloadFields(store, "digital", true).expiresAt;
        }
      }
    }
  }
  if (data.mpPreferenceId) patch.mp_preference_id = data.mpPreferenceId;
  if (data.mpPaymentId) patch.mp_payment_id = data.mpPaymentId;

  const { error } = await db().from("purchases").update(patch).eq("token", token);
  if (error) throw new Error(error.message);
  return (await getPurchaseByToken(token))?.purchase ?? null;
}

export async function upsertPurchaseFromMetadata(input: {
  token: string;
  productId: string;
  buyerName: string;
  buyerEmail: string;
  amountClp: number;
  slotStart?: string;
  status: Purchase["status"];
  mpPaymentId?: string;
}): Promise<Purchase> {
  const existing = await getPurchaseByToken(input.token);
  if (existing) {
    const updated = await updatePurchasePayment(input.token, {
      status: input.status,
      mpPaymentId: input.mpPaymentId,
    });
    if (updated) return updated;
  }

  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase no está configurado.");
  }
  const product = await getProduct(input.productId);
  if (!product) throw new Error("Producto no encontrado");
  const store = await getStoreById(product.creatorId);
  if (!store) throw new Error("Tienda no encontrada");
  const duration = product.durationMinutes ?? 45;
  const slotEnd = input.slotStart
    ? new Date(
        new Date(input.slotStart).getTime() + duration * 60 * 1000,
      ).toISOString()
    : undefined;
  const downloads = digitalDownloadFields(
    store,
    product.type,
    input.status === "paid",
  );

  const purchase: Purchase = {
    id: `pur_${randomBytes(4).toString("hex")}`,
    token: input.token,
    productId: input.productId,
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    amountClp: input.amountClp,
    status: input.status,
    downloadsRemaining: downloads.downloadsRemaining,
    expiresAt: downloads.expiresAt,
    createdAt: new Date().toISOString(),
    slotStart: input.slotStart,
    slotEnd,
    mpPaymentId: input.mpPaymentId,
  };

  const { error } = await db()
    .from("purchases")
    .insert(purchaseToRow(purchase, product.creatorId));
  if (error) throw new Error(error.message);
  return purchase;
}

export async function setGoogleCalendarStatus(
  storeId: string,
  status: GoogleCalendarConnection,
): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  const { error } = await db()
    .from("stores")
    .update({ google_calendar: status })
    .eq("id", storeId);
  if (error) throw new Error(error.message);
}

export async function getPurchaseByToken(
  token: string,
): Promise<{ purchase: Purchase; product: Product } | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const { data, error } = await db()
    .from("purchases")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const purchase = purchaseFromRow(data as PurchaseRow);
  const product = await getProduct(purchase.productId);
  if (!product) return null;
  return { purchase, product };
}

export async function listUpcomingSessions(
  storeId: string,
): Promise<{ purchase: Purchase; product: Product }[]> {
  const store = await getStoreById(storeId);
  if (!store) return [];
  const now = Date.now();
  const productsById = new Map(store.products.map((p) => [p.id, p]));
  return store.purchases
    .filter(
      (p) =>
        p.status === "paid" &&
        p.slotStart &&
        new Date(p.slotStart).getTime() >= now - 60 * 60 * 1000,
    )
    .map((purchase) => {
      const product = productsById.get(purchase.productId);
      return product ? { purchase, product } : null;
    })
    .filter((x): x is { purchase: Purchase; product: Product } => Boolean(x))
    .sort(
      (a, b) =>
        new Date(a.purchase.slotStart!).getTime() -
        new Date(b.purchase.slotStart!).getTime(),
    );
}

export async function consumeDownload(
  token: string,
): Promise<{ purchase: Purchase; product: Product } | null> {
  const found = await getPurchaseByToken(token);
  if (!found) return null;
  const { purchase, product } = found;
  if (product.type !== "digital") return null;
  if (purchase.status !== "paid") return null;
  const expired = new Date(purchase.expiresAt).getTime() < Date.now();
  if (expired || purchase.downloadsRemaining <= 0) return null;

  const { error } = await db()
    .from("purchases")
    .update({ downloads_remaining: purchase.downloadsRemaining - 1 })
    .eq("token", token);
  if (error) throw new Error(error.message);
  return {
    purchase: {
      ...purchase,
      downloadsRemaining: purchase.downloadsRemaining - 1,
    },
    product,
  };
}

const USERNAME_RE = /^[a-z0-9]([a-z0-9.]{1,22}[a-z0-9])?$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9.]/g, "");
}

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username) && username.length >= 3 && username.length <= 24;
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export async function isUsernameAvailable(
  username: string,
  ownerUserId?: string,
): Promise<{ ok: boolean; error?: string }> {
  const normalized = normalizeUsername(username);
  if (!isValidUsername(normalized)) {
    return {
      ok: false,
      error: "Usa 3–24 caracteres: letras, números y puntos.",
    };
  }
  if (RESERVED_USERNAMES.has(normalized)) {
    return { ok: false, error: "Ese usuario no está disponible." };
  }
  const taken = await getStoreByUsername(normalized);
  if (taken && taken.ownerId && taken.ownerId !== ownerUserId) {
    return { ok: false, error: "Ese usuario ya está en uso." };
  }
  if (taken && !taken.ownerId) {
    return { ok: false, error: "Ese usuario ya está en uso." };
  }
  return { ok: true };
}

export async function claimOnboardingUsername(
  userId: string,
  rawUsername: string,
  displayNameHint: string,
): Promise<StoreBundle> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase no está configurado.");
  }
  const username = normalizeUsername(rawUsername);
  const availability = await isUsernameAvailable(username, userId);
  if (!availability.ok) {
    throw new Error(availability.error);
  }

  const existing = await getMyStore(userId);
  const displayName =
    existing?.creator.displayName?.trim() ||
    displayNameHint.trim() ||
    username;

  if (existing) {
    const nextStep = advanceOnboardingStep(existing.onboardingStep, "handle");
    const { error } = await db()
      .from("stores")
      .update({
        username,
        display_name: displayName,
        avatar_initials: initialsFromName(displayName),
        onboarding_step: nextStep,
      })
      .eq("id", existing.creator.id);
    if (error) {
      if (error.code === "23505") throw new Error("Ese usuario ya está en uso.");
      throw new Error(error.message);
    }
    const updated = await getStoreById(existing.creator.id);
    if (!updated) throw new Error("No se pudo actualizar la tienda.");
    return updated;
  }

  const storeId = randomUUID();
  const { error } = await db().from("stores").insert({
    id: storeId,
    owner_id: userId,
    username,
    display_name: displayName,
    bio: "",
    headline: "",
    avatar_initials: initialsFromName(displayName),
    availability: DEFAULT_AVAILABILITY,
    onboarding_completed_at: null,
    onboarding_step: "product-type",
    download_expiry_days: 7,
    download_max_count: 2,
  });
  if (error) {
    if (error.code === "23505") throw new Error("Ese usuario ya está en uso.");
    throw new Error(error.message);
  }
  const created = await getStoreById(storeId);
  if (!created) throw new Error("No se pudo leer la tienda recién creada.");
  return created;
}

export async function patchOnboardingStore(
  userId: string,
  completedStep: OnboardingStepId,
  patch: Record<string, unknown>,
): Promise<StoreBundle> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase no está configurado.");
  }
  const existing = await getMyStore(userId);
  if (!existing) throw new Error("Primero elige tu usuario.");
  const nextStep = advanceOnboardingStep(existing.onboardingStep, completedStep);
  const { error } = await db()
    .from("stores")
    .update({
      ...patch,
      onboarding_step: nextStep,
    })
    .eq("id", existing.creator.id);
  if (error) throw new Error(error.message);
  const updated = await getStoreById(existing.creator.id);
  if (!updated) throw new Error("No se pudo guardar el paso.");
  return updated;
}

export async function completeOnboarding(
  userId: string,
  patch: Record<string, unknown>,
): Promise<StoreBundle> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase no está configurado.");
  }
  const existing = await getMyStore(userId);
  if (!existing) throw new Error("Primero elige tu usuario.");
  const { error } = await db()
    .from("stores")
    .update({
      ...patch,
      onboarding_step: "done",
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", existing.creator.id);
  if (error) throw new Error(error.message);
  const updated = await getStoreById(existing.creator.id);
  if (!updated) throw new Error("No se pudo terminar el onboarding.");
  return updated;
}

export async function createStore(
  userId: string,
  input: {
    username: string;
    displayName: string;
    headline: string;
    bio: string;
    firstProduct?: {
      name: string;
      description: string;
      priceClp: number;
      type: ProductType;
      durationMinutes?: number;
    };
  },
): Promise<StoreBundle> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase no está configurado.");
  }

  const existing = await getMyStore(userId);
  if (existing) {
    throw new Error("Ya tienes una tienda en esta cuenta.");
  }

  const username = normalizeUsername(input.username);
  if (!isValidUsername(username)) {
    throw new Error(
      "Usuario inválido. Usa 3–24 caracteres: letras, números y puntos.",
    );
  }
  if (RESERVED_USERNAMES.has(username)) {
    throw new Error("Ese usuario no está disponible.");
  }

  const taken = await getStoreByUsername(username);
  if (taken) {
    throw new Error("Ese usuario ya está en uso.");
  }

  const displayName = input.displayName.trim();
  const headline = input.headline.trim();
  const bio = input.bio.trim();
  if (displayName.length < 2) throw new Error("Ingresa tu nombre público.");
  if (headline.length < 4) {
    throw new Error("Escribe un headline corto (mín. 4 caracteres).");
  }
  if (bio.length < 10) {
    throw new Error("Agrega una bio breve (mín. 10 caracteres).");
  }

  const storeId = randomUUID();
  const now = new Date().toISOString();
  const { error } = await db().from("stores").insert({
    id: storeId,
    owner_id: userId,
    username,
    display_name: displayName,
    bio,
    headline,
    avatar_initials: initialsFromName(displayName),
    availability: DEFAULT_AVAILABILITY,
    onboarding_completed_at: now,
  });
  if (error) {
    if (error.code === "23505") {
      throw new Error("Ese usuario ya está en uso.");
    }
    throw new Error(error.message);
  }

  if (input.firstProduct) {
    await createProduct(storeId, input.firstProduct);
  }

  const created = await getStoreById(storeId);
  if (!created) throw new Error("No se pudo leer la tienda recién creada.");
  return created;
}

export async function readGoogleTokensForUser(
  userId: string,
): Promise<GoogleTokenStore | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const { data, error } = await db()
    .from("google_calendar_tokens")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    access_token: data.access_token as string,
    refresh_token: (data.refresh_token as string | null) ?? undefined,
    scope: (data.scope as string | null) ?? undefined,
    token_type: (data.token_type as string | null) ?? undefined,
    expiry_date: (data.expiry_date as number | null) ?? null,
    email: (data.email as string | null) ?? undefined,
  };
}

export async function writeGoogleTokensForUser(
  userId: string,
  tokens: GoogleTokenStore,
): Promise<void> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase no está configurado.");
  }
  const { error } = await db().from("google_calendar_tokens").upsert({
    user_id: userId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    scope: tokens.scope ?? null,
    token_type: tokens.token_type ?? null,
    expiry_date: tokens.expiry_date ?? null,
    email: tokens.email ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function clearGoogleTokensForUser(userId: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  const { error } = await db()
    .from("google_calendar_tokens")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export { formatClp } from "./format-clp";
