import Link from "next/link";
import { AddProductForm, AvailabilityForm } from "@/components/forms";
import { CouponsPanel } from "@/components/coupons-panel";
import { GoogleCalendarCard } from "@/components/google-calendar-card";
import { MercadoPagoCard } from "@/components/mercadopago-card";
import { StoreSettingsPanel } from "@/components/store-settings-panel";
import { DashboardStoreProvider } from "@/components/store-providers";
import { WeekCalendar } from "@/components/week-calendar";
import { SignOutButton } from "@/components/sign-out-button";
import { requireUser } from "@/lib/auth";
import {
  formatClp,
  getMyStore,
  listUpcomingSessions,
} from "@/lib/store";
import {
  getGoogleAccountEmail,
  isGoogleConfigured,
  isGoogleConnected,
  listUpcomingGoogleEvents,
} from "@/lib/google-calendar";
import { formatSlotRange } from "@/lib/slots";
import { storefrontHref, getAppBaseUrl } from "@/lib/urls";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ google?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const { google } = await searchParams;
  const user = await requireUser();
  const mine = await getMyStore(user.id);
  if (!mine) redirect("/onboarding");

  const [sessions, googleOn, googleReady, googleEvents, googleEmail] =
    await Promise.all([
      listUpcomingSessions(mine.creator.id),
      isGoogleConnected(user.id),
      Promise.resolve(isGoogleConfigured()),
      listUpcomingGoogleEvents(user.id, 7),
      getGoogleAccountEmail(user.id),
    ]);
  const creator = mine.creator;
  const products = mine.products;
  const store = mine;
  const storeUrl = storefrontHref(creator.username);
  const { availability } = creator;
  const publicHost = (
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ).replace(/^https?:\/\//, "");


  return (
    <DashboardStoreProvider headline={creator.headline} bio={creator.bio}>
    <div className="atmosphere min-h-screen">
      <header className="shell flex flex-wrap items-center justify-between gap-4 py-6">
        <div>
          <Link href={getAppBaseUrl()} className="font-display text-2xl font-semibold text-[var(--ink)]">
            Pagate
          </Link>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">Panel del creador</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={storeUrl} className="btn-ghost text-sm">
            Ver mi tienda
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="shell relative z-[1] space-y-8 pb-20">
        <WeekCalendar events={googleEvents} connected={googleOn} />

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <section className="animate-rise rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-6 backdrop-blur-sm sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--teal-deep)] font-display text-lg text-white">
                  {creator.avatarInitials}
                </div>
                <div>
                  <h1 className="font-display text-3xl text-[var(--ink)]">
                    {creator.displayName}
                  </h1>
                  <p className="mt-1 text-[var(--ink-muted)]">{creator.headline}</p>
                  <p className="mt-3 text-sm">
                    Tu link público:{" "}
                    <Link
                      href={storeUrl}
                      className="font-semibold text-[var(--teal-deep)] underline-offset-2 hover:underline"
                    >
                      {publicHost}
                      {storeUrl.startsWith("http") ? storeUrl.replace(/^https?:\/\/[^/]+/, "") : storeUrl}
                    </Link>
                  </p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-[var(--fog)] p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
                    Productos
                  </p>
                  <p className="mt-1 font-display text-3xl">{products.length}</p>
                </div>
                <div className="rounded-2xl bg-[var(--fog)] p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
                    Ventas
                  </p>
                  <p className="mt-1 font-display text-3xl">{store.purchases.length}</p>
                </div>
                <div className="col-span-2 rounded-2xl bg-[var(--fog)] p-4 sm:col-span-1">
                  <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
                    Citas Pagate
                  </p>
                  <p className="mt-1 font-display text-3xl">{sessions.length}</p>
                </div>
              </div>

              <h2 className="font-display mt-10 text-2xl">Próximas sesiones Pagate</h2>
              <div className="mt-2">
                {sessions.length === 0 ? (
                  <p className="py-4 text-sm text-[var(--ink-muted)]">
                    Aún no hay citas. Agenda una desde la tienda.
                  </p>
                ) : (
                  sessions.map(({ purchase, product }) => (
                    <div key={purchase.id} className="product-row">
                      <div>
                        <p className="font-semibold text-[var(--ink)]">{product.name}</p>
                        <p className="mt-1 text-sm text-[var(--ink-muted)]">
                          {purchase.buyerName} · {purchase.buyerEmail}
                        </p>
                        {purchase.slotStart && purchase.slotEnd ? (
                          <p className="mt-1 text-sm text-[var(--teal-deep)]">
                            {formatSlotRange(purchase.slotStart, purchase.slotEnd)}
                          </p>
                        ) : null}
                      </div>
                      {purchase.meetUrl ? (
                        <a
                          href={purchase.meetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[var(--teal-deep)] underline-offset-2 hover:underline"
                        >
                          {purchase.googleEventId ? "Abrir Meet" : "Meet demo"}
                        </a>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              <h2 className="font-display mt-10 text-2xl">Tus productos</h2>
              <div className="mt-2">
                {products.map((product) => (
                  <div key={product.id} className="product-row">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--teal)]">
                        {product.type === "session" ? "Sesión" : "Digital"}
                      </p>
                      <p className="font-semibold text-[var(--ink)]">{product.name}</p>
                      <p className="mt-1 text-sm text-[var(--ink-muted)] line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-[var(--teal-deep)]">
                        {formatClp(product.priceClp)}
                      </p>
                      <Link
                        href={`/checkout/${product.id}`}
                        className="mt-1 inline-block text-sm text-[var(--ink-muted)] underline-offset-2 hover:underline"
                      >
                        Probar checkout
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <MercadoPagoCard />

            <GoogleCalendarCard
              configured={googleReady}
              connected={googleOn}
              email={googleEmail || creator.googleCalendar?.email}
              status={google}
            />

            <section className="animate-rise-delay rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-6 backdrop-blur-sm sm:p-8">
              <h2 className="font-display text-2xl">Mi tienda</h2>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                Personaliza banner, bio, redes y color de marca de tu vitrina pública.
              </p>
              <div className="mt-6">
                <StoreSettingsPanel />
              </div>
            </section>

            <section className="animate-rise-delay rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-6 backdrop-blur-sm sm:p-8">
              <h2 className="font-display text-2xl">Cupones</h2>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                Crea códigos de descuento para tus clientes.
              </p>
              <div className="mt-6">
                <CouponsPanel />
              </div>
            </section>

            <section className="animate-rise-delay rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-6 backdrop-blur-sm sm:p-8">
              <h2 className="font-display text-2xl">Disponibilidad</h2>
              <div className="mt-4">
                <AvailabilityForm
                  startHour={availability.startHour}
                  endHour={availability.endHour}
                  slotMinutes={availability.slotMinutes}
                />
              </div>
            </section>

            <section className="animate-rise-delay-2 rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-6 backdrop-blur-sm sm:p-8">
              <h2 className="font-display text-2xl">Publicar producto</h2>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                PDF demo, sesión 1:1 o acceso a comunidad (Telegram, WhatsApp, Zoom).
              </p>
              <div className="mt-6">
                <AddProductForm />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
    </DashboardStoreProvider>
  );
}
