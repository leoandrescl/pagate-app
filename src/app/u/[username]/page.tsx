import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatClp,
  getCreatorByUsername,
  listProducts,
} from "@/lib/demo-store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string }> };

export default async function StorePage({ params }: Props) {
  const { username } = await params;
  const creator = await getCreatorByUsername(username);
  if (!creator) notFound();

  const products = await listProducts();

  return (
    <div className="atmosphere min-h-screen">
      <header className="shell flex items-center justify-between py-5">
        <Link href="/" className="text-sm font-semibold text-[var(--ink-muted)]">
          Pagate
        </Link>
        <Link href="/dashboard" className="btn-ghost text-sm">
          Soy el creador
        </Link>
      </header>

      <main className="shell relative z-[1] max-w-xl pb-24 pt-4">
        <section className="animate-rise text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--teal-deep)] font-display text-2xl text-white shadow-[0_12px_40px_var(--glow)]">
            {creator.avatarInitials}
          </div>
          <h1 className="font-display mt-5 text-4xl text-[var(--ink)]">
            {creator.displayName}
          </h1>
          <p className="mt-2 text-[var(--teal)]">{creator.headline}</p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[var(--ink-muted)]">
            {creator.bio}
          </p>
        </section>

        <section className="animate-rise-delay mt-10 space-y-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="rounded-[1.35rem] border border-[var(--line)] bg-white/80 p-5 backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(7,26,23,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl text-[var(--ink)]">{product.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                    {product.description}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-[var(--teal-deep)]">
                  {formatClp(product.priceClp)}
                </p>
              </div>
              <Link
                href={`/checkout/${product.id}`}
                className="btn-primary mt-5 w-full"
              >
                Comprar
              </Link>
            </article>
          ))}
        </section>

        <p className="mt-10 text-center text-xs text-[var(--ink-muted)]">
          Powered by Pagate · cobro y entrega automática (demo)
        </p>
      </main>
    </div>
  );
}
