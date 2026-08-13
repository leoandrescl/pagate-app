# Pagate

Demo de producto **link-in-bio + cobro + entrega de digitales / agendamiento** para creadores (Chile). Pensada para pitch y validación de flujo completo sin pasarelas reales.

**Demo:** [pagate-app.vercel.app](https://pagate-app.vercel.app)

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Persistencia demo en JSON (`data/store.json`)
- Google Calendar OAuth opcional (eventos + Meet + FreeBusy)

## Requisitos

- Node.js 20+ (LTS)

## Cómo correr

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La demo funciona sin `.env`.

## Recorrido sugerido

1. **Landing (`/`)** — propuesta de valor
2. **Panel (`/dashboard`)** — productos, disponibilidad mock, citas; botón *Reiniciar demo*
3. **Tienda (`/u/camila.nutri`)** — storefront público tipo link-in-bio
4. **Checkout (`/checkout/...`)** — sesión con horario o digital con datos de contacto (pago mock)
5. **Confirmación (`/d/[token]`)** — entrega / Meet mock

## Google Calendar (opcional)

1. Google Cloud Console → proyecto → habilitar **Google Calendar API**
2. OAuth consent screen (External) → agrega tu email como usuario de prueba
3. Credenciales → OAuth client **Web application**
4. Redirect URI: `http://localhost:3000/api/google/callback`
5. Copia Client ID / Secret a `.env.local` (plantilla: `.env.example`)
6. `npm run dev` → Panel → **Conectar Google Calendar**

Con OAuth activo, al agendar se crea el evento, Meet e invitación; FreeBusy excluye horarios ocupados.

## Qué está mockeado (a propósito)

- Pagos (Flow / Webpay)
- Email transaccional (Resend), salvo invitación Calendar si Google está conectado
- Auth real de creadores
- Base de datos (JSON local)
- Boleta SII

## Variables de entorno

Ver [`.env.example`](./.env.example).

## Próximos pasos (producto real)

Supabase (Auth + Postgres), pasarela en sandbox, storage privado + URLs firmadas, Resend, agenda y facturación.
