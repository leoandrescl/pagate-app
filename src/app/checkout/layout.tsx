import { DashboardStoreProvider } from "@/components/store-providers";
import { defaultStoreSettings } from "@/lib/store-appearance";

export const dynamic = "force-dynamic";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardStoreProvider initialSettings={defaultStoreSettings()}>
      {children}
    </DashboardStoreProvider>
  );
}
