import type { Availability, Purchase } from "./types";

const TZ = "America/Santiago";
const DAY_MS = 24 * 60 * 60 * 1000;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Convierte hora de pared en America/Santiago a Date UTC. */
export function santiagoWallToDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf
      .formatToParts(utcDate)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  let hourNum = Number(parts.hour);
  if (hourNum === 24) hourNum = 0;
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hourNum,
    Number(parts.minute),
    Number(parts.second),
  );
  const offset = asUTC - utcDate.getTime();
  return new Date(utcDate.getTime() - offset);
}

function santiagoParts(date: Date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = Object.fromEntries(
    dtf
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    isoWeekday: weekdayMap[parts.weekday] ?? 1,
  };
}

function addCalendarDays(
  year: number,
  month: number,
  day: number,
  add: number,
): { year: number; month: number; day: number } {
  const base = new Date(Date.UTC(year, month - 1, day + add));
  return {
    year: base.getUTCFullYear(),
    month: base.getUTCMonth() + 1,
    day: base.getUTCDate(),
  };
}

/** Genera slots libres en zona Chile, desde hoy. */
export function generateAvailableSlots(
  availability: Availability,
  bookedStarts: string[],
  options?: {
    days?: number;
    from?: Date;
    busy?: { start: string; end: string }[];
    durationMinutes?: number;
  },
): string[] {
  const days = options?.days ?? 14;
  const from = options?.from ?? new Date();
  const booked = new Set(bookedStarts.map((s) => new Date(s).getTime()));
  const busy = options?.busy ?? [];
  const durationMs =
    (options?.durationMinutes ?? availability.slotMinutes) * 60 * 1000;
  const slots: string[] = [];

  const today = santiagoParts(from);
  let scanned = 0;

  while (slots.length < 36 && scanned < days + 10) {
    const date = addCalendarDays(today.year, today.month, today.day, scanned);
    const noon = santiagoWallToDate(date.year, date.month, date.day, 12, 0);
    const { isoWeekday } = santiagoParts(noon);

    if (availability.weekdays.includes(isoWeekday)) {
      for (
        let hour = availability.startHour;
        hour < availability.endHour;
        hour += availability.slotMinutes / 60
      ) {
        const h = Math.floor(hour);
        const m = Math.round((hour - h) * 60);
        const slot = santiagoWallToDate(date.year, date.month, date.day, h, m);
        if (slot.getTime() <= Date.now() + 15 * 60 * 1000) continue;
        if (booked.has(slot.getTime())) continue;

        const slotEnd = slot.getTime() + durationMs;
        const overlapsBusy = busy.some((b) => {
          const bStart = new Date(b.start).getTime();
          const bEnd = new Date(b.end).getTime();
          return slot.getTime() < bEnd && slotEnd > bStart;
        });
        if (overlapsBusy) continue;

        slots.push(slot.toISOString());
      }
    }

    scanned += 1;
  }

  return slots;
}

export function formatSlotChile(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

export function formatSlotRange(startIso: string, endIso: string): string {
  const start = formatSlotChile(startIso);
  const end = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(endIso));
  return `${start} – ${end}`;
}

export function formatDayHeader(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(new Date(iso));
}

export function formatTimeOnly(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

export function bookedSlotStarts(purchases: Purchase[]): string[] {
  return purchases
    .filter((p) => p.slotStart)
    .map((p) => p.slotStart as string);
}

export function buildWeekDays(from = new Date(), count = 7) {
  const today = santiagoParts(from);
  return Array.from({ length: count }, (_, i) => {
    const d = addCalendarDays(today.year, today.month, today.day, i);
    const start = santiagoWallToDate(d.year, d.month, d.day, 0, 0);
    const end = santiagoWallToDate(d.year, d.month, d.day, 23, 59);
    return {
      key: `${d.year}-${pad(d.month)}-${pad(d.day)}`,
      label: formatDayHeader(start.toISOString()),
      start,
      end,
    };
  });
}
