import Link from "next/link";
import { notFound } from "next/navigation";
import { CartIcon } from "@/components/cart-icon";
import { StoreHeader } from "@/components/store-header";
import { StoreProductList } from "@/components/store-product-list";
import {
  getCreatorByUsername,
  listProductsByUsername,
} from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string }> };

export default async function StorePage({ params }: Props) {
  const { username } = await params;
  const creator = await getCreatorByUsername(username);
  if (!creator) notFound();

  const products = await listProductsByUsername(username);

  return (
    <div className="atmosphere min-h-screen">
      <header className="shell flex items-center justify-between py-5">
        <Link href="/" className="text-sm font-semibold text-[var(--ink-muted)]">
          Pagate
        </Link>
        <div className="flex items-center gap-3">
          <CartIcon username={username} />
        </div>
      </header>

      <main className="shell relative z-[1] max-w-xl pb-24 pt-4">
        <StoreHeader
          displayName={creator.displayName}
          avatarInitials={creator.avatarInitials}
        />

        <StoreProductList products={products} />

        <p className="mt-10 text-center text-xs text-[var(--ink-muted)]">
          Powered by Pagate · cobro con Webpay, transferencia o Mercado Pago (demo)
        </p>
      </main>
    </div>
  );
}
