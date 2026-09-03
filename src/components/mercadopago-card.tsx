type Props = {
  configured: boolean;
  connected: boolean;
  status?: string;
};

function statusMessage(status?: string, connected?: boolean) {
  switch (status) {
    case "connected":
      return connected
        ? "Los cobros llegan a tu cuenta."
        : "Mercado Pago autorizó, pero no quedó guardado. Conecta de nuevo.";
    case "disconnected":
      return "Mercado Pago desconectado.";
    case "denied":
      return "Permiso denegado. Intenta de nuevo.";
    case "missing_env":
      return "Faltan MP_CLIENT_ID / MP_CLIENT_SECRET en el entorno.";
    case "transfer_paid":
      return "Transferencia marcada como pagada.";
    case "error":
      return "No se pudo completar la conexión.";
    default:
      return null;
  }
}

export function MercadoPagoCard({ configured, connected, status }: Props) {
  const message = statusMessage(status, connected);
  const isSuccess =
    (status === "connected" && connected) || status === "transfer_paid";

  return (
    <section className="flex h-full flex-col rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-5 backdrop-blur-sm">
      <h2 className="font-display text-xl">Mercado Pago</h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Cada venta se cobra en tu cuenta.
      </p>

      {message ? (
        <p
          className={`mt-3 rounded-xl px-3 py-2 text-sm ${
            isSuccess
              ? "bg-[var(--mint)]/50 text-[var(--teal-deep)]"
              : "bg-[var(--fog)] text-[var(--coral)]"
          }`}
        >
          {message}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            connected
              ? "bg-[var(--mint)]/60 text-[var(--teal-deep)]"
              : "bg-[var(--fog)] text-[var(--ink-muted)]"
          }`}
        >
          {connected ? "Conectado" : "No conectado"}
        </span>
        {connected ? (
          <form action="/api/mercadopago/disconnect" method="post">
            <input type="hidden" name="next" value="/dashboard" />
            <button type="submit" className="btn-ghost text-sm">
              Desconectar
            </button>
          </form>
        ) : (
          <a
            href={configured ? "/api/mercadopago/connect?next=/dashboard" : undefined}
            aria-disabled={!configured}
            className={`btn-primary text-sm ${!configured ? "pointer-events-none opacity-50" : ""}`}
          >
            Conectar
          </a>
        )}
      </div>
      {!configured ? (
        <p className="mt-3 text-xs text-[var(--ink-muted)]">
          Faltan credenciales OAuth en Vercel / .env.local.
        </p>
      ) : null}
    </section>
  );
}
