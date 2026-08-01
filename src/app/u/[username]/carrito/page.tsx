import Link from "next/link";
import { notFound } from "next/navigation";
import { CartPageContent } from "@/components/cart-page-content";
import { CartIcon } from "@/components/cart-icon";
import { getCreatorByUsername } from "@/lib/demo-store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string }> };

export default async function CartPage({ params }: Props) {
  const { username } = await params;
  const creator = await getCreatorByUsername(username);
  if (!creator) notFound();

  return (
    <div className="atmosphere min-h-screen">
      <header className="shell flex items-center justify-between py-5">
        <Link
          href={`/u/${username}`}
          className="text-sm font-semibold text-[var(--ink-muted)]"
        >
          ← Volver a la tienda
        </Link>
        <CartIcon username={username} />
      </header>

      <main className="shell relative z-[1] max-w-lg pb-24 pt-4">
        <CartPageContent username={username} />
      </main>
    </div>
  );
}
