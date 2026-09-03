"use client";

import Link from "next/link";
import { useState } from "react";
import { studioHref } from "@/lib/urls";
import { comparisons } from "@/data/comparisons";
import { verticals } from "@/data/verticals";

const NAV_LINKS = [
  { href: "/#beneficios", label: "Beneficios" },
  { href: "/#precios", label: "Precios" },
  { href: "/#faq", label: "FAQ" },
] as const;

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)]/60 bg-[var(--fog)]/85 backdrop-blur-md transition-[background-color,border-color] duration-300">
      <div className="shell py-4 sm:py-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="font-display shrink-0 text-2xl font-semibold text-[var(--ink)]"
            onClick={() => setOpen(false)}
          >
            Pagate
          </Link>

          <nav className="hidden items-center gap-3 sm:flex" aria-label="Principal">
            <Link href="/#beneficios" className="btn-ghost text-sm">
              Beneficios
            </Link>
            <Link href="/#precios" className="btn-ghost text-sm">
              Precios
            </Link>
            <Link href={studioHref("/login")} className="btn-primary text-sm">
              Crear tu tienda
            </Link>
          </nav>

          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-white/70 text-[var(--ink)] sm:hidden"
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Cerrar" : "Menú"}</span>
            <span className="flex w-4 flex-col gap-1" aria-hidden>
              <span
                className={`block h-0.5 w-full rounded-full bg-[var(--ink)] transition ${
                  open ? "translate-y-[6px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-full rounded-full bg-[var(--ink)] transition ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-full rounded-full bg-[var(--ink)] transition ${
                  open ? "-translate-y-[6px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>

        {open ? (
          <nav
            id="landing-mobile-nav"
            className="mt-4 flex flex-col border-t border-[var(--line)] pt-3 sm:hidden"
            aria-label="Menú móvil"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center px-1 text-base font-semibold text-[var(--ink)]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={studioHref("/login")}
              className="btn-primary mt-3 w-full justify-center text-sm"
              onClick={() => setOpen(false)}
            >
              Crear tu tienda
            </Link>
          </nav>
        ) : null}
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="relative z-[1] border-t border-[var(--line)] bg-white/40 backdrop-blur-sm">
      <div className="shell grid gap-8 py-10 max-[480px]:gap-9 sm:grid-cols-2 sm:gap-10 sm:py-12 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-semibold text-[var(--ink)]">Pagate</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Navegación</p>
          <ul className="mt-3 space-y-1 text-sm text-[var(--ink-muted)]">
            <li>
              <Link
                href="/#beneficios"
                className="inline-flex min-h-11 items-center hover:text-[var(--teal)]"
              >
                Beneficios
              </Link>
            </li>
            <li>
              <Link
                href="/#precios"
                className="inline-flex min-h-11 items-center hover:text-[var(--teal)]"
              >
                Precios
              </Link>
            </li>
            <li>
              <Link
                href="/#faq"
                className="inline-flex min-h-11 items-center hover:text-[var(--teal)]"
              >
                FAQ
              </Link>
            </li>
            <li>
              <a href="#" className="inline-flex min-h-11 items-center hover:text-[var(--teal)]">
                Términos
              </a>
            </li>
            <li>
              <a href="#" className="inline-flex min-h-11 items-center hover:text-[var(--teal)]">
                Privacidad
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Pagate para</p>
          <ul className="mt-3 space-y-1 text-sm text-[var(--ink-muted)]">
            {verticals.map((v) => (
              <li key={v.slug}>
                <Link
                  href={`/para/${v.slug}`}
                  className="inline-flex min-h-11 items-center hover:text-[var(--teal)]"
                >
                  {v.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Pagate vs</p>
          <ul className="mt-3 space-y-1 text-sm text-[var(--ink-muted)]">
            {comparisons.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/vs/${c.slug}`}
                  className="inline-flex min-h-11 items-center hover:text-[var(--teal)]"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="shell border-t border-[var(--line)] py-6">
        <p className="text-sm text-[var(--ink-muted)]">Hecho en Chile con amor ❤️</p>
      </div>
    </footer>
  );
}
