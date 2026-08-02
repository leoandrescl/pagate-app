"use client";

import { CartProvider } from "@/lib/cart-context";

export function CartCheckoutProviders({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  return <CartProvider username={username}>{children}</CartProvider>;
}
