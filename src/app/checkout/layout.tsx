import { DashboardStoreProvider } from "@/components/store-providers";
import { CartCheckoutProviders } from "@/components/cart-checkout-providers";
import { getCreator } from "@/lib/demo-store";

export const dynamic = "force-dynamic";

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const creator = await getCreator();

  return (
    <DashboardStoreProvider
      headline={creator.headline}
      bio={creator.bio}
    >
      <CartCheckoutProviders username={creator.username}>
        {children}
      </CartCheckoutProviders>
    </DashboardStoreProvider>
  );
}
