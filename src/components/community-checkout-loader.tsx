"use client";

import { useEffect, useState } from "react";
import { CommunityCheckoutForm } from "@/components/community-checkout-form";
import { useCart } from "@/lib/cart-context";
import type { MockCommunityProduct } from "@/lib/mock-data";

export function CommunityCheckoutLoader({ productId }: { productId: string }) {
  const { username } = useCart();
  const [product, setProduct] = useState<MockCommunityProduct | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pagate-community-products");
      if (raw) {
        const list = JSON.parse(raw) as MockCommunityProduct[];
        const found = list.find((p) => p.id === productId);
        if (found) setProduct(found);
      }
    } catch {
      /* ignore */
    }
  }, [productId]);

  if (!product) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        Producto no encontrado. Vuelve a la{" "}
        <a
          href={username ? `/u/${username}` : "/"}
          className="text-[var(--teal-deep)] underline"
        >
          tienda
        </a>
        .
      </p>
    );
  }

  return <CommunityCheckoutForm product={product} />;
}
