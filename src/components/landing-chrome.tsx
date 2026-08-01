import Link from "next/link";
import { comparisons } from "@/data/comparisons";
import { verticals } from "@/data/verticals";

export function LandingHeader() {
  return (
    <header className="shell relative z-[1] flex items-center justify-between py-6">
      <Link href="/" className="font-display text-2xl font-semibold text-[var(--ink)]">
        Pagate
      </Link>
      <nav className="flex items-center gap-2 sm:gap-3">
        <a href="/#beneficios" className="btn-ghost hidden text-sm sm:inline-flex">
          Beneficios
        </a>
        <a href="/#precios" className="btn-ghost hidden text-sm sm:inline-flex">
          Precios
        </a>
        <Link href="/dashboard" className="btn-ghost text-sm">
          Ver panel
        </Link>
        <Link href="/u/camila.nutri" className="btn-primary text-sm">
          Ver tienda demo
        </Link>
      </nav>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="relative z-[1] border-t border-[var(--line)] bg-white/40 backdrop-blur-sm">
      <div className="shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-semibold text-[var(--ink)]">Pagate</p>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">Hecho en Chile</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Navegación</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--ink-muted)]">
            <li>
              <a href="/#beneficios" className="hover:text-[var(--teal)]">
                Beneficios
              </a>
            </li>
            <li>
              <a href="/#precios" className="hover:text-[var(--teal)]">
                Precios
              </a>
            </li>
            <li>
              <a href="/#faq" className="hover:text-[var(--teal)]">
                FAQ
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[var(--teal)]">
                Términos
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[var(--teal)]">
                Privacidad
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Pagate para</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--ink-muted)]">
            {verticals.map((v) => (
              <li key={v.slug}>
                <Link href={`/para/${v.slug}`} className="hover:text-[var(--teal)]">
                  {v.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Pagate vs</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--ink-muted)]">
            {comparisons.map((c) => (
              <li key={c.slug}>
                <Link href={`/vs/${c.slug}`} className="hover:text-[var(--teal)]">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
