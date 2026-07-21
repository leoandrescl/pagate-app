import type { GoogleCalendarEventItem } from "@/lib/google-calendar";
import { buildWeekDays, formatTimeOnly } from "@/lib/slots";

type Props = {
  events: GoogleCalendarEventItem[];
  connected: boolean;
};

export function WeekCalendar({ events, connected }: Props) {
  const days = buildWeekDays(new Date(), 7);

  const eventsByDay = days.map((day) => ({
    ...day,
    items: events.filter((e) => {
      const t = new Date(e.start).getTime();
      return t >= day.start.getTime() && t <= day.end.getTime();
    }),
  }));

  return (
    <section className="animate-rise rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-6 backdrop-blur-sm sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Calendario (7 días)</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {connected
              ? "Eventos reales de tu Google Calendar · zona America/Santiago"
              : "Conecta Google Calendar para ver eventos reales"}
          </p>
        </div>
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noreferrer"
          className="btn-ghost text-sm"
        >
          Abrir Google Calendar
        </a>
      </div>

      {!connected ? (
        <p className="mt-6 rounded-2xl bg-[var(--fog)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Sin conexión a Google aún no hay datos de calendario en vivo.
        </p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {eventsByDay.map((day) => (
            <div
              key={day.key}
              className="min-h-36 rounded-2xl border border-[var(--line)] bg-[var(--fog)]/60 p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                {day.label}
              </p>
              <div className="mt-2 space-y-2">
                {day.items.length === 0 ? (
                  <p className="text-xs text-[var(--ink-muted)]">Libre</p>
                ) : (
                  day.items.map((ev) => (
                    <a
                      key={ev.id}
                      href={ev.htmlLink || ev.meetUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className={`block rounded-xl px-2 py-1.5 text-xs leading-snug transition hover:opacity-90 ${
                        ev.isPagate
                          ? "bg-[var(--teal-deep)] text-white"
                          : "bg-white text-[var(--ink)] border border-[var(--line)]"
                      }`}
                    >
                      <span className="font-semibold">{formatTimeOnly(ev.start)}</span>
                      <span className="mt-0.5 block line-clamp-2 opacity-90">
                        {ev.summary}
                      </span>
                    </a>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
