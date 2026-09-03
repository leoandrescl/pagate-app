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
  DEFAULT_BANNER_URL,
  DEFAULT_BRAND_COLOR,
  brandGlow,
  getBrandDeep,
  type MockCommunityProduct,
  type MockCoupon,
  type SocialLinks,
  type StoreSettings,
} from "@/lib/mock-data";

const SETTINGS_KEY = "pagate-store-settings";
const COUPONS_KEY = "pagate-creator-coupons";
const COMMUNITY_KEY = "pagate-community-products";

/** Tras crear tienda: deja headline/bio nuevos. */
export function seedClientStoreSettings(input: {
  headline: string;
  bio: string;
}): void {
  if (typeof window === "undefined") return;
  const settings: StoreSettings = {
    bannerUrl: DEFAULT_BANNER_URL,
    bio: input.bio,
    headline: input.headline,
    socialLinks: {
      instagram: "",
      tiktok: "",
      whatsapp: "",
    },
    brandColor: DEFAULT_BRAND_COLOR.value,
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  localStorage.setItem(COUPONS_KEY, "[]");
  localStorage.setItem(COMMUNITY_KEY, "[]");
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

function defaultSettings(
  headline: string,
  bio: string,
): StoreSettings {
  return {
    bannerUrl: DEFAULT_BANNER_URL,
    bio,
    headline,
    socialLinks: {
      instagram: "",
      tiktok: "",
      whatsapp: "",
    },
    brandColor: DEFAULT_BRAND_COLOR.value,
  };
}

export function StoreSettingsProvider({
  headline,
  bio,
  children,
}: {
  headline: string;
  bio: string;
  children: ReactNode;
}) {
  const [settings, setSettings] = useState<StoreSettings>(() =>
    defaultSettings(headline, bio),
  );
  const [coupons, setCoupons] = useState<MockCoupon[]>([]);
  const [communityProducts, setCommunityProducts] = useState<
    MockCommunityProduct[]
  >([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        setSettings({ ...defaultSettings(headline, bio), ...JSON.parse(raw) });
      }
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
  }, [headline, bio]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
  }, [coupons, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(COMMUNITY_KEY, JSON.stringify(communityProducts));
  }, [communityProducts, hydrated]);

  const updateSettings = useCallback((patch: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
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
