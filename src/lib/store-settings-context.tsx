"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BRAND_COLOR_PRESETS,
  brandGlow,
  getBrandDeep,
  type MockCommunityProduct,
  type MockCoupon,
  type SocialLinks,
  type StoreSettings,
} from "@/lib/mock-data";

const COUPONS_KEY = "pagate-creator-coupons";
const COMMUNITY_KEY = "pagate-community-products";

/** @deprecated Ya no se usa localStorage para la vitrina; se mantiene por compat. */
export function seedClientStoreSettings(_input: {
  headline: string;
  bio: string;
}): void {
  /* no-op: headline/bio viven en Supabase */
}

type StoreSettingsContextValue = {
  settings: StoreSettings;
  updateSettings: (patch: Partial<StoreSettings>) => void;
  brandStyle: React.CSSProperties;
  coupons: MockCoupon[];
  addCoupon: (coupon: Omit<MockCoupon, "active">) => void;
  communityProducts: MockCommunityProduct[];
  addCommunityProduct: (product: Omit<MockCommunityProduct, "id" | "type" | "createdAt">) => void;
};

const StoreSettingsContext = createContext<StoreSettingsContextValue | null>(
  null,
);

export function StoreSettingsProvider({
  initialSettings,
  children,
}: {
  initialSettings: StoreSettings;
  children: ReactNode;
}) {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [coupons, setCoupons] = useState<MockCoupon[]>([]);
  const [communityProducts, setCommunityProducts] = useState<
    MockCommunityProduct[]
  >([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    try {
      const couponsRaw = localStorage.getItem(COUPONS_KEY);
      if (couponsRaw) {
        const parsed = JSON.parse(couponsRaw) as MockCoupon[];
        setCoupons(
          parsed.filter(
            (c) => c.code !== "NUTRI5000" && c.code !== "BIENVENIDA10",
          ),
        );
      }
      const communityRaw = localStorage.getItem(COMMUNITY_KEY);
      if (communityRaw) {
        setCommunityProducts(JSON.parse(communityRaw) as MockCommunityProduct[]);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
  }, [coupons, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(COMMUNITY_KEY, JSON.stringify(communityProducts));
  }, [communityProducts, hydrated]);

  const updateSettings = useCallback((patch: Partial<StoreSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...patch,
      socialLinks: patch.socialLinks
        ? { ...prev.socialLinks, ...patch.socialLinks }
        : prev.socialLinks,
    }));
  }, []);

  const addCoupon = useCallback((coupon: Omit<MockCoupon, "active">) => {
    setCoupons((prev) => [
      { ...coupon, code: coupon.code.toUpperCase(), active: true },
      ...prev,
    ]);
  }, []);

  const addCommunityProduct = useCallback(
    (product: Omit<MockCommunityProduct, "id" | "type" | "createdAt">) => {
      const entry: MockCommunityProduct = {
        ...product,
        id: `mock_comm_${Date.now()}`,
        type: "community",
        createdAt: new Date().toISOString(),
      };
      setCommunityProducts((prev) => [entry, ...prev]);
    },
    [],
  );

  const brandStyle = useMemo(() => {
    const color = settings.brandColor;
    const deep = getBrandDeep(color);
    return {
      "--teal": color,
      "--teal-deep": deep,
      "--glow": brandGlow(color),
    } as React.CSSProperties;
  }, [settings.brandColor]);

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      brandStyle,
      coupons,
      addCoupon,
      communityProducts,
      addCommunityProduct,
    }),
    [
      settings,
      updateSettings,
      brandStyle,
      coupons,
      addCoupon,
      communityProducts,
      addCommunityProduct,
    ],
  );

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) {
    throw new Error("useStoreSettings debe usarse dentro de StoreSettingsProvider");
  }
  return ctx;
}

export { BRAND_COLOR_PRESETS, type SocialLinks, type StoreSettings };
