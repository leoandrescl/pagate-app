type Props = {
  configured: boolean;
  connected: boolean;
  email?: string;
  status?: string;
};

function statusMessage(status?: string, connected?: boolean) {
  switch (status) {
    case "connected":
      return connected
        ? "Sesiones crean Meet e invitan al comprador."
        : "Google autorizó, pero no quedó la sesión. Conecta de nuevo.";
    case "disconnected":
      return "Google Calendar desconectado.";
    case "denied":
      return "Permiso denegado. Intenta de nuevo.";
    case "missing_env":
      return "Faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET en el entorno.";
    case "error":
      return "No se pudo completar la conexión con Google.";
    default:
      return null;
  }
}

export function GoogleCalendarCard({
  configured,
  connected,
  email,
  status,
}: Props) {
  const message = statusMessage(status, connected);
  const isSuccess = status === "connected" && connected;

  return (
    <section className="flex h-full flex-col rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-5 backdrop-blur-sm">
      <h2 className="font-display text-xl">Google Calendar</h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        {connected && email
          ? email
          : "Horarios reales y Meet en cada sesión."}
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
          <form action="/api/google/disconnect" method="post">
            <button type="submit" className="btn-ghost text-sm">
              Desconectar
            </button>
          </form>
        ) : (
          <a
            href={configured ? "/api/google/connect" : undefined}
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
