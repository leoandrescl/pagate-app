import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type {
  Availability,
  Creator,
  DemoStore,
  GoogleCalendarConnection,
  Product,
  ProductType,
  Purchase,
} from "./types";

const DATA_DIR =
  process.env.VERCEL || process.env.DATA_DIR
    ? path.join(process.env.DATA_DIR || "/tmp", "pagate-data")
    : path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const DEFAULT_AVAILABILITY: Availability = {
  timezone: "America/Santiago",
  weekdays: [1, 2, 3, 4, 5],
  startHour: 10,
  endHour: 18,
  slotMinutes: 60,
};

const DEMO_CREATOR: Creator = {
  id: "creator_demo",
  username: "camila.nutri",
  displayName: "Camila Rojas",
  bio: "Nutricionista clínica. Planes descargables, guías prácticas y sesiones 1:1 por videollamada.",
  headline: "Nutrición simple para tu semana",
  avatarInitials: "CR",
  availability: DEFAULT_AVAILABILITY,
};

function seedProducts(): Product[] {
  return [
    {
      id: "prod_sesion_nutri",
      creatorId: DEMO_CREATOR.id,
      type: "session",
      name: "Sesión nutricional 1:1 (45 min)",
      description:
        "Videollamada para revisar tu alimentación y armar un plan semanal. Eliges horario al pagar.",
      priceClp: 35000,
      durationMinutes: 45,
      createdAt: new Date().toISOString(),
    },
    {
      id: "prod_guia_semana",
      creatorId: DEMO_CREATOR.id,
      type: "digital",
      name: "Guía de meal prep (7 días)",
      description:
        "Menús, lista de compras y tip de batch cooking en PDF. Ideal para empezar sin complicarte.",
      priceClp: 7990,
      fileName: "guia-meal-prep-pagate.pdf",
      filePath: "/demo/guia-meal-prep-pagate.pdf",
      createdAt: new Date().toISOString(),
    },
    {
      id: "prod_habitos",
      creatorId: DEMO_CREATOR.id,
      type: "digital",
      name: "Workbook: hábitos alimentarios",
      description:
        "Plantillas imprimibles para registrar comidas, hambre real y metas semanales.",
      priceClp: 4990,
      fileName: "workbook-habitos-pagate.pdf",
      filePath: "/demo/workbook-habitos-pagate.pdf",
      createdAt: new Date().toISOString(),
    },
  ];
}

function createSeedStore(): DemoStore {
  return {
    creator: DEMO_CREATOR,
    products: seedProducts(),
    purchases: [],
  };
}

function normalizeStore(raw: DemoStore): DemoStore {
  return {
    ...raw,
    creator: {
      ...DEMO_CREATOR,
      ...raw.creator,
      availability: {
        ...DEFAULT_AVAILABILITY,
        ...(raw.creator.availability ?? {}),
      },
      googleCalendar: raw.creator.googleCalendar,
    },
    products: (raw.products ?? []).map((p) => ({
      ...p,
      type: (p.type ?? "digital") as ProductType,
    })),
    purchases: (raw.purchases ?? []).map((p) => ({
      ...p,
      status: p.status ?? "paid",
    })),
  };
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readStore(): Promise<DemoStore> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return normalizeStore(JSON.parse(raw) as DemoStore);
  } catch {
    const seed = createSeedStore();
    await writeStore(seed);
    return seed;
  }
}

async function writeStore(store: DemoStore): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function getStore(): Promise<DemoStore> {
  return readStore();
}

export async function getCreator(): Promise<Creator> {
  const store = await readStore();
  return store.creator;
}

export async function getCreatorByUsername(
  username: string,
): Promise<Creator | null> {
  const store = await readStore();
  if (store.creator.username.toLowerCase() !== username.toLowerCase()) {
    return null;
  }
  return store.creator;
}

export async function listProducts(): Promise<Product[]> {
  const store = await readStore();
  return store.products.sort((a, b) => {
    // Sesiones primero, luego por fecha
    if (a.type !== b.type) return a.type === "session" ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function getProduct(productId: string): Promise<Product | null> {
  const store = await readStore();
  return store.products.find((p) => p.id === productId) ?? null;
}

export async function createProduct(input: {
  name: string;
  description: string;
  priceClp: number;
  type: ProductType;
  durationMinutes?: number;
}): Promise<Product> {
  const store = await readStore();
  const isSession = input.type === "session";
  const product: Product = {
    id: `prod_${randomBytes(4).toString("hex")}`,
    creatorId: store.creator.id,
    type: input.type,
    name: input.name.trim(),
    description: input.description.trim(),
    priceClp: Math.max(0, Math.round(input.priceClp)),
    durationMinutes: isSession ? input.durationMinutes ?? 45 : undefined,
    fileName: isSession ? undefined : "guia-meal-prep-pagate.pdf",
    filePath: isSession ? undefined : "/demo/guia-meal-prep-pagate.pdf",
    createdAt: new Date().toISOString(),
  };
  store.products.unshift(product);
  await writeStore(store);
  return product;
}

export async function updateAvailability(
  patch: Partial<Availability>,
): Promise<Availability> {
  const store = await readStore();
  store.creator.availability = {
    ...store.creator.availability,
    ...patch,
  };
  await writeStore(store);
  return store.creator.availability;
}

export async function createPurchase(input: {
  productId: string;
  buyerName: string;
  buyerEmail: string;
  slotStart?: string;
  status?: Purchase["status"];
}): Promise<Purchase> {
  const store = await readStore();
  const product = store.products.find((p) => p.id === input.productId);
  if (!product) {
    throw new Error("Producto no encontrado");
  }

  if (product.type === "session") {
    if (!input.slotStart) {
      throw new Error("Debes elegir un horario");
    }
    const taken = store.purchases.some(
      (p) =>
        p.slotStart === input.slotStart &&
        (p.status === "paid" || p.status === "pending"),
    );
    if (taken) {
      throw new Error("Ese horario ya fue reservado");
    }
  }

  const duration = product.durationMinutes ?? 45;
  const slotStart = input.slotStart;
  const slotEnd = slotStart
    ? new Date(new Date(slotStart).getTime() + duration * 60 * 1000).toISOString()
    : undefined;

  const status = input.status ?? "paid";

  const purchase: Purchase = {
    id: `pur_${randomBytes(4).toString("hex")}`,
    token: randomBytes(12).toString("hex"),
    productId: product.id,
    buyerName: input.buyerName.trim(),
    buyerEmail: input.buyerEmail.trim().toLowerCase(),
    amountClp: product.priceClp,
    status,
    downloadsRemaining: product.type === "digital" && status === "paid" ? 5 : 0,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    slotStart,
    slotEnd,
    meetUrl: undefined,
  };

  store.purchases.unshift(purchase);
  await writeStore(store);
  return purchase;
}

export async function updatePurchaseCalendar(
  token: string,
  data: { meetUrl?: string; googleEventId?: string },
): Promise<Purchase | null> {
  const store = await readStore();
  const purchase = store.purchases.find((p) => p.token === token);
  if (!purchase) return null;
  if (data.meetUrl) purchase.meetUrl = data.meetUrl;
  if (data.googleEventId) purchase.googleEventId = data.googleEventId;
  await writeStore(store);
  return purchase;
}

export async function updatePurchasePayment(
  token: string,
  data: {
    status?: Purchase["status"];
    mpPreferenceId?: string;
    mpPaymentId?: string;
  },
): Promise<Purchase | null> {
  const store = await readStore();
  const purchase = store.purchases.find((p) => p.token === token);
  if (!purchase) return null;
  if (data.status) {
    purchase.status = data.status;
    if (data.status === "paid" && purchase.downloadsRemaining === 0) {
      const product = store.products.find((p) => p.id === purchase.productId);
      if (product?.type === "digital") {
        purchase.downloadsRemaining = 5;
      }
    }
  }
  if (data.mpPreferenceId) purchase.mpPreferenceId = data.mpPreferenceId;
  if (data.mpPaymentId) purchase.mpPaymentId = data.mpPaymentId;
  await writeStore(store);
  return purchase;
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

  const store = await readStore();
  const product = store.products.find((p) => p.id === input.productId);
  const duration = product?.durationMinutes ?? 45;
  const slotEnd = input.slotStart
    ? new Date(
        new Date(input.slotStart).getTime() + duration * 60 * 1000,
      ).toISOString()
    : undefined;

  const purchase: Purchase = {
    id: `pur_${randomBytes(4).toString("hex")}`,
    token: input.token,
    productId: input.productId,
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    amountClp: input.amountClp,
    status: input.status,
    downloadsRemaining:
      product?.type === "digital" && input.status === "paid" ? 5 : 0,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    slotStart: input.slotStart,
    slotEnd,
    mpPaymentId: input.mpPaymentId,
  };
  store.purchases.unshift(purchase);
  await writeStore(store);
  return purchase;
}

export async function setGoogleCalendarStatus(
  status: GoogleCalendarConnection,
): Promise<void> {
  const store = await readStore();
  store.creator.googleCalendar = status;
  await writeStore(store);
}

export async function getPurchaseByToken(
  token: string,
): Promise<{ purchase: Purchase; product: Product } | null> {
  const store = await readStore();
  const purchase = store.purchases.find((p) => p.token === token);
  if (!purchase) return null;
  const product = store.products.find((p) => p.id === purchase.productId);
  if (!product) return null;
  return { purchase, product };
}

export async function listUpcomingSessions(): Promise<
  { purchase: Purchase; product: Product }[]
> {
  const store = await readStore();
  const now = Date.now();
  return store.purchases
    .filter(
      (p) =>
        p.status === "paid" &&
        p.slotStart &&
        new Date(p.slotStart).getTime() >= now - 60 * 60 * 1000,
    )
    .map((purchase) => {
      const product = store.products.find((p) => p.id === purchase.productId);
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
  const store = await readStore();
  const purchase = store.purchases.find((p) => p.token === token);
  if (!purchase) return null;

  const product = store.products.find((p) => p.id === purchase.productId);
  if (!product || product.type !== "digital") return null;
  if (purchase.status !== "paid") return null;

  const expired = new Date(purchase.expiresAt).getTime() < Date.now();
  if (expired || purchase.downloadsRemaining <= 0) {
    return null;
  }

  purchase.downloadsRemaining -= 1;
  await writeStore(store);
  return { purchase, product };
}

export async function resetDemoStore(): Promise<DemoStore> {
  const previous = await readStore().catch(() => null);
  const seed = createSeedStore();
  if (previous?.creator.googleCalendar?.connected) {
    seed.creator.googleCalendar = previous.creator.googleCalendar;
  }
  await writeStore(seed);
  return seed;
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

export async function createStore(input: {
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
}): Promise<DemoStore> {
  const username = normalizeUsername(input.username);
  if (!isValidUsername(username)) {
    throw new Error(
      "Usuario inválido. Usa 3–24 caracteres: letras, números y puntos.",
    );
  }

  const displayName = input.displayName.trim();
  const headline = input.headline.trim();
  const bio = input.bio.trim();
  if (displayName.length < 2) {
    throw new Error("Ingresa tu nombre público.");
  }
  if (headline.length < 4) {
    throw new Error("Escribe un headline corto (mín. 4 caracteres).");
  }
  if (bio.length < 10) {
    throw new Error("Agrega una bio breve (mín. 10 caracteres).");
  }

  const creatorId = `creator_${randomBytes(4).toString("hex")}`;
  const creator: Creator = {
    id: creatorId,
    username,
    displayName,
    bio,
    headline,
    avatarInitials: initialsFromName(displayName),
    availability: { ...DEFAULT_AVAILABILITY },
  };

  const products: Product[] = [];
  if (input.firstProduct) {
    const isSession = input.firstProduct.type === "session";
    products.push({
      id: `prod_${randomBytes(4).toString("hex")}`,
      creatorId,
      type: input.firstProduct.type,
      name: input.firstProduct.name.trim(),
      description: input.firstProduct.description.trim(),
      priceClp: Math.max(0, Math.round(input.firstProduct.priceClp)),
      durationMinutes: isSession
        ? input.firstProduct.durationMinutes ?? 45
        : undefined,
      fileName: isSession ? undefined : "guia-meal-prep-pagate.pdf",
      filePath: isSession ? undefined : "/demo/guia-meal-prep-pagate.pdf",
      createdAt: new Date().toISOString(),
    });
  }

  const store: DemoStore = {
    creator,
    products,
    purchases: [],
  };
  await writeStore(store);
  return store;
}

export { formatClp } from "./format-clp";
