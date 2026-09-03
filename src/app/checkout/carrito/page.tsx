import Link from "next/link";
import { notFound } from "next/navigation";
import { CartCheckoutForm } from "@/components/cart-checkout-form";
import { CartCheckoutProviders } from "@/components/cart-checkout-providers";
import { getStoreByUsername } from "@/lib/store";
import {
  fetchBusyIntervals,
  isGoogleConnected,
} from "@/lib/google-calendar";
import { bookedSlotStarts, generateAvailableSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ u?: string }>;
};

export default async function CartCheckoutPage({ searchParams }: Props) {
  const { u } = await searchParams;
  if (!u) notFound();
  const store = await getStoreByUsername(u);
  if (!store) notFound();
  const creator = store.creator;
  const googleOn = await isGoogleConnected(store.ownerId);

  let busy: { start: string; end: string }[] = [];
  if (googleOn) {
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 21);
    busy = await fetchBusyIntervals(store.ownerId, timeMin, timeMax);
  }

  const sessionProducts = store.products.filter((p) => p.type === "session");
  const slotsByProduct: Record<string, string[]> = {};

  for (const product of sessionProducts) {
    slotsByProduct[product.id] = generateAvailableSlots(
      creator.availability,
      bookedSlotStarts(store.purchases),
      { busy, durationMinutes: product.durationMinutes },
    );
  }

  return (
    <CartCheckoutProviders username={creator.username}>
      <div className="atmosphere min-h-screen">
        <header className="shell flex items-center justify-between py-5">
          <Link
            href={`/u/${creator.username}/carrito`}
            className="text-sm font-semibold text-[var(--ink-muted)]"
          >
            ← Volver al carrito
          </Link>
          <p className="font-display text-lg font-semibold">Pagate</p>
        </header>

        <main className="shell relative z-[1] max-w-md pb-20 pt-6">
          <h1 className="animate-rise font-display text-3xl text-[var(--ink)]">
            Checkout · carrito
          </h1>
          <p className="animate-rise mt-2 text-sm text-[var(--ink-muted)]">
            Pago con Mercado Pago (Checkout Pro). Zona horaria Chile (America/Santiago).
          </p>
          <div className="animate-rise-delay mt-8 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 backdrop-blur-sm">
            <CartCheckoutForm
              slotsByProduct={slotsByProduct}
              googleConnected={googleOn}
            />
          </div>
        </main>
      </div>
    </CartCheckoutProviders>
  );
}
