import Link from "next/link";
import { notFound } from "next/navigation";
import { formatClp, getPurchaseByToken } from "@/lib/demo-store";
import { DownloadButton } from "@/components/download-button";
import { formatSlotRange } from "@/lib/slots";

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
  const isSession = product.type === "session";
  const expired = new Date(purchase.expiresAt).getTime() < Date.now();
  const canDownload =
    !isSession && !expired && purchase.downloadsRemaining > 0;

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
            {isSession ? "Cita confirmada" : "Pago confirmado"}
          </p>
          <h1 className="font-display mt-3 text-3xl text-[var(--ink)]">
            ¡Listo, {purchase.buyerName.split(" ")[0]}!
          </h1>
          <p className="mt-3 text-[var(--ink-muted)]">
            {isSession ? "Reservaste" : "Compraste"}{" "}
            <strong className="text-[var(--ink)]">{product.name}</strong> por{" "}
            {formatClp(purchase.amountClp)}.
          </p>

          {email === "1" ? (
            <div className="mt-5 rounded-2xl bg-[var(--mint)]/50 px-4 py-3 text-sm text-[var(--teal-deep)]">
              Email simulado enviado a <strong>{purchase.buyerEmail}</strong>
              {isSession
                ? " con el horario y el link de Meet."
                : " con este mismo link de descarga."}
            </div>
          ) : null}

          {isSession && purchase.slotStart && purchase.slotEnd ? (
            <div className="mt-6 space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--fog)] p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
                  Horario (Chile)
                </p>
                <p className="mt-1 font-semibold text-[var(--ink)]">
                  {formatSlotRange(purchase.slotStart, purchase.slotEnd)}
                </p>
              </div>
              {purchase.meetUrl ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
                    Videollamada
                  </p>
                  <a
                    href={purchase.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block break-all text-sm font-semibold text-[var(--teal-deep)] underline-offset-2 hover:underline"
                  >
                    {purchase.meetUrl}
                  </a>
                  <p className="mt-2 text-xs text-[var(--ink-muted)]">
                    {purchase.googleEventId
                      ? "Evento creado en Google Calendar · invitación enviada al email del comprador."
                      : "Link Meet de demostración (conecta Google Calendar en el panel para eventos reales)."}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {!isSession ? (
            <>
              <div className="mt-6 space-y-2 text-sm text-[var(--ink-muted)]">
                <p>
                  Descargas restantes:{" "}
                  <strong className="text-[var(--ink)]">
                    {purchase.downloadsRemaining}
                  </strong>{" "}
                  / 5
                </p>
                <p>
                  Vence:{" "}
                  <strong className="text-[var(--ink)]">
                    {new Date(purchase.expiresAt).toLocaleDateString("es-CL")}
                  </strong>
                </p>
              </div>
              <div className="mt-8">
                {canDownload && product.fileName ? (
                  <DownloadButton token={token} fileName={product.fileName} />
                ) : (
                  <p className="rounded-2xl bg-[var(--fog)] px-4 py-3 text-sm text-[var(--coral)]">
                    Este link ya no tiene descargas disponibles o expiró.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="mt-8">
              <Link href="/u/camila.nutri" className="btn-primary w-full">
                Volver a la tienda
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
