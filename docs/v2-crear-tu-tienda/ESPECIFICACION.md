# Crear tu tienda — especificación definitiva de onboarding (studio.pagate.cl)

**Estado:** versión definitiva. Documento autosuficiente: el agente que implemente debe basarse solo en este markdown.

**Repo:** [leoandrescl/pagate-app](https://github.com/leoandrescl/pagate-app)  
**Superficie:** `https://studio.pagate.cl`  
**Fuera de este ticket:** login con Google / Auth, y cualquier rediseño del dashboard del creador.

Este archivo es el brief de implementación para otro agente de Cursor. Hay que seguirlo al pie de la letra. Describe flujo, layout, copy, datos y criterios de aceptación con suficiente detalle para construir sin material visual externo.

---

## Prompt para el agente que implementa

Pegar esto al iniciar la sesión de implementación, junto con este markdown:

```
Implementa el onboarding "Crear tu tienda" de Pagate según docs/v2-crear-tu-tienda/ESPECIFICACION.md.

Reglas duras:
- No toques login de Google, Auth0, Supabase Auth provider, GoogleLoginButton, ni la pantalla /login.
- No rediseñes el dashboard del creador. Al terminar el wizard solo redirige a /dashboard (el panel actual se deja como está).
- Usa el design system existente de Pagate (globals.css): teal/coral/ink. No uses magenta/rosa como color de marca.
- Español de Chile (tuteo: Elige, Configura, Puedes). Nunca voseo (Elegí, Configurá, Podés).
- Lee AGENTS.md y la guía de Next.js en node_modules/next/dist/docs/ antes de escribir código.
- Reemplaza el onboarding de una sola página por el wizard de 5 pasos. No dejes el formulario actual de create-store-form como flujo principal.
- Al terminar: PR contra master, con el schema SQL actualizado y el wizard funcionando en studio.pagate.cl.
```

---

## 1. Qué hay que lograr

Un usuario **ya autenticado** (el login ya existe) que entra por primera vez a Pagate debe completar un wizard de configuración inicial y, al finalizar, caer en el panel del studio.

Hoy el producto falla ese recorte:

| Hoy | Debe quedar |
| --- | --- |
| `pagate.cl/crear` redirige a `/login` y luego a un **formulario único** en `/onboarding` | Wizard multi-paso en `studio.pagate.cl/onboarding/...` |
| Se piden handle + nombre + headline + bio + primer producto en una sola pantalla | Un trabajo por pantalla. **No** se crea el primer producto en este flujo |
| `onboarding_completed_at` se setea al crear la tienda | Se setea solo al pulsar **Finalizar** |
| Si ya hay fila en `stores`, el layout manda a `/dashboard` | Si la tienda existe pero el onboarding no terminó, se reanuda el paso pendiente |
| Links de descarga: 7 días y **5** descargas, hardcodeados | Valor elegido en el paso Descargas (default 7 días / **2** descargas) |

El CTA **Crear tu tienda** de la landing ya apunta a `studioHref("/login")`. No hay que mover ese CTA. El trabajo empieza **después** de que Auth deja al usuario en el studio.

---

## 2. Fuera de alcance (no negociable)

### 2.1 Auth / login de Google

**No implementar, no reescribir, no rediseñar:**

- `src/app/login/page.tsx`
- `src/components/google-login-button.tsx`
- Proveedor Google en Supabase Auth
- Intercambio de `code` en `src/app/auth/callback/route.ts` (salvo el destino post-login descrito en §6)
- Textos tipo “Inicia sesión en Google / Pagate”
- Cualquier flujo Auth0

El dueño del repo ya entregó el login. Este ticket asume sesión válida.

**Única excepción de routing:** si el usuario autenticado no terminó el onboarding, el callback y los layouts deben mandarlo al paso pendiente (ya hoy mandan a `/onboarding` si no hay tienda; hay que refinar esa regla, no el login).

### 2.2 Dashboard del creador

No rediseñar `src/app/dashboard/page.tsx`. No construir sidebar nueva, banner de “primer producto”, cards de ingresos/ventas vacías, ni bloque de “tu link” estilo otro producto.

Este ticket termina con `redirect("/dashboard")`. El panel actual se deja como está.

### 2.3 Otros no-hacer

- No crear el dominio `store.pagate.cl`.
- No cambiar la vitrina pública de `https://pagate.cl/u/{handle}`.
- No conectar Google Calendar dentro del wizard (el aviso “Requiere Google Calendar” es copy; el OAuth de calendario ya vive en el panel).
- No implementar checkout de Go Cuotas ni la UI de “el comprador paga por transferencia” en la tienda. Sí **persistir** esos datos en la tienda.
- No usar voseo ni magenta como marca.
- No inventar un icono de ayuda (`?`) sin destino real.

---

## 3. Hosts y URLs

Producción ya está partida:

- Marketing / vitrina: `https://pagate.cl` (`NEXT_PUBLIC_APP_URL`)
- Studio: `https://studio.pagate.cl` (`NEXT_PUBLIC_STUDIO_URL`)
- Proxy: `src/proxy.ts`

### 3.1 Rutas del wizard (studio)

| Paso | Ruta |
| --- | --- |
| 1 Handle | `/onboarding/handle` |
| 2 Productos | `/onboarding/product-type` |
| 3 Pagos | `/onboarding/pagos` |
| 4 Descargas | `/onboarding/download-expiry` |
| 5a Identidad | `/onboarding/profile` |
| 5b Redes | `/onboarding/profile/socials` |
| Fin | `/dashboard` |

`/onboarding` (sin subruta) redirige al primer paso incompleto.  
`/crear` se deja: ya redirige a `/login`.

### 3.2 `studio.pagate.cl/` (raíz)

Hoy el proxy manda `/` del host studio a `pagate.cl`. Hay que cambiar **solo esa raíz**:

| Quién pisa `studio.pagate.cl/` | Destino |
| --- | --- |
| Sin sesión | `/login` |
| Sesión, onboarding incompleto | paso pendiente |
| Sesión, onboarding completo | `/dashboard` |

El resto del proxy no se toca: `/u`, `/checkout`, `/d` siguen en marketing; `/login`, `/onboarding`, `/dashboard`, `/auth` siguen en studio.

### 3.3 Link público que se muestra en Handle

Prefix del input (no inventar otro dominio):

```text
pagate.cl/u/
```

Ejemplo con handle `malastore`: `https://pagate.cl/u/malastore`  
Helper ya existente: `storefrontHref(username)` en `src/lib/urls.ts`.

---

## 4. Design system (Pagate)

Leer `src/app/globals.css` y `src/app/layout.tsx` antes de pintar.

### 4.1 Tokens obligatorios

| Token | Valor | Uso en el wizard |
| --- | --- | --- |
| `--ink` | `#071a17` | Títulos |
| `--ink-muted` | `#3d5a54` | Subtítulos, ayudas |
| `--teal` | `#1f8a72` | Paso activo, focus, links |
| `--teal-deep` | `#0d5c4d` | Hover / botón primario |
| `--coral` | `#e4572e` | Subrayado “squiggle” del título |
| `--mint` | `#b8f2c8` | Selección suave |
| `--fog` | `#f3faf7` | Fondos de ayuda |
| `--line` | `rgba(7, 26, 23, 0.12)` | Bordes |
| Fuente | `Plus_Jakarta_Sans` (`--font-sans`) | Todo el wizard |
| `.btn-primary` | pill teal con glow | **Siguiente** / **Finalizar** |
| `.btn-ghost` | borde + vidrio | **Atrás**, **Conectar …** |
| `.field` | input existente | Todos los inputs |
| `.animate-rise*` | ya existen | Entrada de cada paso |

Fondo: mantener la atmósfera `body::before` / `.atmosphere` de Pagate. No aplanar a un blanco plano.

### 4.2 Layout del wizard (estructura)

- Una pregunta por viewport: título grande, una frase de apoyo, el control principal.
- Stepper horizontal de 5 pasos sobre el contenido.
- Footer sticky: Atrás a la izquierda, acción primaria a la derecha.
- Cards de tipo de producto seleccionables: lado a lado en desktop, apiladas en mobile.
- Cards de pago con borde **dashed** (`border-dashed` + `--line` / teal).
- Input de handle con prefix no editable + check de disponibilidad.
- Chips de duración en una fila que hace wrap.

### 4.3 Copy: español de Chile

Usar tuteo siempre.

| No usar | Usar |
| --- | --- |
| Elegí / Configurá / Creá / Podés / Contale / Recibí / Cobrá | Elige / Configura / Crea / Puedes / Cuéntale / Recibe / Cobra |
| vos | tú |
| CVU / CBU / Alias | CuentaRUT / número de cuenta / alias |
| Ajustes -> Tienda | Ajustes → Tienda |

Subrayado del título: una palabra clave con squiggle SVG en `--coral`:

| Paso | Palabra subrayada |
| --- | --- |
| Handle | handle |
| Productos | vender |
| Pagos | medios de pago |
| Descargas | links de descarga |
| Perfil | tienda |

Componente reutilizable sugerido: `ScribbleWord`. Animar el trazo al montar el paso (~600ms, una vez).

Motion mínimo (2–3): (1) rise del bloque central, (2) trazo del squiggle, (3) transición del stepper. Hover de cards: borde teal + mint suave, sin sombras multicapa.

Wordmark: **Pagate**, `font-display`, igual que landing y login.

Header del wizard: logo a la izquierda | email del usuario + `SignOutButton` a la derecha. Sin botón `X` que salte el onboarding. Sin icono de ayuda vacío.

---

## 5. Modelo de datos

`public.stores` ya tiene `onboarding_completed_at` y se setea demasiado pronto en `createStore` (`src/lib/store.ts`). Hay que dejar de setearlo al insertar.

### 5.1 Columnas nuevas en `public.stores`

Agregarlas en `supabase/schema.sql` **y** entregar el `ALTER TABLE` para correrlo en el SQL editor de producción (el proyecto no usa carpeta de migraciones).

```sql
alter table public.stores
  add column if not exists onboarding_step text not null default 'handle',
  add column if not exists sells_digital boolean,
  add column if not exists sells_sessions boolean,
  add column if not exists download_expiry_days integer, -- null = no expiran
  add column if not exists download_max_count integer not null default 2,
  add column if not exists avatar_url text,
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists mp_connection jsonb,
  add column if not exists gocuotas_connection jsonb,
  add column if not exists bank_transfer jsonb;

-- onboarding_step:
--   handle | product-type | pagos | download-expiry | profile | profile-socials | done
```

`onboarding_completed_at` es la fuente de verdad de “¿ya puede entrar al panel?”. `onboarding_step = 'done'` y `onboarding_completed_at = now()` se escriben juntos en **Finalizar**.

Valores:

```ts
social_links: {
  instagram?: string;  // handle sin @
  tiktok?: string;
  youtube?: string;
  twitter?: string;
  linkedin?: string;   // URL
  website?: string;    // URL
  whatsapp?: string;   // extra Pagate/Chile
}

mp_connection: {
  connected: boolean;
  collectorId?: string;
  publicKey?: string;
  accessToken?: string;      // solo servidor, nunca al cliente
  refreshToken?: string;
  liveMode?: boolean;
  connectedAt?: string;
}

gocuotas_connection: {
  connected: boolean;
  branchEmail?: string;
  // api_key: guardar cifrada o solo en servidor; jamás devolverla al cliente
  connectedAt?: string;
}

bank_transfer: {
  account: string; // CuentaRUT / n° cuenta / alias, tal como lo escribió el usuario
}
```

`download_expiry_days`: `1` (24 h), `7`, `30`, `90`, o `null` (no expiran). Default al crear la fila: `7`.  
`download_max_count`: default `2` (hoy el código usa `5`; hay que cambiarlo).

`headline` puede quedar `''` hasta que el creador lo edite en el panel. No pedir headline en el wizard. En la vitrina, si `headline` está vacío, no renderizar esa línea.

`bio` en onboarding: máx. 150 caracteres.

### 5.2 Storage de foto

Bucket `store-avatars` (Supabase Storage). Path: `{store_id}/avatar`. RLS: el dueño sube/reemplaza; lectura pública si la vitrina muestra la foto.

Si no hay foto: iniciales (`avatar_initials`). Si el perfil de Google trae `avatar_url` y el usuario no sube nada, se puede mostrar como preview; no se copia a Storage hasta que confirme.

### 5.3 Secretos

La API key de Go Cuotas **no** va a `localStorage` ni a logs. Guardar solo vía service role; el cliente solo ve `connected` y el email.

Idem para tokens de Mercado Pago.

### 5.4 Handle: reglas existentes (no inventar otras)

`src/lib/store.ts`:

- `normalizeUsername`: trim, lowercase, solo `[a-z0-9.]`
- `isValidUsername`: 3–24 caracteres, regex `^[a-z0-9]([a-z0-9.]{1,22}[a-z0-9])?$`
- Reservados: `camila.nutri`, `pagate`, `studio`, `www`, `admin`, `api`, `login`, `onboarding`, `dashboard`, `crear`, `checkout`

Mantener esas reglas. Añadir a reservados si hace falta: `handle`, `pagos`, `profile`.

---

## 6. Gatekeeping y reanudación

### 6.1 Layouts

Hoy:

- `src/app/onboarding/layout.tsx`: sin user → `/login`; **si hay store → `/dashboard`** (rompe el wizard a mitad de camino).
- `src/app/dashboard/layout.tsx`: sin store → `/onboarding`.

Queda:

```
onboarding layout
  sin sesión → /login
  store.onboarding_completed_at → /dashboard
  si no, renderizar el wizard

dashboard layout
  sin sesión → /login
  sin store OR !onboarding_completed_at → /onboarding  (el index redirige al paso)
```

### 6.2 Auth callback

En `src/app/auth/callback/route.ts` la línea que hoy hace `store ? "/dashboard" : "/onboarding"` debe usar `onboarding_completed_at`, no la mera existencia de la fila. **No tocar** el `exchangeCodeForSession`.

### 6.3 Orden y saltos

El usuario puede **volver** a un paso anterior. No puede abrir un paso futuro salvo que ya lo haya completado o lo haya omitido con el link explícito de ese paso.

Al guardar un paso, `onboarding_step` avanza al siguiente.

| Link | Efecto |
| --- | --- |
| Productos → “Configurar después” | `sells_digital` y `sells_sessions` quedan `null`; avanza a Pagos |
| Pagos → “Omitir este paso” | no conecta nada; avanza a Descargas |
| Redes → “Saltar por ahora” | `social_links = {}`; **completa** el onboarding |

Descargas no se omite: si el usuario no elige, se persiste el default (7 días / 2 descargas) al pulsar Siguiente.

Mostrar siempre los 5 pasos del stepper (aunque el usuario haya elegido solo reuniones online).

---

## 7. Chrome compartido del wizard

Archivo sugerido: `src/components/onboarding/onboarding-shell.tsx`.

```
[ Pagate ]                         email@…   [Cerrar sesión]

        (1) Handle — (2) Productos — (3) Pagos — (4) Descargas — (5) Perfil

        {children}   // max-width ~640–720px, centrado

[ < Atrás ]                                              [ Siguiente > ]
```

Detalle:

- Logo a la izquierda (`font-display`), email + `SignOutButton` a la derecha.
- Stepper de cinco ítems con labels: Handle, Productos, Pagos, Descargas, Perfil.
  - Completado: círculo teal con check blanco.
  - Actual: círculo teal con número.
  - Futuro: círculo gris con número.
  - Línea conectora teal hasta el paso actual.
- En `< sm`: “Paso 3 de 5 · Pagos” + barra lineal (sin aplastar cinco labels).
- Footer sticky bottom, fondo fog/80 + blur, botones `.btn-ghost` / `.btn-primary`.
- Paso 1: no hay Atrás.
- Paso 5b: primario dice **Finalizar** (sin chevron).
- Pending: deshabilitar primario, texto “Guardando…”.
- `aria-current="step"` en el paso activo.

Reusar `SignOutButton`. No crear otro logout.

---

## 8. Paso 1 — Handle

Ruta: `/onboarding/handle`

### Copy

- Título: Elige tu **handle**
- Apoyo: `Este será el link de tu tienda: pagate.cl/u/tuhandle`
- Segunda línea: `Puedes cambiarlo más adelante en la sección de configuración.`

### UI

Bloque centrado verticalmente en el viewport (debajo del stepper). Un solo control principal: input compuesto a ancho completo del contenedor (~640px).

```
[ pagate.cl/u/ ][  malastore           ✓ ]
                              Disponible
```

- Prefix no editable (`pagate.cl/u/`), fondo `--fog`, borde compartido con el input.
- Campo editable a la derecha; al escribir se normaliza a minúsculas y se filtran caracteres inválidos en vivo o al blur.
- Debounce 400ms antes de consultar disponibilidad.
- Endpoint: `GET /api/onboarding/handle?u=` (sesión requerida) → `{ available: boolean, reason?: string }`.
- Si válido y libre: check teal dentro del input + texto “Disponible” en `--teal-deep` bajo el campo (alineado a la derecha o bajo el input).
- Si inválido o tomado: sin check; mensaje “No disponible”, “Usa 3–24 caracteres: letras, números y puntos”, o “Ese nombre está reservado” en `--coral`.
- **Siguiente** deshabilitado hasta `available === true`.

### Persistencia

Al Siguiente: create/update progresivo (hoy `createStore` exige headline/bio/displayName y marca onboarding completo: hay que partir esa función).

- Inserta `stores` con `username`, `owner_id`, `display_name` temporal (nombre de Google vía `displayNameFromUser`, o el handle), `bio: ''`, `headline: ''`, `onboarding_step: 'product-type'`, `onboarding_completed_at: null`.
- Unique en `lower(username)` ya existe. Si pisa 23505 → “Ese usuario ya está en uso.”
- Si la tienda ya existe (reanudación) y el handle cambió, update con la misma validación.

No crear producto.

---

## 9. Paso 2 — Productos

Ruta: `/onboarding/product-type`

### Copy

- Título: ¿Qué vas a **vender**?
- Apoyo: `Puedes vender uno o varios tipos. Esto nos ayuda a configurar tu tienda.`

### UI

Dos cards seleccionables (multi-select), en grid 2 columnas desde `sm`, stack en mobile. Cada card: borde sutil, radio ~1–1.25rem, padding generoso, icono arriba, título, descripción corta.

**Card A — Productos digitales**

- Icono SVG: documento con flecha de descarga (stroke teal).
- Título: `Productos digitales`
- Descripción: `Presets, ebooks, archivos descargables, recetarios, PDFs, etc.`

**Card B — Reuniones online**

- Icono SVG: cámara de video (stroke teal).
- Título: `Reuniones online`
- Descripción: `Llamadas 1:1, consultorías, sesiones de coaching, etc.`
- Nota bajo la descripción, muted italic: `Requiere Google Calendar`

Estado seleccionado: borde `--teal`, fondo mint/40. Puede haber 0, 1 o 2 seleccionados.

Bajo las cards, link centrado teal subrayado: **Configurar después**

Footer: **Atrás** | **Siguiente**  
Siguiente permitido con 0, 1 o 2 (0 ≡ omitir). Al guardar: `sells_digital`, `sells_sessions`; `onboarding_step: 'pagos'`.

**No** pedir nombre, precio ni archivo. El primer producto se crea después en el panel (fuera de este ticket).

---

## 10. Paso 3 — Pagos

Ruta: `/onboarding/pagos`  
Una sola página con tres cards en vertical y scroll nativo.

### Copy

- Título: Configura tus **medios de pago**
- Apoyo: `Configura al menos un método para cobrar por tus productos. Los productos gratuitos funcionan sin esta configuración.`

Siguiente **no** exige un método conectado. El apoyo es orientación, no validador.

Bajo las cards, link centrado subrayado: **Omitir este paso**

### 10.1 Card Mercado Pago

Contenedor blanco/translúcido, borde dashed, radio amplio.

- Header: icono wallet (coral o teal) + título `Mercado Pago`.
- Botón `.btn-ghost` a ancho útil: **Conectar Mercado Pago**.
- Debajo, dos líneas con icono pequeño:
  - `Solo permiso para crear links de pago`
  - `No tenemos acceso a tu dinero ni a tu cuenta`
- Conectado: reemplazar el botón por estado “Mercado Pago conectado” + acción “Desconectar”.

OAuth de **vendedor** (no el login de Google). Patrón análogo a `src/app/api/google/connect/route.ts`:

- `GET /api/mercadopago/connect` → redirect OAuth MP
- `GET /api/mercadopago/callback` → guarda tokens en `mp_connection`, vuelve a `/onboarding/pagos?mp=connected`

Env vars nuevas (documentar en `.env.example`, **sin** mezclarlas con Google login):

```
MP_CLIENT_ID=
MP_CLIENT_SECRET=
MP_REDIRECT_URI=https://studio.pagate.cl/api/mercadopago/callback
```

Si faltan env: el botón no finge éxito. Texto: `La conexión de Mercado Pago no está habilitada todavía.` Siguiente sigue habilitado.

Checkout actual (`src/lib/mercadopago.ts`) usa `MP_ACCESS_TOKEN` de la plataforma. **Mínimo funcional:** si la tienda tiene `mp_connection.accessToken`, `createCheckoutPreference` cobra con ese token. Si no, se mantiene el token de plataforma. No rediseñar checkout.

### 10.2 Card Go Cuotas

Misma estética dashed. Persistencia sí; checkout en cuotas no.

- Header: icono wallet + `Go Cuotas` + badges `2x` `3x` `4x` en coral a la derecha.
- Copy: `Cobra en 2, 3 o 4 cuotas con tarjeta de débito. Liquidación en ~22 días hábiles. Comisión 9,6% + IVA.`
- Campo **Email de la sucursal** — placeholder `sucursal@tucomercio.com`
- Campo **API Key** — placeholder `API key de tu sucursal`
- Botón `.btn-ghost` ancho: **Conectar Go Cuotas**
- Éxito solo con validación real contra su API. Si falla o no hay integración: error visible, `connected` sigue false.
- Tras conectar, no volver a mostrar la API key; placeholder `••••••••`.

### 10.3 Card Transferencia bancaria (Chile)

- Header: icono de billete/transferencia + `Transferencia bancaria`
- Copy: `Recibe pagos sin comisiones. Cuando un comprador transfiere, tú verificas el pago y liberas el contenido desde Ventas en Pagate.`
- Label: `CuentaRUT / número de cuenta / alias`
- Placeholder: `12.345.678-9`
- Ayuda bajo el campo: `Este dato se muestra al comprador para que te transfiera. Sin comisiones: recibes el 100% del pago.`

Validación liviana: 5–40 caracteres tras recortar. Si parece RUT chileno (`12.345.678-9` o `12345678-9`), validar dígito verificador y avisar si está mal; no bloquear alias/números que no sean RUT.

No pedir banco aparte. No implementar la pantalla de liberación en Ventas. Sí guardar `bank_transfer.account` al Siguiente si el campo tiene valor (o al blur/guardar del paso).

Al Siguiente u Omitir: `onboarding_step: 'download-expiry'`.

---

## 11. Paso 4 — Descargas

Ruta: `/onboarding/download-expiry`

### Copy

- Título: ¿Cuánto duran tus **links de descarga**?
- Apoyo: `Es el tiempo que tienen tus compradores para descargar los archivos después de comprar.`

### UI

Fila de chips (botones tipo pill/rectángulo redondeado), wrap en mobile:

| Chip | Valor guardado |
| --- | --- |
| `24 horas` | `download_expiry_days = 1` |
| `7 días` | `7` (default seleccionado: borde teal) |
| `30 días` | `30` |
| `90 días` | `90` |
| `No expiran` | `null` |

Solo uno seleccionado a la vez.

Debajo, caja dashed con fondo fog:

- Título: `Por defecto son 7 días`
- Cuerpo: `Si no cambias esta configuración, los links expiran a los 7 días con un máximo de 2 descargas por archivo. Lo puedes ajustar después en Ajustes → Tienda.`

Footer: **Atrás** | **Siguiente** → guarda elección + `download_max_count = 2` + `onboarding_step: 'profile'`.

### Cableado real (obligatorio)

Hoy está hardcodeado en `src/lib/store.ts` (`createPurchase` / `upsertPurchaseFromMetadata` / `updatePurchasePayment`):

- `expiresAt = now + 7 días`
- `downloadsRemaining = 5`

Debe leer la tienda del producto:

- `expiresAt`: si `download_expiry_days` es `null`, fecha lejana (p. ej. `now + 100 años`); `consumeDownload` ya compara `expiresAt < now`.
- `downloadsRemaining` en paid + digital: `store.download_max_count` (2), no 5.

Sin este cableado el paso es cosmética. El texto “Ajustes → Tienda” es promesa futura; **no** construir esa pantalla ahora.

---

## 12. Paso 5 — Perfil

### 12.1 Identidad — `/onboarding/profile`

### Copy

- Título: Dale identidad a tu **tienda**
- Apoyo: `Cuéntale a tu audiencia quién eres y tus redes sociales. Puedes cambiarlo más adelante en la sección de configuración.`

### UI (columna centrada)

1. **Foto de perfil**  
   Círculo grande (~112–128px) con borde dashed. Interior: `?` muted o preview. Label debajo: `Foto de perfil`. Click abre `input type=file` (`image/jpeg,image/png,image/webp`, máx. 3 MB). Preview inmediato; reemplazable.

2. **Nombre completo**  
   Input `.field`. Placeholder `Ej: Juana Pérez`. Default: `displayNameFromUser(user)`. Requerido, mín. 2 caracteres. Persiste en `display_name` + recalcula `avatar_initials`.

3. **Bio**  
   Textarea `.field`. Placeholder `Ej: Fotógrafa de bodas. Vendo presets de Lightroom y sesiones personalizadas.` Contador `n/150` esquina inferior derecha del campo. Opcional. Hard-stop en 150.

Footer: **Atrás** | **Siguiente** (no Finalizar). Avanza a `/onboarding/profile/socials` guardando identidad (`onboarding_step: 'profile-socials'`).

### 12.2 Redes — `/onboarding/profile/socials`

### Copy / sección

Título de bloque: **Redes sociales (opcional)**  
(El stepper sigue en Perfil = paso 5.)

### UI

Grid 2×2 en desktop, 1 columna en mobile:

| Campo | Prefix dentro del input | Placeholder |
| --- | --- | --- |
| Instagram | `@` | usuario |
| TikTok | `@` | usuario |
| YouTube | `@` | canal |
| Twitter / X | `@` | usuario |

Campos full width debajo:

- LinkedIn URL — placeholder `https://linkedin.com/in/...`
- Sitio web — placeholder `https://tusitio.com`
- **WhatsApp** (Pagate/Chile; la vitrina ya tiene este icono) — placeholder `wa.me/569...` o número. Guardar como URL `https://wa.me/56...`

Normalizar handles: strip `@` y espacios. URLs: si vienen sin esquema, prefix `https://`.

Link centrado subrayado teal: **Saltar por ahora** → finaliza con redes vacías (no borra identidad).

Footer: **Atrás** | **Finalizar**

**Finalizar** (o Saltar por ahora):

1. Guarda foto / nombre / bio / redes (vacías si saltó).
2. `onboarding_step = 'done'`, `onboarding_completed_at = now()`.
3. `revalidatePath` de dashboard y `/u/{username}`.
4. `redirect("/dashboard")`.

### 12.3 Vitrina (mínimo para que el paso exista)

Hoy bio/redes de la vitrina salen de `localStorage` (`store-settings-context.tsx`, comentario `// MOCK`). Para que identidad/redes no se evaporen:

- `display_name`, `bio`, `avatar_url`, `social_links` se leen de `stores` en `getStoreByUsername`.
- `StoreHeader` usa esos campos de servidor. No hace falta borrar el mock de banner/color de marca.

No rediseñar la vitrina.

---

## 13. Destino final

Al completar: `https://studio.pagate.cl/dashboard`.

En local: `/dashboard`.

Si el dashboard actual pinta, el ticket está bien. No hay un rediseño del panel en este alcance.

---

## 14. Archivos a tocar (guía)

El agente implementador debe leer la guía de Next.js del repo (`node_modules/next/dist/docs/`, App Router) antes de crear páginas.

**Reemplazar / partir**

- `src/app/onboarding/page.tsx` → redirector al paso pendiente
- `src/app/onboarding/layout.tsx` → gate de §6
- `src/components/create-store-form.tsx` → dejar de usarse; se puede borrar si nada lo importa
- `src/lib/actions.ts` → `createStoreAction` actual (formulario único) se sustituye por actions por paso
- `src/lib/store.ts` → create/update progresivo; expiry/downloads desde la tienda

**Crear**

- `src/app/onboarding/handle/page.tsx`
- `src/app/onboarding/product-type/page.tsx`
- `src/app/onboarding/pagos/page.tsx`
- `src/app/onboarding/download-expiry/page.tsx`
- `src/app/onboarding/profile/page.tsx`
- `src/app/onboarding/profile/socials/page.tsx`
- `src/components/onboarding/*` (shell, stepper, squiggle, cards)
- `src/app/api/onboarding/handle/route.ts`
- `src/app/api/mercadopago/connect/route.ts` + `callback/route.ts` (si OAuth)

**Ajustar**

- `src/app/dashboard/layout.tsx`
- `src/app/auth/callback/route.ts` (solo destino)
- `src/proxy.ts` (raíz de studio)
- `src/lib/types.ts` (campos nuevos de Creator/store)
- `src/lib/mercadopago.ts` (token del vendedor si existe)
- `src/components/store-header.tsx` + `src/lib/store.ts` (avatar/bio/redes de DB)
- `supabase/schema.sql` + bloque ALTER para prod
- `.env.example` (MP OAuth; no reescribir el bloque de Google login)

**No tocar**

- `src/app/login/page.tsx`
- `src/components/google-login-button.tsx`
- `src/app/api/google/*` (calendario)
- UI de `src/app/dashboard/page.tsx` (salvo que un import se rompa)

---

## 15. Criterios de aceptación

1. Usuario **ya logueado**, sin tienda, en `studio.pagate.cl` cae en `/onboarding/handle` (no en el form único actual, no en login).
2. Wizard de 5 pasos, copy en tuteo, colores Pagate (teal/coral).
3. Handle: prefix `pagate.cl/u/`, debounce, Disponible / No disponible; no se puede seguir si está tomado o es inválido.
4. Recargar a mitad de camino reanuda el paso; no hay atajo al dashboard.
5. Productos: multi-select + “Configurar después”; **no** crea un producto.
6. Pagos: tres cards; transferencia habla de CuentaRUT; “Omitir este paso” funciona; no se exige un método.
7. Descargas: default 7 días; una compra digital nueva usa 7 días (o lo elegido) y **2** descargas, no 5.
8. Perfil: foto opcional, nombre requerido, bio 150, redes opcionales, WhatsApp incluido, “Saltar por ahora” cierra el flujo.
9. Finalizar setea `onboarding_completed_at` y manda a `/dashboard` **sin** rediseñar el panel.
10. Un segundo login de un usuario que ya finalizó va a `/dashboard`, no al wizard.
11. Nada de esto modifica el botón ni el provider de Google login.
12. Mobile: una columna, footer usable, stepper compacto, cards de producto apiladas.
13. `schema.sql` y el ALTER de producción quedan en el PR.

---

## 16. Cómo probar (manual)

Login ya existe; no mockear Auth.

1. Cuenta nueva (o borrar su fila en `stores`).
2. Recorrer los 5 pasos con handle libre, los dos tipos de producto, omitir pagos, dejar 7 días, nombre + bio, saltar redes → dashboard actual.
3. Otra cuenta: parar en Pagos, cerrar el browser, volver a `studio.pagate.cl` → debe abrir Pagos, no Handle ni dashboard.
4. Handle `camila.nutri` y `pagate` → no disponible.
5. Comprar un digital de prueba (checkout existente) y verificar `expires_at` + `downloads_remaining` en `purchases`.
6. Viewport 375px y 1280px.

No hace falta e2e automatizado si el repo no tiene runner; si se agrega algo, un test de `isValidUsername` + cálculo de expiry basta.

---

## 17. Decisiones cerradas

1. Studio en subdominio; no usar `pagate.cl/crear` como UI de onboarding.
2. Cinco pasos fijos: Handle, Productos, Pagos, Descargas, Perfil.
3. Transferencia = CuentaRUT Chile (no CVU/CBU).
4. WhatsApp se suma a las redes porque la vitrina Pagate ya lo usa.
5. Identidad y redes son dos pantallas del paso 5.
6. Este documento es la única fuente de verdad visual/funcional del wizard: no depende de material externo.
7. El PR de implementación es otro; este archivo solo especifica.

Si algo de este documento está mal, se corrige **aquí** antes de escribir código.
