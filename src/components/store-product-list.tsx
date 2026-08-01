"use client";

import Link from "next/link";
import { useState } from "react";
import { formatClp } from "@/lib/format-clp";
import { useCart } from "@/lib/cart-context";
import { useStoreSettings } from "@/lib/store-settings-context";
import { MOCK_COMMUNITY_PRODUCT, type MockCommunityProduct } from "@/lib/mock-data";
import { InstallmentBadge } from "@/components/installment-badge";
import type { Product } from "@/lib/types";

type DisplayProduct =
  | (Product & { type: "digital" | "session" })
  | MockCommunityProduct;

function typeLabel(type: DisplayProduct["type"], platform?: string) {
  if (type === "session") return "Sesión 1:1";
  if (type === "community") {
    const labels: Record<string, string> = {
      telegram: "Telegram",
      whatsapp: "WhatsApp",
      zoom: "Zoom",
    };
    return `Comunidad · ${labels[platform ?? ""] ?? platform}`;
  }
  return "Descarga digital";
}

function platformBadge(platform?: string) {
  if (!platform) return null;
  const icons: Record<string, string> = {
    telegram: "✈️",
    whatsapp: "💬",
    zoom: "📹",
  };
  return (
    <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[var(--fog)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
      {icons[platform] ?? "🔗"} {platform}
    </span>
  );
}

function ProductCard({ product }: { product: DisplayProduct }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const isSession = product.type === "session";
  const isCommunity = product.type === "community";

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      priceClp: product.priceClp,
      type: product.type,
      durationMinutes:
        product.type === "session" ? product.durationMinutes : undefined,
      platform: isCommunity ? product.platform : undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <article className="rounded-[1.35rem] border border-[var(--line)] bg-white/80 p-5 backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(7,26,23,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">
            {typeLabel(product.type, isCommunity ? product.platform : undefined)}
            {isCommunity ? platformBadge(product.platform) : null}
          </p>
          <h2 className="font-display mt-1 text-2xl text-[var(--ink)]">
            {product.name}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            {product.description}
          </p>
          {isSession && product.type === "session" && product.durationMinutes ? (
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              {product.durationMinutes} min · eliges horario al pagar
            </p>
          ) : null}
          {isCommunity ? (
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              Acceso inmediato al grupo tras la compra
            </p>
          ) : null}
          <div className="mt-3">
            <InstallmentBadge amountClp={product.priceClp} />
          </div>
        </div>
        <p className="shrink-0 font-semibold text-[var(--teal-deep)]">
          {formatClp(product.priceClp)}
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleAdd}
          className="btn-primary flex-1"
        >
          {added ? "¡Agregado!" : "Agregar al carrito"}
        </button>
        {!isCommunity ? (
          <Link
            href={`/checkout/${product.id}`}
            className="btn-ghost flex-1 text-center text-sm"
          >
            {isSession ? "Agendar directo" : "Comprar directo"}
          </Link>
        ) : (
          <Link
            href={`/checkout/${product.id}?type=community`}
            className="btn-ghost flex-1 text-center text-sm"
          >
            Comprar directo
          </Link>
        )}
      </div>
    </article>
  );
}

export function StoreProductList({
  products,
}: {
  products: Product[];
}) {
  const { communityProducts } = useStoreSettings();

  const allProducts: DisplayProduct[] = [
    ...products,
    MOCK_COMMUNITY_PRODUCT,
    ...communityProducts,
  ];

  return (
    <section className="animate-rise-delay mt-10 space-y-4">
      {allProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </section>
  );
}
