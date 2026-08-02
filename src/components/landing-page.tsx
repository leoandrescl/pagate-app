"use client";

import Link from "next/link";
import { useState } from "react";
import { LandingFooter, LandingHeader } from "@/components/landing-chrome";
import { comparisons } from "@/data/comparisons";
import { BRAND_COLOR_PRESETS } from "@/lib/mock-data";

const USE_CASES = [
  {
    title: "Creadores de contenido",
    sells: "guías, plantillas, presets, packs, clases grabadas",
    helps:
      "convertir lo que ya sabes hacer en un producto vendible y entregable sin fricción.",
  },
  {
    title: "Psicólogos / terapeutas",
    sells: "sesiones online, packs de sesiones, talleres breves, guías de hábitos",
    helps:
      "tener tu agenda ordenada, evitar ida y vuelta por WhatsApp, y centralizar pagos y reservas.",
  },
  {
    title: "Nutricionistas",
    sells: "planes alimenticios en PDF, sesiones de seguimiento, packs de recetas",
    helps: "entregar tus planes al instante y agendar controles sin coordinar a mano.",
  },
  {
    title: "Asesores financieros",
    sells: "asesorías 1:1, plantillas de presupuesto, mini-cursos",
    helps: "cobrar tus sesiones por adelantado y automatizar la entrega de tus materiales.",
  },
  {
    title: "Coaches / mentores / consultores",
    sells: "mentorías, packs de sesiones, guías de trabajo",
    helps: "profesionalizar tu oferta con una tienda propia, sin código.",
  },
];

const STEPS = [
  {
    title: "Crea tu tienda",
    body: "Elige tu usuario y publícala en segundos. No necesitas tarjeta de crédito.",
  },
  {
    title: "Configura tu perfil",
    body: "Escribe tu headline, bio y agrega tus redes. Tu link queda listo para la bio de Instagram.",
  },
  {
    title: "Conecta tus herramientas",
    body: "Integra tu cuenta de pago y Google Calendar en minutos.",
  },
  {
    title: "Sube tus productos",
    body: "Productos digitales, sesiones, o ambos. Todo desde el mismo panel.",
  },
  {
    title: "Comparte tu link",
    body: "Usa pagate.cl/tu-usuario en tu bio de Instagram y empieza a vender.",
  },
];

const BENEFITS = [
  {
    title: "Cobros directos a tu cuenta",
    body: "El dinero de cada venta llega directo a tu cuenta. Pagate no intermedia ni retiene pagos.",
  },
  {
    title: "Sesiones online con Google Calendar",
    body: "Vende sesiones 1:1 sin coordinar por WhatsApp. Tu cliente elige horario y el evento se agenda solo, con link de Google Meet incluido.",
  },
  {
    title: "Carrito multi-producto",
    body: "Vende varios productos en una misma compra: guías, presets, plantillas o sesiones.",
  },
  {
    title: "Entrega automática post-pago",
    body: "Después del pago, tu cliente recibe un correo con el link de descarga o el acceso a su compra. Sin envíos manuales.",
  },
  {
    title: "Descargas seguras",
    body: "Links temporales con vencimiento y límite de descargas. Protege tu contenido sin usar links compartidos.",
  },
  {
    title: "Política de reagenda flexible",
    body: "Permite reagendar sesiones según las condiciones que tú definas. Tu cliente reagenda solo, tú no te encargas de nada.",
  },
];

const FEATURES = [
  {
    badge: "PRO",
    title: "Cupones y descuentos a medida",
    body: "Códigos únicos para lanzamientos o fechas especiales. Tú defines vigencia y tope de usos.",
    preview: "coupon" as const,
  },
  {
    badge: "NUEVO",
    title: "Bio blocks de presentación",
    body: "Preséntate antes de vender: foto, texto, banner y redes arriba de tus productos. Tu tienda deja de ser una grilla y se vuelve tu carta de presentación.",
    preview: "bio" as const,
  },
  {
    badge: "NUEVO",
    title: "Vende acceso a tu grupo o taller",
    body: "Pensado para comunidades en Telegram o WhatsApp, o talleres por Zoom. Tu comprador paga y entra al instante.",
    preview: "community" as const,
  },
  {
    badge: "PRÓXIMAMENTE",
    title: "Pago en cuotas",
    body: "Tus compradores podrán pagar en cuotas sin interés, y tú recibes como si fuera al contado.",
    preview: "installments" as const,
  },
];

const FREE_PLAN = [
  "Tu tienda en pagate.cl/usuario",
  "Todos los tipos de producto",
  "Cobro directo por Webpay o transferencia",
  "Agenda automática con Google Calendar",
  "Entrega automática de archivos",
];

const PRO_PLAN = [
  "Productos ilimitados",
  "Ventas sin tope",
  "Cupones y descuentos",
  "Colores personalizados de tienda",
  "Marca de agua automática en PDFs",
  "Soporte prioritario",
];

const FAQ = [
  {
    q: "¿Cuánto cuesta usar Pagate?",
    a: "Empieza gratis con hasta 2 productos y tus primeras 5 ventas. Pro cuesta $8.990/mes, sin comisión de Pagate por venta.",
  },
  {
    q: "¿Cómo recibo el dinero de mis ventas?",
    a: "La plata llega directo a tu cuenta vía Flow (Webpay o transferencia). Pagate no intermedia ni retiene pagos.",
  },
  {
    q: "¿Cuánto tarda en llegar cada venta a mi cuenta?",
    a: "Depende de tu pasarela: Webpay suele acreditarse en el plazo de tu banco; transferencia según los tiempos de Flow.",
  },
  {
    q: "¿Qué puedo vender en Pagate?",
    a: "Productos digitales, sesiones 1:1, packs, talleres y acceso a comunidades o grupos.",
  },
  {
    q: "¿Mis clientes necesitan crear una cuenta?",
    a: "No. Entran a tu link, pagan y reciben su compra sin registrarse.",
  },
  {
    q: "¿Pagate me emite la boleta?",
    a: "No. Tú eres el vendedor: emites boleta o factura según corresponda a tu actividad.",
  },
  {
    q: "¿Puedo usar mi propio dominio?",
    a: "Por ahora tu tienda vive en pagate.cl/tu-usuario. Dominio propio llegará más adelante.",
  },
  {
    q: "¿Qué pasa si un cliente pide un reembolso?",
    a: "Tú defines la política. Como Pagate no retiene el dinero, el reembolso se gestiona con tu pasarela.",
  },
  {
    q: "¿Mi contenido está protegido?",
    a: "Sí: links de descarga temporales con vencimiento y límite de usos, sin carpetas compartidas.",
  },
];

const WITHOUT = [
  "El cliente pregunta el precio por WhatsApp o Instagram",
  "Varios mensajes para coordinar día y horario",
  '"Te paso los datos, mándame el comprobante"',
  "Confirmas a mano y mandas el PDF por correo o Drive",
  "Anotas tú mismo la hora en tu calendario",
];

const WITH = [
  "El cliente entra a tu link de Pagate",
  "Elige el producto o la sesión y completa el checkout",
  "Paga con Webpay o transferencia — la plata llega directo a tu cuenta",
  "Recibe su compra por correo automáticamente",
  "La sesión se agenda sola en tu Google Calendar",
];

function SectionHeading({
  title,
  subtitle,
  id,
}: {
  title: string;
  subtitle?: string;
  id?: string;
}) {
  return (
    <div className="max-w-2xl" id={id}>
      <h2 className="font-display text-3xl leading-tight text-[var(--ink)] sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--teal)]/30 bg-[var(--mint)]/40 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--teal-deep)]">
      {children}
    </span>
  );
}

function FeaturePreview({ kind }: { kind: (typeof FEATURES)[number]["preview"] }) {
  if (kind === "coupon") {
    return (
      <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--teal)] bg-[var(--mint)]/40 px-3 py-2 text-sm">
        <span className="font-semibold text-[var(--teal-deep)]">LANZAMIENTO20</span>
        <span className="text-[var(--ink-muted)]">−20% aplicado</span>
      </div>
    );
  }
  if (kind === "bio") {
    return (
      <div className="mt-4 overflow-hidden rounded-xl border border-[var(--line)] bg-white/90">
        <div className="h-10 bg-gradient-to-r from-[var(--teal)] to-[var(--mint)]" />
        <div className="relative px-3 pb-3 pt-0 text-center">
          <div className="mx-auto -mt-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--teal-deep)] text-[0.6rem] font-semibold text-white">
            CN
          </div>
          <p className="mt-1 font-display text-sm text-[var(--ink)]">Camila Nutri</p>
          <p className="text-[0.65rem] text-[var(--teal)]">Planes y sesiones online</p>
        </div>
      </div>
    );
  }
  if (kind === "community") {
    return (
      <div className="mt-4 rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2.5 text-sm">
        <p className="font-semibold text-[var(--ink)]">Grupo Telegram · Nutrición</p>
        <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Pago → acceso al instante</p>
      </div>
    );
  }
  return (
    <div className="mt-4">
      <span className="inline-flex items-center rounded-full border border-[var(--teal)]/30 bg-[var(--mint)]/40 px-2.5 py-1 text-xs font-semibold text-[var(--teal-deep)]">
        Disponible en cuotas sin interés · 3× $9.990
      </span>
    </div>
  );
}

function AccordionItem({
  open,
  onToggle,
  title,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--line)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="font-display text-xl text-[var(--ink)] sm:text-2xl">{title}</span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-white/70 text-lg text-[var(--ink-muted)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            open ? "rotate-45" : "rotate-0"
          }`}
          aria-hidden
        >
          +
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`pb-5 text-sm leading-relaxed text-[var(--ink-muted)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:text-base ${
              open
                ? "translate-y-0 opacity-100 delay-75"
                : "-translate-y-1.5 opacity-0"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [useOpen, setUseOpen] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  return (
    <div className="atmosphere min-h-screen">
      <LandingHeader />

      <main className="shell relative z-[1] pb-8 pt-10 sm:pt-16">
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
            <Link href="/crear" className="btn-primary">
              Crear tu tienda
            </Link>
            <Link href="/u/camila.nutri" className="btn-ghost">
              Ver tienda demo
            </Link>
          </div>
          <p className="mt-6 text-sm text-[var(--ink-muted)]">
            Demo · Mercado Pago de prueba · sin comisión de plataforma
          </p>
        </section>

        {/* 2.1 Integraciones + vs */}
        <section className="mt-16 border-y border-[var(--line)] py-8 text-center">
          <p className="text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
            <span className="font-semibold text-[var(--ink)]">Funciona con</span> Flow
            (Webpay + transferencia) <span className="text-[var(--teal)]">+</span> Google
            Calendar <span className="text-[var(--teal)]">+</span> Google Meet · Hecho en
            Chile · cobras en pesos chilenos
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm font-medium text-[var(--ink-muted)]">
              ¿Vienes de otra herramienta?
            </span>
            {comparisons.map((c) => (
              <Link
                key={c.slug}
                href={`/vs/${c.slug}`}
                className="rounded-full border border-[var(--line)] bg-white/60 px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--teal)] hover:bg-white/90 sm:text-sm"
              >
                vs {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* 2.2 Problema */}
        <section className="mt-20">
          <SectionHeading
            title="Cobras bien, pero pierdes horas en cada venta"
            subtitle="Tienes la audiencia. Tienes el producto. Te falta una herramienta que no te obligue a hacer de secretario, cajero y mensajero."
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/55 p-6 backdrop-blur-sm sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Hoy · sin Pagate
              </p>
              <ul className="mt-5 space-y-3">
                {WITHOUT.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
                    <span className="mt-0.5 shrink-0 text-[var(--coral)]" aria-hidden>
                      ✕
                    </span>
                    <span className="line-through decoration-[var(--line)]">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-[var(--line)] pt-4 text-sm font-semibold text-[var(--ink)]">
                ≈ 15 min por venta · multiplícalo por cada cliente
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--teal)]/35 bg-[var(--mint)]/25 p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--teal-deep)]">
                Con Pagate
              </p>
              <ul className="mt-5 space-y-3">
                {WITH.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-[var(--ink)] sm:text-base">
                    <span className="mt-0.5 shrink-0 font-semibold text-[var(--teal)]" aria-hidden>
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-[var(--teal)]/25 pt-4 text-sm font-semibold text-[var(--teal-deep)]">
                0 min por venta · te dedicas a crear, no a coordinar
              </p>
            </div>
          </div>
        </section>

        {/* 2.3 Usos */}
        <section className="mt-20">
          <SectionHeading title="Lo que puedes vender con Pagate" />
          <div className="mt-8">
            {USE_CASES.map((item, i) => (
              <AccordionItem
                key={item.title}
                open={useOpen === i}
                onToggle={() => setUseOpen(useOpen === i ? -1 : i)}
                title={item.title}
              >
                <p>
                  <span className="font-semibold text-[var(--ink)]">Vende:</span> {item.sells}.
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-[var(--ink)]">Pagate te ayuda a:</span>{" "}
                  {item.helps}
                </p>
              </AccordionItem>
            ))}
          </div>
        </section>

        {/* 2.4 Cómo funciona */}
        <section className="mt-20">
          <SectionHeading title="Lanza tu tienda en minutos" />
          <ol className="mt-10 space-y-0">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="grid gap-3 border-t border-[var(--line)] py-6 sm:grid-cols-[auto_1fr] sm:gap-6 sm:items-start"
              >
                <span className="font-display text-3xl text-[var(--teal)] sm:w-12">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-2xl text-[var(--ink)]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 2.5 Beneficios */}
        <section className="mt-20" id="beneficios">
          <SectionHeading title="Todo lo que necesitas para vender online, en un solo lugar" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="border-t border-[var(--line)] pt-5 sm:border sm:rounded-[1.25rem] sm:border-[var(--line)] sm:bg-white/50 sm:p-6 sm:pt-6 sm:backdrop-blur-sm"
              >
                <h3 className="font-display text-xl text-[var(--ink)]">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2.6 Lo nuevo */}
        <section className="mt-20">
          <SectionHeading
            title="Funciones que ya puedes usar"
            subtitle="Seguimos sumando funciones para que vendas más sin pelear con la tecnología."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-[1.25rem] border border-[var(--line)] bg-white/55 p-6 backdrop-blur-sm"
              >
                <Badge>{f.badge}</Badge>
                <h3 className="font-display mt-3 text-xl text-[var(--ink)]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{f.body}</p>
                <FeaturePreview kind={f.preview} />
              </div>
            ))}
          </div>
        </section>

        {/* 2.7 Personalización */}
        <section className="mt-20">
          <SectionHeading
            title="Tu tienda, tu estilo"
            subtitle="Elige colores para que tu tienda hable de tu marca, no de la plataforma."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            {BRAND_COLOR_PRESETS.map((preset) => (
              <div key={preset.id} className="flex flex-col items-center gap-2">
                <div
                  className="h-14 w-14 rounded-full border-2 border-white shadow-[0_8px_24px_rgba(7,26,23,0.12)] ring-1 ring-[var(--line)]"
                  style={{ backgroundColor: preset.value }}
                  title={preset.label}
                  aria-label={preset.label}
                />
                <span className="text-xs text-[var(--ink-muted)]">{preset.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2.8 Precios */}
        <section className="mt-20" id="precios">
          <SectionHeading
            title="Prueba gratis, pásate a Pro cuando crezcas"
            subtitle="Empieza sin pagar nada: publica hasta 2 productos y haz tus primeras 5 ventas. Cuando superes ese límite, pasas a Pro y vendes sin tope."
          />
          <p className="mt-6 max-w-2xl rounded-[1rem] border border-[var(--teal)]/30 bg-[var(--mint)]/35 px-4 py-3 text-sm leading-relaxed text-[var(--teal-deep)] sm:text-base">
            Sin comisión por venta — Pagate no se queda con un porcentaje de tus ventas. Solo
            pagas las comisiones estándar de tu pasarela de pago.
          </p>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/55 p-6 backdrop-blur-sm sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Plan Gratis
              </p>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">Ideal para probar</p>
              <p className="font-display mt-3 text-4xl text-[var(--ink)]">$0</p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">al arrancar</p>
              <p className="mt-3 text-sm font-medium text-[var(--ink)]">
                Hasta 2 productos · primeras 5 ventas gratis
              </p>
              <ul className="mt-6 space-y-2.5">
                {FREE_PLAN.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-[var(--ink-muted)]">
                    <span className="text-[var(--teal)]" aria-hidden>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--teal)]/40 bg-white/70 p-6 shadow-[0_16px_40px_var(--glow)] backdrop-blur-sm sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--teal-deep)]">
                  Plan Pro
                </p>
                <Badge>Precio de lanzamiento</Badge>
              </div>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">Para vender sin tope</p>
              <p className="font-display mt-3 text-4xl text-[var(--ink)]">$8.990</p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">/mes</p>
              <p className="mt-3 text-sm font-medium text-[var(--ink)]">
                Se paga solo con 1 sesión o 2 ventas al mes
              </p>
              <p className="mt-4 text-sm text-[var(--ink-muted)]">
                Todo lo del plan Gratis, más:
              </p>
              <ul className="mt-3 space-y-2.5">
                {PRO_PLAN.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-[var(--ink)]">
                    <span className="text-[var(--teal)]" aria-hidden>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
            Cancelas cuando quieras · Sin contratos · Tu plata va directo a tu cuenta, Pagate no
            la toca
          </p>
        </section>

        {/* 2.9 FAQ */}
        <section className="mt-20" id="faq">
          <SectionHeading title="Preguntas frecuentes" />
          <div className="mt-8">
            {FAQ.map((item, i) => (
              <AccordionItem
                key={item.q}
                open={faqOpen === i}
                onToggle={() => setFaqOpen(faqOpen === i ? null : i)}
                title={item.q}
              >
                {item.a}
              </AccordionItem>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="mt-20 max-w-3xl pb-8">
          <h2 className="font-display text-3xl leading-tight text-[var(--ink)] sm:text-5xl">
            Deja de hacer de secretario en cada venta
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/crear" className="btn-primary">
              Crear tu tienda
            </Link>
            <Link href="/dashboard" className="btn-ghost">
              Ver panel demo
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
