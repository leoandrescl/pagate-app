"use client";

import { CartProvider } from "@/lib/cart-context";

export function CartCheckoutProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CartProvider username="camila.nutri">{children}</CartProvider>;
}
