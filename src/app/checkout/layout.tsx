import { DashboardStoreProvider } from "@/components/store-providers";

export const dynamic = "force-dynamic";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardStoreProvider headline="" bio="">
      {children}
    </DashboardStoreProvider>
  );
}
