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

Abrí [http://localhost:3000](http://localhost:3000). No hace falta `.env`.

## Guion para mostrar al socio

1. **Landing (`/`)** — Contá: “Pagate es el link único para vender y entregar sin WhatsApp. Sin comisión de plataforma; solo la de la pasarela.”
2. **Panel (`/dashboard`)** — Mostrá el creador demo (Camila, nutricionista), los 2 productos seed y el link público. Creá un producto nuevo si querés.
3. **Tienda (`/u/camila.nutri`)** — “Esto es lo que pone en la bio de Instagram.”
4. **Checkout (`/checkout/...`)** — Completá nombre/email y pagá. Es un mock (simula Webpay/Flow ~1s).
5. **Descarga (`/d/[token]`)** — Mostrá el email simulado, el límite de 5 descargas y bajá el PDF.

Botón **Resetear demo** en el panel vuelve al seed inicial.

## Qué está mockeado (a propósito)

- Pagos (Flow / Webpay)
- Email transaccional (Resend)
- Auth real de creadores
- Base de datos (usa `data/store.json` local)
- Agenda / Google Calendar
- Boleta SII

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Persistencia demo en archivo JSON
- PDFs de ejemplo en `public/demo/`

## Siguiente fase (si el pitch funciona)

Supabase (Auth + Postgres), Flow sandbox, storage privado + URLs firmadas, Resend, luego agenda y facturación electrónica.
