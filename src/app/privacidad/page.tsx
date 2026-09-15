import type { Metadata } from "next";
import Link from "next/link";
import { LandingFooter, LandingHeader } from "@/components/landing-chrome";
import { studioHref } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Política de privacidad — Pagate",
  description: "Cómo Pagate trata los datos de vendedores y compradores.",
};

const SECTIONS = [
  {
    title: "1. Qué datos recogemos",
    body: "De vendedores: nombre, email de Google, datos de perfil de tienda y configuración de pagos. De compradores: nombre y email de contacto para entregar la compra y enviar el comprobante. Los datos de pago con tarjeta los procesa Mercado Pago y no pasan por nuestros servidores.",
  },
  {
    title: "2. Para qué los usamos",
    body: "Operar tu tienda, procesar ventas, entregar archivos o agendar sesiones, enviar correos de compra y mejorar el servicio. No vendemos tus datos ni los compartimos con terceros con fines publicitarios.",
  },
  {
    title: "3. Integraciones de terceros",
    body: "Usamos Google (login y Calendar), Mercado Pago (cobros) y Supabase (base de datos y autenticación). Cada servicio aplica su propia política de privacidad sobre los datos que procesa.",
  },
  {
    title: "4. Cookies y almacenamiento local",
    body: "Usamos lo mínimo necesario para que el sitio funcione: sesión de usuario y datos del carrito guardados en tu navegador. No usamos cookies de publicidad.",
  },
  {
    title: "5. Conservación y eliminación",
    body: "Conservamos tus datos mientras tu cuenta esté activa. Puedes pedir la eliminación de tu cuenta y sus datos asociados escribiendo a hola@pagate.cl; conservaremos solo lo exigido por obligaciones legales o tributarias.",
  },
  {
    title: "6. Tus derechos",
    body: "Conforme a la Ley N° 19.628 sobre protección de la vida privada, puedes solicitar acceso, rectificación, cancelación u oposición sobre tus datos escribiendo a hola@pagate.cl.",
  },
  {
    title: "7. Cambios a esta política",
    body: "Publicaremos aquí cualquier cambio relevante e indicaremos la fecha de actualización.",
  },
];

export default function PrivacidadPage() {
  return (
    <div className="atmosphere min-h-screen">
      <LandingHeader />

      <main className="shell relative z-[1] max-w-3xl pb-16 pt-10 sm:pt-14">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
          Legal
        </p>
        <h1 className="font-display mt-4 text-4xl leading-tight text-[var(--ink)] sm:text-5xl">
          Política de privacidad
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
