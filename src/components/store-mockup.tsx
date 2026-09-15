/**
 * Mockup decorativo de una tienda Pagate, construido solo con CSS.
 * Es ilustración del hero: el contenido real ya está en el copy.
 */
export function StoreMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white/85 shadow-[0_32px_80px_-24px_var(--glow)] backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-[var(--line)] bg-white/70 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--coral)]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--teal)]/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--mint)]" />
          <span className="ml-2 flex-1 truncate rounded-full bg-[var(--fog)] px-3 py-1 text-center text-xs font-medium text-[var(--ink-muted)]">
            pagate.cl/ana.coach
          </span>
        </div>

        <div className="h-20 bg-gradient-to-r from-[var(--teal-deep)] via-[var(--teal)] to-[var(--mint)]" />
        <div className="px-5 pb-5">
          <div className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[var(--teal-deep)] font-display text-base text-white">
            A
          </div>
          <p className="font-display mt-2 text-lg text-[var(--ink)]">Ana Coach</p>
          <p className="text-xs text-[var(--ink-muted)]">
            Sesiones 1:1 · guías en PDF
          </p>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--fog)]/70 px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  Sesión inicial 45 min
                </p>
                <p className="text-xs text-[var(--ink-muted)]">$25.000</p>
              </div>
              <span className="rounded-full bg-[var(--teal-deep)] px-3 py-1.5 text-xs font-semibold text-white">
                Reservar
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--fog)]/70 px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  Guía de hábitos PDF
                </p>
                <p className="text-xs text-[var(--ink-muted)]">$9.990</p>
              </div>
              <span className="rounded-full bg-[var(--teal-deep)] px-3 py-1.5 text-xs font-semibold text-white">
                Comprar
              </span>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-[var(--mint)]/50 px-3 py-2.5 text-center text-xs font-semibold text-[var(--teal-deep)]">
            ✓ Pago con Mercado Pago · entrega automática
          </div>
        </div>
      </div>

      <div className="absolute -left-3 top-16 -rotate-3 rounded-2xl border border-[var(--line)] bg-white/95 px-3 py-2 shadow-lg sm:-left-8">
        <p className="text-xs font-semibold text-[var(--teal-deep)]">✓ Venta confirmada</p>
        <p className="text-[0.65rem] text-[var(--ink-muted)]">$25.000 → tu cuenta</p>
      </div>
      <div className="absolute -right-3 bottom-16 rotate-2 rounded-2xl border border-[var(--line)] bg-white/95 px-3 py-2 shadow-lg sm:-right-8">
        <p className="text-xs font-semibold text-[var(--teal-deep)]">📅 Sesión agendada</p>
        <p className="text-[0.65rem] text-[var(--ink-muted)]">Google Calendar ✓</p>
      </div>
    </div>
  );
}
