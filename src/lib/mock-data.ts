/** // MOCK: datos estáticos para funcionalidades frontend sin backend */

export type CouponType = "percent" | "fixed";

export type MockCoupon = {
  code: string;
  type: CouponType;
  value: number;
  expiresAt: string;
  active: boolean;
};

export const MOCK_COUPONS: MockCoupon[] = [
  {
    code: "BIENVENIDA10",
    type: "percent",
    value: 10,
    expiresAt: "2026-12-31",
    active: true,
  },
  {
    code: "NUTRI5000",
    type: "fixed",
    value: 5000,
    expiresAt: "2026-08-31",
    active: true,
  },
];

/** Monto mínimo CLP para mostrar badge de cuotas sin interés */
export const INSTALLMENT_THRESHOLD_CLP = 30_000;

export const INSTALLMENT_COUNT = 3;

export type CommunityPlatform = "telegram" | "whatsapp" | "zoom";

export type MockCommunityProduct = {
  id: string;
  type: "community";
  name: string;
  description: string;
  priceClp: number;
  platform: CommunityPlatform;
  inviteUrl: string;
  createdAt: string;
};

// MOCK: producto de comunidad de ejemplo en vitrina
export const MOCK_COMMUNITY_PRODUCT: MockCommunityProduct = {
  id: "mock_community_nutri",
  type: "community",
  name: "Comunidad Nutrición consciente",
  description:
    "Grupo privado con recetas semanales, tips y soporte entre miembros. Acceso inmediato tras la compra.",
  priceClp: 12_990,
  platform: "whatsapp",
  inviteUrl: "https://chat.whatsapp.com/mock-invite-pagate",
  createdAt: new Date().toISOString(),
};

export type SocialLinks = {
  instagram?: string;
  tiktok?: string;
  whatsapp?: string;
};

export type StoreSettings = {
  bannerUrl: string;
  bio: string;
  headline: string;
  socialLinks: SocialLinks;
  brandColor: string;
};

export const DEFAULT_BANNER_URL =
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&h=400&fit=crop";

export const BRAND_COLOR_PRESETS = [
  { id: "teal", label: "Verde Pagate", value: "#1f8a72", deep: "#0d5c4d" },
  { id: "ocean", label: "Océano", value: "#2563eb", deep: "#1e40af" },
  { id: "violet", label: "Violeta", value: "#7c3aed", deep: "#5b21b6" },
  { id: "rose", label: "Rosado", value: "#e11d48", deep: "#be123c" },
  { id: "amber", label: "Ámbar", value: "#d97706", deep: "#b45309" },
  { id: "slate", label: "Grafito", value: "#475569", deep: "#334155" },
  { id: "emerald", label: "Esmeralda", value: "#059669", deep: "#047857" },
  { id: "coral", label: "Coral", value: "#e4572e", deep: "#c2410c" },
] as const;

export const DEFAULT_BRAND_COLOR = BRAND_COLOR_PRESETS[0];

export function getBrandDeep(color: string): string {
  const preset = BRAND_COLOR_PRESETS.find((p) => p.value === color);
  return preset?.deep ?? DEFAULT_BRAND_COLOR.deep;
}

export function brandGlow(color: string): string {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.35)`;
}
