export type Vertical = {
  slug: string;
  name: string;
  headline: string;
  sells: string[];
  helps: string[];
};

export const verticals: Vertical[] = [
  {
    slug: "nutricionistas",
    name: "Nutricionistas",
    headline:
      "Vende tus planes alimenticios y sesiones de seguimiento desde un solo link.",
    sells: [
      "Planes alimenticios en PDF",
      "Packs de recetas",
      "Sesiones de seguimiento 1:1",
    ],
    helps: [
      "Entrega tus planes al instante por correo",
      "Agenda controles sin coordinar por WhatsApp",
      "Cobra directo a tu cuenta",
    ],
  },
  {
    slug: "psicologos",
    name: "Psicólogos",
    headline:
      "Organiza tu agenda de sesiones y vende tus recursos sin perder horas coordinando.",
    sells: [
      "Sesiones online",
      "Packs de sesiones",
      "Talleres breves",
      "Guías de hábitos",
    ],
    helps: [
      "Agenda ordenada con Google Calendar",
      "Evita ida y vuelta por WhatsApp",
      "Centraliza pagos y reservas",
    ],
  },
  {
    slug: "coaches",
    name: "Coaches",
    headline: "Profesionaliza tus mentorías con una tienda propia, sin código.",
    sells: ["Mentorías 1:1", "Packs de sesiones", "Guías de trabajo"],
    helps: [
      "Cobra tus sesiones por adelantado",
      "Automatiza la entrega de tus materiales",
      "Te ves más profesional frente a tus clientes",
    ],
  },
];

export function getVertical(slug: string): Vertical | undefined {
  return verticals.find((v) => v.slug === slug);
}
