import Link from "next/link";
import { CreateStoreForm } from "@/components/create-store-form";

export const dynamic = "force-dynamic";

export default function CrearTiendaPage() {
  return (
    <div className="atmosphere min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[var(--line)]/60 bg-[#eef6f3]/80 backdrop-blur-md">
        <div className="shell flex items-center justify-between py-4 sm:py-5">
          <Link
            href="/"
            className="font-display text-2xl font-semibold text-[var(--ink)]"
          >
            Pagate
          </Link>
          <Link href="/u/camila.nutri" className="btn-ghost text-sm">
            Ver demo
          </Link>
        </div>
      </header>

      <main className="shell relative z-[1] max-w-lg pb-20 pt-4 sm:pt-8">
        <p className="animate-rise text-sm font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
          Onboarding demo
        </p>
        <h1 className="animate-rise-delay font-display mt-3 text-4xl text-[var(--ink)] sm:text-5xl">
          Crea tu tienda
        </h1>
        <p className="animate-rise-delay-2 mt-4 text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
          Elige tu usuario, preséntate y publica tu primer producto. En minutos
          tendrás un link listo para compartir.
        </p>

        <div className="animate-rise-delay-2 mt-8">
          <CreateStoreForm />
        </div>

        <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          ¿Solo quieres explorar?{" "}
          <Link
            href="/dashboard"
            className="font-semibold text-[var(--teal-deep)] underline-offset-2 hover:underline"
          >
            Abrir panel demo
          </Link>
        </p>
      </main>
    </div>
  );
}
