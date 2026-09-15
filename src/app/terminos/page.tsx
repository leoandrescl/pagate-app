import type { Metadata } from "next";
import Link from "next/link";
import { LandingFooter, LandingHeader } from "@/components/landing-chrome";
import { studioHref } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Términos del servicio — Pagate",
  description:
    "Condiciones de uso de Pagate para vendedores y compradores en Chile.",
};

const SECTIONS = [
  {
    title: "1. Qué es Pagate",
    body: "Pagate es una plataforma que permite a creadores vender productos digitales, sesiones 1:1 y accesos a comunidades mediante un link personal (pagate.cl/tu-usuario). Pagate provee la vitrina, el cobro y la entrega; el vendedor es quien ofrece y responde por sus productos.",
  },
  {
    title: "2. Cuentas de vendedor",
    body: "Para vender debes crear una cuenta con tu email de Google y completar tu perfil de tienda. Eres responsable de mantener tus datos actualizados y de la veracidad de lo que publicas.",
  },
  {
    title: "3. Pagos",
    body: "Los cobros con tarjeta u otros medios se procesan vía Mercado Pago. El dinero de cada venta llega directo a la cuenta del vendedor: Pagate no intermedia ni retiene pagos. Las comisiones de la pasarela las asume el vendedor según las tarifas vigentes de Mercado Pago.",
  },
  {
    title: "4. Planes y suscripción",
    body: "El plan Gratis permite hasta 3 productos y 5 ventas. El plan Pro es una suscripción mensual que habilita productos y ventas sin tope, cupones, colores personalizados y marca de agua en PDFs, entre otros beneficios publicados en pagate.cl/#precios. La suscripción se renueva con cada pago mensual y puedes dejar de pagar cuando quieras, conservando el acceso hasta el fin del período pagado.",
  },
  {
    title: "5. Reembolsos",
    body: "Como Pagate no retiene el dinero, cada reembolso lo gestiona directamente el vendedor con su pasarela de pago, según la política que informe en su tienda.",
  },
  {
    title: "6. Contenido prohibido",
    body: "Está prohibido vender contenido ilegal, que infrinja derechos de terceros, o que corresponda a esquemas fraudulentos. Pagate puede suspender tiendas que incumplan estas condiciones.",
  },
  {
    title: "7. Disponibilidad",
    body: "Pagate opera en etapa de lanzamiento y puede presentar intermitencias. Haremos nuestros mejores esfuerzos por mantener el servicio disponible y avisar cambios relevantes.",
  },
  {
    title: "8. Contacto",
    body: "Para dudas sobre estos términos escríbenos a hola@pagate.cl.",
  },
];

export default function TerminosPage() {
  return (
    <div className="atmosphere min-h-screen">
      <LandingHeader />

      <main className="shell relative z-[1] max-w-3xl pb-16 pt-10 sm:pt-14">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
          Legal
        </p>
        <h1 className="font-display mt-4 text-4xl leading-tight text-[var(--ink)] sm:text-5xl">
          Términos del servicio
        </h1>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          Última actualización: septiembre de 2026 · Contenido genérico de
          lanzamiento, sujeto a revisión por un abogado.
        </p>

        <div className="mt-10 space-y-6">
          {SECTIONS.map((s) => (
            <section
              key={s.title}
              className="rounded-[1.25rem] border border-[var(--line)] bg-white/55 p-6 backdrop-blur-sm sm:p-8"
            >
              <h2 className="font-display text-2xl text-[var(--ink)]">{s.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
                {s.body}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href={studioHref("/login")} className="btn-primary">
            Crear tu tienda
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
