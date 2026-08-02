import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LandingFooter, LandingHeader } from "@/components/landing-chrome";
import { getVertical, verticals } from "@/data/verticals";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return verticals.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const vertical = getVertical(slug);
  if (!vertical) return { title: "Pagate" };
  return {
    title: `Pagate para ${vertical.name}`,
    description: vertical.headline,
  };
}

export default async function VerticalPage({ params }: Props) {
  const { slug } = await params;
  const vertical = getVertical(slug);
  if (!vertical) notFound();

  return (
    <div className="atmosphere min-h-screen">
      <LandingHeader />

      <main className="shell relative z-[1] pb-16 pt-10 sm:pt-14">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
          Pagate para {vertical.name}
        </p>
        <h1 className="font-display mt-4 max-w-3xl text-4xl leading-tight text-[var(--ink)] sm:text-5xl">
          {vertical.headline}
        </h1>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/55 p-6 backdrop-blur-sm sm:p-8">
            <h2 className="font-display text-2xl text-[var(--ink)]">Qué puedes vender</h2>
            <ul className="mt-5 space-y-3">
              {vertical.sells.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-relaxed text-[var(--ink)] sm:text-base"
                >
                  <span className="mt-0.5 shrink-0 font-semibold text-[var(--teal)]" aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[1.25rem] border border-[var(--teal)]/35 bg-[var(--mint)]/25 p-6 sm:p-8">
            <h2 className="font-display text-2xl text-[var(--ink)]">Cómo te ayuda Pagate</h2>
            <ul className="mt-5 space-y-3">
              {vertical.helps.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-relaxed text-[var(--ink)] sm:text-base"
                >
                  <span className="mt-0.5 shrink-0 font-semibold text-[var(--teal)]" aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/crear" className="btn-primary">
            Crear tu tienda
          </Link>
          <Link href="/u/camila.nutri" className="btn-ghost">
            Ver demo
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
