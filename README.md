# Pagate — demo localhost

Demo funcional (sin pasarelas reales) del modelo **link-in-bio + cobro + entrega de archivos digitales** para creadores en Chile. Sirve para validar atractivo comercial con un socio en menos de 3 minutos.

Basado en el análisis `Analisis_Pulgy_Chile.docx`.

## Requisitos

- Node.js 20+ (LTS)

## Cómo correr

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). No hace falta `.env`.

## Guion para mostrar al socio

1. **Landing (`/`)** — Di: “Pagate es el link único para vender, agendar y entregar sin WhatsApp. Sin comisión de plataforma; solo la de la pasarela.”
2. **Panel (`/dashboard`)** — Muestra el creador demo (Camila), productos, disponibilidad mock y próximas citas. Crea un producto si quieres.
3. **Tienda (`/u/camila.nutri`)** — “Esto es lo que pone en la bio de Instagram.” Agenda la sesión 1:1 o compra un PDF.
4. **Checkout (`/checkout/...`)** — En sesiones: elige horario → paga (mock). En digitales: nombre/email → paga.
5. **Confirmación (`/d/[token]`)** — Sesión: horario + Meet mock. PDF: descarga con límite.

Botón **Reiniciar demo** en el panel vuelve al seed inicial.

## Google Calendar (opcional pero recomendado)

1. En [Google Cloud Console](https://console.cloud.google.com/) crea un proyecto (o usa uno existente).
2. Habilita **Google Calendar API**.
3. Pantalla de consentimiento OAuth → External → agrega tu email (`leoandrescl@gmail.com`) como usuario de prueba.
4. Credenciales → **ID de cliente OAuth** → tipo **Aplicación web**.
5. URI de redirección autorizada: `http://localhost:3000/api/google/callback`
6. Copia Client ID y Client Secret a `.env.local` (usa `.env.example` como plantilla).
7. Reinicia `npm run dev` → Panel → **Conectar Google Calendar** → autoriza con tu Gmail.

Al agendar una sesión, Pagate crea el evento en tu calendario primario, genera Meet e invita al comprador. Los bloques ocupados se excluyen del checkout vía FreeBusy.

## Qué está mockeado (a propósito)

- Pagos (Flow / Webpay)
- Email transaccional (Resend) — la invitación de Calendar sí es real si Google está conectado
- Auth real de creadores
- Base de datos (usa `data/store.json` local)
- Boleta SII
- Google Calendar (solo si no configuraste OAuth; si lo conectas, es real)

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Persistencia demo en archivo JSON
- PDFs de ejemplo en `public/demo/`

## Siguiente fase (si el pitch funciona)

Supabase (Auth + Postgres), Flow sandbox, storage privado + URLs firmadas, Resend, luego agenda y facturación electrónica.
