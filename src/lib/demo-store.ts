import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { Creator, DemoStore, Product, Purchase } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const DEMO_CREATOR: Creator = {
  id: "creator_demo",
  username: "camila.nutri",
  displayName: "Camila Rojas",
  bio: "Nutricionista clínica. Planes descargables y guías prácticas para comer rico sin culpa.",
  headline: "Nutrición simple para tu semana",
  avatarInitials: "CR",
};

function seedProducts(): Product[] {
  return [
    {
      id: "prod_guia_semana",
      creatorId: DEMO_CREATOR.id,
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

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readStore(): Promise<DemoStore> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as DemoStore;
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
  return store.products.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getProduct(productId: string): Promise<Product | null> {
  const store = await readStore();
  return store.products.find((p) => p.id === productId) ?? null;
}

export async function createProduct(input: {
  name: string;
  description: string;
  priceClp: number;
}): Promise<Product> {
  const store = await readStore();
  const product: Product = {
    id: `prod_${randomBytes(4).toString("hex")}`,
    creatorId: store.creator.id,
    name: input.name.trim(),
    description: input.description.trim(),
    priceClp: Math.max(0, Math.round(input.priceClp)),
    fileName: "guia-meal-prep-pagate.pdf",
    filePath: "/demo/guia-meal-prep-pagate.pdf",
    createdAt: new Date().toISOString(),
  };
  store.products.unshift(product);
  await writeStore(store);
  return product;
}

export async function createPurchase(input: {
  productId: string;
  buyerName: string;
  buyerEmail: string;
}): Promise<Purchase> {
  const store = await readStore();
  const product = store.products.find((p) => p.id === input.productId);
  if (!product) {
    throw new Error("Producto no encontrado");
  }

  const purchase: Purchase = {
    id: `pur_${randomBytes(4).toString("hex")}`,
    token: randomBytes(12).toString("hex"),
    productId: product.id,
    buyerName: input.buyerName.trim(),
    buyerEmail: input.buyerEmail.trim().toLowerCase(),
    amountClp: product.priceClp,
    status: "paid",
    downloadsRemaining: 5,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  store.purchases.unshift(purchase);
  await writeStore(store);
  return purchase;
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

export async function consumeDownload(
  token: string,
): Promise<{ purchase: Purchase; product: Product } | null> {
  const store = await readStore();
  const purchase = store.purchases.find((p) => p.token === token);
  if (!purchase) return null;

  const expired = new Date(purchase.expiresAt).getTime() < Date.now();
  if (expired || purchase.downloadsRemaining <= 0) {
    return null;
  }

  purchase.downloadsRemaining -= 1;
  await writeStore(store);

  const product = store.products.find((p) => p.id === purchase.productId);
  if (!product) return null;
  return { purchase, product };
}

export async function resetDemoStore(): Promise<DemoStore> {
  const seed = createSeedStore();
  await writeStore(seed);
  return seed;
}

export function formatClp(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}
