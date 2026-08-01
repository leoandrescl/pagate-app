import Link from "next/link";
import { formatClp } from "@/lib/demo-store";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ email?: string; name?: string; total?: string }>;
};

export default async function CartConfirmPage({ searchParams }: Props) {
  const { email, name, total } = await searchParams;
  const totalClp = Number(total) || 0;

  return (
    <div className="atmosphere min-h-screen">
      <header className="shell flex items-center justify-between py-5">
        <Link href="/" className="font-display text-xl font-semibold">
          Pagate
        </Link>
        <Link href="/dashboard" className="btn-ghost text-sm">
          Ir al panel
        </Link>
      </header>

      <main className="shell relative z-[1] max-w-lg pb-20 pt-8">
        <div className="animate-rise rounded-[1.5rem] border border-[var(--line)] bg-white/85 p-6 backdrop-blur-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--teal)]">
            Pago confirmado
          </p>
          <h1 className="font-display mt-3 text-3xl text-[var(--ink)]">
            ¡Listo{name ? `, ${name.split(" ")[0]}` : ""}!
          </h1>
          <p className="mt-3 text-[var(--ink-muted)]">
            Tu compra por{" "}
            <strong className="text-[var(--ink)]">
              {formatClp(totalClp)}
            </strong>{" "}
            fue procesada correctamente (demo).
          </p>

          {email ? (
            <div className="mt-5 rounded-2xl bg-[var(--mint)]/50 px-4 py-3 text-sm text-[var(--teal-deep)]">
              Email simulado enviado a <strong>{email}</strong> con los accesos,
              descargas y links de comunidad correspondientes.
            </div>
          ) : null}

          <p className="mt-4 text-sm text-[var(--ink-muted)]">
            // MOCK: checkout multi-producto sin persistencia en backend.
          </p>

          <Link href="/u/camila.nutri" className="btn-primary mt-8 block w-full text-center">
            Volver a la tienda
          </Link>
        </div>
      </main>
    </div>
  );
}
