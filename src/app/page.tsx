import Link from "next/link";

export default function HomePage() {
  return (
    <div className="atmosphere min-h-screen">
      <header className="shell flex items-center justify-between py-6">
        <p className="font-display text-2xl font-semibold text-[var(--ink)]">Pagate</p>
        <nav className="flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost text-sm">
            Ver panel
          </Link>
          <Link href="/u/camila.nutri" className="btn-primary text-sm">
            Ver tienda demo
          </Link>
        </nav>
      </header>

      <main className="shell relative z-[1] pb-20 pt-10 sm:pt-16">
        <section className="max-w-3xl">
          <p className="animate-rise text-sm font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
            Chile · creadores y profesionales
          </p>
          <h1 className="animate-rise-delay font-display mt-4 text-5xl leading-[1.05] text-[var(--ink)] sm:text-7xl">
            Pagate
          </h1>
          <p className="animate-rise-delay-2 mt-5 max-w-xl text-lg leading-relaxed text-[var(--ink-muted)] sm:text-xl">
            Deja de hacer de secretario en cada venta. Un link para mostrar tus
            productos digitales, agendar sesiones 1:1, cobrar en CLP y entregar solo.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn-primary">
              Abrir demo del creador
            </Link>
            <Link href="/u/camila.nutri" className="btn-ghost">
              Comprar como cliente
            </Link>
          </div>
          <p className="mt-6 text-sm text-[var(--ink-muted)]">
            Demo local sin pasarelas reales · pagos mock · sin comisión de plataforma
          </p>
        </section>

        <section className="mt-16 grid gap-8 sm:grid-cols-3">
          {[
            {
              title: "Publicas",
              body: "Subes tu guía o sesión 1:1 en minutos. Tu vitrina vive en /u/tu-usuario.",
            },
            {
              title: "Cobras",
              body: "Checkout en pesos chilenos. En producción: Webpay y transferencia vía Flow.",
            },
            {
              title: "Entregas",
              body: "PDF con link temporal, o cita con Meet mock. Cero WhatsApp, cero comprobantes.",
            },
          ].map((item) => (
            <div key={item.title} className="border-t border-[var(--line)] pt-5">
              <h2 className="font-display text-2xl text-[var(--ink)]">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                {item.body}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
