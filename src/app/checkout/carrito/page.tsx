import Link from "next/link";
import { CartCheckoutForm } from "@/components/cart-checkout-form";
import {
  getCreator,
  getProduct,
  getStore,
} from "@/lib/demo-store";
import {
  fetchBusyIntervals,
  isGoogleConnected,
} from "@/lib/google-calendar";
import { bookedSlotStarts, generateAvailableSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

export default async function CartCheckoutPage() {
  const [creator, store, googleOn] = await Promise.all([
    getCreator(),
    getStore(),
    isGoogleConnected(),
  ]);

  let busy: { start: string; end: string }[] = [];
  if (googleOn) {
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 21);
    busy = await fetchBusyIntervals(timeMin, timeMax);
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
    <div className="atmosphere min-h-screen">
      <header className="shell flex items-center justify-between py-5">
        <Link href="/u/camila.nutri/carrito" className="text-sm font-semibold text-[var(--ink-muted)]">
          ← Volver al carrito
        </Link>
        <p className="font-display text-lg font-semibold">Pagate</p>
      </header>

      <main className="shell relative z-[1] max-w-md pb-20 pt-6">
        <h1 className="animate-rise font-display text-3xl text-[var(--ink)]">
          Checkout · carrito
        </h1>
        <p className="animate-rise mt-2 text-sm text-[var(--ink-muted)]">
          Simulación de pago con Webpay, transferencia o Mercado Pago. Zona horaria Chile (America/Santiago).
        </p>
        <div className="animate-rise-delay mt-8 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 backdrop-blur-sm">
          <CartCheckoutForm
            slotsByProduct={slotsByProduct}
            googleConnected={googleOn}
          />
        </div>
      </main>
    </div>
  );
}
