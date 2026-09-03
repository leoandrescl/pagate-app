import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LandingFooter, LandingHeader } from "@/components/landing-chrome";
import { comparisons, getComparison } from "@/data/comparisons";
import { studioHref } from "@/lib/urls";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return comparisons.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getComparison(slug);
  if (!comparison) return { title: "Pagate" };
  return {
    title: `Pagate vs ${comparison.name}`,
    description: comparison.hook,
  };
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;
  const comparison = getComparison(slug);
  if (!comparison) notFound();

  return (
    <div className="atmosphere min-h-screen">
      <LandingHeader />

      <main className="shell relative z-[1] pb-16 pt-10 sm:pt-14">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
          Comparación
        </p>
        <h1 className="font-display mt-4 text-4xl leading-tight text-[var(--ink)] sm:text-6xl">
          Pagate vs {comparison.name}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--ink-muted)] sm:text-xl">
          {comparison.hook}
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {comparison.bullets.map((bullet) => (
            <div
              key={bullet.label}
              className="rounded-[1.25rem] border border-[var(--line)] bg-white/55 p-6 backdrop-blur-sm"
            >
              <h2 className="font-display text-xl text-[var(--ink)]">{bullet.label}</h2>
              <p className="mt-3 flex gap-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                <span className="mt-0.5 shrink-0 text-[var(--coral)]" aria-hidden>
                  ✕
                </span>
                <span>{bullet.competitor}</span>
              </p>
              <p className="mt-2 flex gap-2 text-sm leading-relaxed text-[var(--ink)]">
                <span className="mt-0.5 shrink-0 font-semibold text-[var(--teal)]" aria-hidden>
                  ✓
                </span>
                <span>{bullet.pagate}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href={studioHref("/login")} className="btn-primary">
            Crear tu tienda
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
