import Link from "next/link";
import { notFound } from "next/navigation";
import { formatClp, getPurchaseByToken } from "@/lib/demo-store";
import { DownloadButton } from "@/components/download-button";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ email?: string }>;
};

export default async function DownloadPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { email } = await searchParams;
  const result = await getPurchaseByToken(token);
  if (!result) notFound();

  const { purchase, product } = result;
  const expired = new Date(purchase.expiresAt).getTime() < Date.now();
  const canDownload = !expired && purchase.downloadsRemaining > 0;

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
            ¡Listo, {purchase.buyerName.split(" ")[0]}!
          </h1>
          <p className="mt-3 text-[var(--ink-muted)]">
            Compraste <strong className="text-[var(--ink)]">{product.name}</strong> por{" "}
            {formatClp(purchase.amountClp)}.
          </p>

          {email === "1" ? (
            <div className="mt-5 rounded-2xl bg-[var(--mint)]/50 px-4 py-3 text-sm text-[var(--teal-deep)]">
              Email simulado enviado a <strong>{purchase.buyerEmail}</strong> con este
              mismo link de descarga.
            </div>
          ) : null}

          <div className="mt-6 space-y-2 text-sm text-[var(--ink-muted)]">
            <p>
              Descargas restantes:{" "}
              <strong className="text-[var(--ink)]">{purchase.downloadsRemaining}</strong> / 5
            </p>
            <p>
              Vence:{" "}
              <strong className="text-[var(--ink)]">
                {new Date(purchase.expiresAt).toLocaleDateString("es-CL")}
              </strong>
            </p>
          </div>

          <div className="mt-8">
            {canDownload ? (
              <DownloadButton token={token} fileName={product.fileName} />
            ) : (
              <p className="rounded-2xl bg-[var(--fog)] px-4 py-3 text-sm text-[var(--coral)]">
                Este link ya no tiene descargas disponibles o expiró.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
