export type ComparisonBullet = {
  label: string;
  competitor: string;
  pagate: string;
};

export type Comparison = {
  slug: string;
  name: string;
  hook: string;
  bullets: ComparisonBullet[];
};

export const comparisons: Comparison[] = [
  {
    slug: "whatsapp",
    name: "WhatsApp",
    hook: "WhatsApp sirve para hablar con tus clientes, no para cobrarles ni agendarlos.",
    bullets: [
      {
        label: "Cobro",
        competitor:
          "WhatsApp no cobra, tienes que pedir transferencia y esperar comprobante.",
        pagate: "Pagate cobra en el checkout y el dinero llega directo a tu cuenta.",
      },
      {
        label: "Agenda",
        competitor: "WhatsApp no agenda, coordinas la hora a mano.",
        pagate: "Pagate agenda solo en tu Google Calendar.",
      },
      {
        label: "Entrega",
        competitor: "WhatsApp no entrega archivos de forma segura.",
        pagate: "Pagate manda el link de descarga automático y protegido.",
      },
      {
        label: "Vitrina",
        competitor: "WhatsApp no muestra tu catálogo.",
        pagate: "Pagate te da una tienda pública con tu link en la bio.",
      },
    ],
  },
  {
    slug: "shopify",
    name: "Shopify",
    hook: "Shopify está pensado para vender productos físicos con stock, no infoproductos ni sesiones.",
    bullets: [
      {
        label: "Setup",
        competitor:
          "Shopify requiere configurar catálogo, envíos y checkout desde cero.",
        pagate: "Pagate está listo para vender en minutos.",
      },
      {
        label: "Enfoque",
        competitor: "Shopify gestiona stock físico.",
        pagate: "Pagate está hecho para productos digitales y sesiones 1:1.",
      },
      {
        label: "Costo",
        competitor:
          "Shopify cobra suscripción más apps adicionales para lo que Pagate ya trae integrado.",
        pagate: "Pagate incluye lo esencial sin apps extra.",
      },
      {
        label: "Curva de aprendizaje",
        competitor:
          "Shopify tiene más funciones de las que un creador solo necesita.",
        pagate: "Pagate es simple desde el día uno.",
      },
    ],
  },
  {
    slug: "stanstore",
    name: "Stan Store",
    hook: "Stan Store es una excelente herramienta, pero está pensada para cobrar en dólares, no en pesos chilenos.",
    bullets: [
      {
        label: "Moneda",
        competitor: "Stan Store cobra en USD.",
        pagate: "Pagate cobra en pesos chilenos, sin conversión.",
      },
      {
        label: "Medios de pago",
        competitor: "Stan Store depende de pasarelas internacionales.",
        pagate: "Pagate usa Mercado Pago y transferencia.",
      },
      {
        label: "Boleta",
        competitor: "Stan Store no resuelve la boleta electrónica chilena.",
        pagate: "Pagate te ayuda a emitirla.",
      },
      {
        label: "Soporte",
        competitor: "Stan Store no tiene soporte en español ni horario chileno.",
        pagate: "Pagate sí.",
      },
    ],
  },
  {
    slug: "hotmart",
    name: "Hotmart",
    hook: "Hotmart cobra comisión por cada venta. Pagate no.",
    bullets: [
      {
        label: "Comisión",
        competitor: "Hotmart se queda con un porcentaje de cada venta.",
        pagate: "Pagate no cobra comisión, solo la suscripción del plan.",
      },
      {
        label: "Enfoque",
        competitor: "Hotmart está pensado para cursos grandes y afiliados.",
        pagate: "Pagate es más simple para un creador que vende solo.",
      },
      {
        label: "Agenda",
        competitor: "Hotmart no agenda sesiones 1:1.",
        pagate: "Pagate sí, con Google Calendar integrado.",
      },
      {
        label: "Mercado",
        competitor: "Hotmart es genérico para Latinoamérica.",
        pagate: "Pagate está hecho pensando en Chile.",
      },
    ],
  },
  {
    slug: "gumroad",
    name: "Gumroad",
    hook: "Gumroad es simple, pero no está pensado para el mercado chileno ni para vender sesiones 1:1.",
    bullets: [
      {
        label: "Moneda y pagos",
        competitor: "Gumroad opera en USD.",
        pagate: "Pagate cobra en CLP con Mercado Pago y transferencia.",
      },
      {
        label: "Sesiones",
        competitor: "Gumroad solo vende archivos.",
        pagate: "Pagate también agenda sesiones 1:1 con Google Calendar.",
      },
      {
        label: "Boleta",
        competitor: "Gumroad no resuelve tu boleta electrónica chilena.",
        pagate: "Pagate sí.",
      },
      {
        label: "Idioma",
        competitor: "Gumroad no tiene soporte en español.",
        pagate: "Pagate sí.",
      },
    ],
  },
];

export function getComparison(slug: string): Comparison | undefined {
  return comparisons.find((c) => c.slug === slug);
}
