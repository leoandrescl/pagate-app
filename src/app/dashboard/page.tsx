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
import {
  isMercadoPagoConnected,
  isMercadoPagoOAuthConfigured,
} from "@/lib/mercadopago";
import { confirmTransferPaidAction } from "@/lib/actions";
import { formatSlotRange } from "@/lib/slots";
import { storefrontHref, getAppBaseUrl } from "@/lib/urls";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ google?: string; mp?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const { google, mp } = await searchParams;
  const user = await requireUser();
  const mine = await getMyStore(user.id);
  if (!mine) redirect("/onboarding");

  const [sessions, googleOn, googleReady, googleEvents, googleEmail, mpOn] =
    await Promise.all([
      listUpcomingSessions(mine.creator.id),
      isGoogleConnected(user.id),
      Promise.resolve(isGoogleConfigured()),
      listUpcomingGoogleEvents(user.id, 7),
      getGoogleAccountEmail(user.id),
      isMercadoPagoConnected(user.id),
    ]);
  const mpReady = isMercadoPagoOAuthConfigured();
  const creator = mine.creator;
  const products = mine.products;
  const store = mine;
  const pendingTransfers = store.purchases.filter(
    (purchase) =>
      purchase.status === "pending" && purchase.paymentMethod === "transfer",
  );
  const storeUrl = storefrontHref(creator.username);
  const { availability } = creator;
  const publicHost = (
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ).replace(/^https?:\/\//, "");


  return (
    <DashboardStoreProvider headline={creator.headline} bio={creator.bio}>
    <div className="atmosphere min-h-screen">
      <header className="shell flex flex-wrap items-center justify-between gap-4 py-4 sm:py-5">
        <div>
          <Link href={getAppBaseUrl()} className="font-display text-2xl font-semibold text-[var(--ink)]">
            Pagate
          </Link>
          <p className="mt-0.5 text-sm text-[var(--ink-muted)]">Panel del creador</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={storeUrl} className="btn-ghost text-sm">
            Ver mi tienda
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="shell relative z-[1] space-y-6 pb-16">
        <WeekCalendar events={googleEvents} connected={googleOn} />

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <section className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-5 backdrop-blur-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--teal-deep)] font-display text-lg text-white">
                  {creator.avatarInitials}
                </div>
                <div className="min-w-0">
                  <h1 className="font-display text-2xl text-[var(--ink)] sm:text-3xl">
                    {creator.displayName}
                  </h1>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">{creator.headline}</p>
                  <p className="mt-2 text-sm">
                    Tu link:{" "}
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

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-[var(--fog)] p-3 sm:p-4">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
                    Productos
                  </p>
                  <p className="mt-1 font-display text-2xl sm:text-3xl">{products.length}</p>
                </div>
                <div className="rounded-2xl bg-[var(--fog)] p-3 sm:p-4">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
                    Ventas
                  </p>
                  <p className="mt-1 font-display text-2xl sm:text-3xl">{store.purchases.length}</p>
                </div>
                <div className="rounded-2xl bg-[var(--fog)] p-3 sm:p-4">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
                    Citas
                  </p>
                  <p className="mt-1 font-display text-2xl sm:text-3xl">{sessions.length}</p>
                </div>
              </div>

              <h2 className="font-display mt-6 text-xl">Próximas sesiones</h2>
              <div className="mt-2">
                {sessions.length === 0 ? (
                  <p className="py-2 text-sm text-[var(--ink-muted)]">
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

              <h2 className="font-display mt-6 text-xl">Tus productos</h2>
              <div className="mt-2">
                {products.length === 0 ? (
                  <p className="py-2 text-sm text-[var(--ink-muted)]">
                    Publica el primero con el formulario de abajo.
                  </p>
                ) : (
                  products.map((product) => (
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
                  ))
                )}
              </div>
            </section>

            {pendingTransfers.length > 0 ? (
              <section className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-5 backdrop-blur-sm sm:p-6">
                <h2 className="font-display text-xl">Transferencias pendientes</h2>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  Cuando veas el abono, marca la compra como pagada para liberar la entrega.
                </p>
                <div className="mt-4 space-y-3">
                  {pendingTransfers.map((purchase) => {
                    const product = products.find((p) => p.id === purchase.productId);
                    return (
                      <div
                        key={purchase.id}
                        className="rounded-2xl border border-[var(--line)] bg-[var(--fog)] p-4"
                      >
                        <p className="font-semibold text-[var(--ink)]">
                          {product?.name ?? "Producto"} · {formatClp(purchase.amountClp)}
                        </p>
                        <p className="mt-1 text-sm text-[var(--ink-muted)]">
                          {purchase.buyerName} · {purchase.buyerEmail}
                        </p>
                        <form action={confirmTransferPaidAction} className="mt-3">
                          <input type="hidden" name="token" value={purchase.token} />
                          <button type="submit" className="btn-primary text-sm">
                            Marcar como pagada
                          </button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-5 backdrop-blur-sm sm:p-6">
              <h2 className="font-display text-xl">Publicar producto</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                PDF, sesión 1:1 o acceso a comunidad.
              </p>
              <div className="mt-4">
                <AddProductForm />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <MercadoPagoCard
                configured={mpReady}
                connected={mpOn}
                status={mp}
              />
              <GoogleCalendarCard
                configured={googleReady}
                connected={googleOn}
                email={googleEmail || creator.googleCalendar?.email}
                status={google}
              />
            </div>

            <section className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-5 backdrop-blur-sm sm:p-6">
              <h2 className="font-display text-xl">Disponibilidad</h2>
              <div className="mt-3">
                <AvailabilityForm
                  startHour={availability.startHour}
                  endHour={availability.endHour}
                  slotMinutes={availability.slotMinutes}
                />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-5 backdrop-blur-sm sm:p-6">
              <h2 className="font-display text-xl">Mi tienda</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Banner, bio, redes y color de tu vitrina.
              </p>
              <div className="mt-4">
                <StoreSettingsPanel />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-5 backdrop-blur-sm sm:p-6">
              <h2 className="font-display text-xl">Cupones</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Códigos de descuento para tus clientes.
              </p>
              <div className="mt-4">
                <CouponsPanel />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
    </DashboardStoreProvider>
  );
}
