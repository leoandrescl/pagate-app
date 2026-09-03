# Pagate

Link-in-bio + cobro + entrega de digitales / agendamiento para creadores en Chile.

**Producción:** [pagate.cl](https://pagate.cl) · **Studio:** [studio.pagate.cl](https://studio.pagate.cl)

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Auth con Google + Postgres + RLS)
- Mercado Pago Checkout Pro
- Google Calendar OAuth opcional (eventos + Meet + FreeBusy)

## Requisitos

- Node.js 20+ (LTS)
- Proyecto Supabase (ver más abajo) para login y tiendas reales

## Cómo correr

```bash
npm install
cp .env.example .env.local
# Completa las keys de Supabase y, si quieres, Google Calendar / Mercado Pago
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La landing se ve sin Supabase; crear tienda y el panel requieren Auth.

## Recorrido

1. **Landing (`/`)** — propuesta de valor
2. **Login (`/login` o studio.pagate.cl)** — Continuar con Google
3. **Onboarding (`/onboarding`)** — usuario, nombre, primer producto
4. **Panel (`/dashboard`)** — productos, disponibilidad, citas
5. **Tienda (`/u/tu-usuario`)** — storefront público
6. **Checkout (`/checkout/...`)** — Mercado Pago
7. **Confirmación (`/d/[token]`)** — entrega / Meet

## Supabase (obligatorio para cuentas reales)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. SQL Editor → pega y ejecuta [`supabase/schema.sql`](./supabase/schema.sql) (tablas y RLS)
3. Authentication → Providers → Google: Client ID y Secret del mismo proyecto de Google Cloud (scopes de login: email, profile, openid)
4. Authentication → URL configuration:
   - Site URL: `http://localhost:3000` (local) / `https://studio.pagate.cl` (prod)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://studio.pagate.cl/auth/callback`, `https://pagate.cl/auth/callback`
5. Copia URL, anon key y service role a `.env.local` y a Vercel (Production)
6. Google Cloud → OAuth client web → origins: `http://localhost:3000`, `https://pagate.cl`, `https://studio.pagate.cl`. Redirect de Supabase: `https://<ref>.supabase.co/auth/v1/callback`

## Dominio studio.pagate.cl

Mismo proyecto Vercel. En el dashboard de Vercel agrega el dominio `studio.pagate.cl` y en el DNS:

```
CNAME studio → cname.vercel-dns.com
```

Variables de producción:

- `NEXT_PUBLIC_APP_URL=https://pagate.cl`
- `NEXT_PUBLIC_STUDIO_URL=https://studio.pagate.cl`

## Google Calendar (opcional, en el panel)

Es un OAuth distinto al login. No se pide calendario al entrar con Gmail.

1. Google Cloud → habilitar Google Calendar API
2. Redirect URI: `http://localhost:3000/api/google/callback` y `https://studio.pagate.cl/api/google/callback`
3. Panel → **Conectar Google Calendar**

## Variables de entorno

Ver [`.env.example`](./.env.example).
