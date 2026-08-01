"use client";

import { CartProvider } from "@/lib/cart-context";
import { StoreSettingsProvider, useStoreSettings } from "@/lib/store-settings-context";

function BrandThemeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { brandStyle } = useStoreSettings();
  return (
    <div style={brandStyle} className="contents">
      {children}
    </div>
  );
}

export function StoreProviders({
  username,
  headline,
  bio,
  children,
}: {
  username: string;
  headline: string;
  bio: string;
  children: React.ReactNode;
}) {
  return (
    <StoreSettingsProvider headline={headline} bio={bio}>
      <BrandThemeWrapper>
        <CartProvider username={username}>{children}</CartProvider>
      </BrandThemeWrapper>
    </StoreSettingsProvider>
  );
}

export function DashboardStoreProvider({
  headline,
  bio,
  children,
}: {
  headline: string;
  bio: string;
  children: React.ReactNode;
}) {
  return (
    <StoreSettingsProvider headline={headline} bio={bio}>
      {children}
    </StoreSettingsProvider>
  );
}
