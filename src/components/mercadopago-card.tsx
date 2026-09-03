type Props = {
  configured: boolean;
  connected: boolean;
  status?: string;
};

function statusMessage(status?: string, connected?: boolean) {
  switch (status) {
    case "connected":
      return connected
        ? "Mercado Pago conectado. Los cobros llegan a tu cuenta."
        : "Mercado Pago autorizó, pero no quedó guardado. Conecta de nuevo.";
    case "disconnected":
      return "Mercado Pago desconectado.";
    case "denied":
      return "Permiso denegado en Mercado Pago. Intenta de nuevo.";
    case "missing_env":
      return "Faltan MP_CLIENT_ID / MP_CLIENT_SECRET en las variables de entorno.";
    case "transfer_paid":
      return "Transferencia marcada como pagada.";
    case "error":
      return "No se pudo completar la conexión con Mercado Pago.";
    default:
      return null;
  }
}

export function MercadoPagoCard({ configured, connected, status }: Props) {
  const message = statusMessage(status, connected);
  const isSuccess =
    (status === "connected" && connected) || status === "transfer_paid";

  return (
    <section className="animate-rise rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-6 backdrop-blur-sm sm:p-8">
      <h2 className="font-display text-2xl">Mercado Pago</h2>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        Conecta tu cuenta para que cada venta se cobre en tu Mercado Pago.
        Pagate solo genera el link de pago.
      </p>

      {message ? (
        <p
          className={`mt-4 rounded-xl px-3 py-2 text-sm ${
            isSuccess
              ? "bg-[var(--mint)]/50 text-[var(--teal-deep)]"
              : "bg-[var(--fog)] text-[var(--coral)]"
          }`}
        >
          {message}
        </p>
      ) : null}

      <div className="mt-5 rounded-2xl bg-[var(--fog)] p-4">
        <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
          Estado
        </p>
        <p className="mt-1 font-semibold text-[var(--ink)]">
          {connected ? "Conectado · cobros a tu cuenta" : "No conectado"}
        </p>
        {!configured ? (
          <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
            Faltan credenciales OAuth de Mercado Pago en Vercel / .env.local.
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
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
            Conectar Mercado Pago
          </a>
        )}
      </div>
    </section>
  );
}
