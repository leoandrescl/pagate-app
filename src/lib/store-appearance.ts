import { DEFAULT_BRAND_COLOR, type StoreSettings } from "@/lib/mock-data";
import type { StoreBundle } from "@/lib/types";

export function defaultStoreSettings(
  partial?: Partial<StoreSettings>,
): StoreSettings {
  return {
    bannerUrl: partial?.bannerUrl ?? "",
    bio: partial?.bio ?? "",
    headline: partial?.headline ?? "",
    brandColor: partial?.brandColor ?? DEFAULT_BRAND_COLOR.value,
    socialLinks: {
      instagram: partial?.socialLinks?.instagram ?? "",
      tiktok: partial?.socialLinks?.tiktok ?? "",
      whatsapp: partial?.socialLinks?.whatsapp ?? "",
    },
  };
}

export function storeSettingsFromBundle(store: StoreBundle): StoreSettings {
  return defaultStoreSettings({
    bannerUrl: store.bannerUrl ?? "",
    bio: store.creator.bio ?? "",
    headline: store.creator.headline ?? "",
    socialLinks: {
      instagram: store.socialLinks.instagram ?? "",
      tiktok: store.socialLinks.tiktok ?? "",
      whatsapp: store.socialLinks.whatsapp ?? "",
    },
    brandColor: store.brandColor || DEFAULT_BRAND_COLOR.value,
  });
}
