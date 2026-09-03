import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pagate — Vende y entrega desde un solo link",
  description:
    "Vitrina, cobro en CLP y entrega de archivos o sesiones 1:1 para creadores en Chile.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL" className={`${sans.variable} h-full`}>
      <body className={`${sans.className} min-h-full antialiased`}>{children}</body>
    </html>
  );
}
