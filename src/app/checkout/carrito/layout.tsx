import { CartCheckoutProviders } from "@/components/cart-checkout-providers";

export default function CartCheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CartCheckoutProviders>{children}</CartCheckoutProviders>;
}
