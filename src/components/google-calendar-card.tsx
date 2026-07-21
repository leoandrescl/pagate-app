type Props = {
  configured: boolean;
  connected: boolean;
  email?: string;
  status?: string;
};

function statusMessage(status?: string) {
  switch (status) {
    case "connected":
      return "Google Calendar conectado correctamente.";
    case "disconnected":
      return "Google Calendar desconectado.";
    case "denied":
      return "Permiso denegado en Google. Intenta de nuevo.";
    case "missing_env":
      return "Faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET en .env.local.";
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
  const message = statusMessage(status);

  return (
    <section className="animate-rise rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-6 backdrop-blur-sm sm:p-8">
      <h2 className="font-display text-2xl">Google Calendar</h2>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        Al conectar, las sesiones crean un evento real con Meet e invitan al
        comprador. Los horarios ocupados se ocultan del checkout.
      </p>

      {message ? (
        <p
          className={`mt-4 rounded-xl px-3 py-2 text-sm ${
            status === "connected"
              ? "bg-[var(--mint)]/50 text-[var(--teal-deep)]"
              : "bg-[var(--fog)] text-[var(--coral)]"
          }`}
        >
          {message}
        </p>
      ) : null}

      <div className="mt-5 rounded-2xl bg-[var(--fog)] p-4">
        <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">Estado</p>
        <p className="mt-1 font-semibold text-[var(--ink)]">
          {connected ? `Conectado${email ? ` · ${email}` : ""}` : "No conectado"}
        </p>
        {!configured ? (
          <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
            Crea credenciales OAuth en Google Cloud y pégalas en{" "}
            <code className="rounded bg-white/80 px-1">.env.local</code>. Ver README.
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
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
            Conectar Google Calendar
          </a>
        )}
      </div>
    </section>
  );
}
