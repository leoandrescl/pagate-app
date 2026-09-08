"use client";

import { CartProvider } from "@/lib/cart-context";
import {
  StoreSettingsProvider,
  useStoreSettings,
  type StoreSettings,
} from "@/lib/store-settings-context";

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
  initialSettings,
  children,
}: {
  username: string;
  initialSettings: StoreSettings;
  children: React.ReactNode;
}) {
  return (
    <StoreSettingsProvider initialSettings={initialSettings}>
      <BrandThemeWrapper>
        <CartProvider username={username}>{children}</CartProvider>
      </BrandThemeWrapper>
    </StoreSettingsProvider>
  );
}

export function DashboardStoreProvider({
  initialSettings,
  children,
}: {
  initialSettings: StoreSettings;
  children: React.ReactNode;
}) {
  return (
    <StoreSettingsProvider initialSettings={initialSettings}>
      {children}
    </StoreSettingsProvider>
  );
}
