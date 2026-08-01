import Link from "next/link";
import { notFound } from "next/navigation";
import { CommunityCheckoutLoader } from "@/components/community-checkout-loader";
import { CheckoutForm } from "@/components/forms";
import {
  formatClp,
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

type Props = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ type?: string }>;
};

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { productId } = await params;
  const { type: typeQuery } = await searchParams;

  const isCommunityMock =
    typeQuery === "community" || productId.startsWith("mock_comm");

  if (isCommunityMock) {
    return (
      <div className="atmosphere min-h-screen">
        <header className="shell flex items-center justify-between py-5">
          <Link href="/u/camila.nutri" className="text-sm font-semibold text-[var(--ink-muted)]">
            ← Volver a la tienda
          </Link>
          <p className="font-display text-lg font-semibold">Pagate</p>
        </header>
        <main className="shell relative z-[1] max-w-md pb-20 pt-6">
          <h1 className="animate-rise font-display text-3xl text-[var(--ink)]">Checkout</h1>
          <p className="animate-rise mt-2 text-sm text-[var(--ink-muted)]">
            Simulación de pago con Webpay, transferencia o Mercado Pago.
          </p>
          <div className="animate-rise-delay mt-8 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 backdrop-blur-sm">
            <CommunityCheckoutLoader productId={productId} />
          </div>
        </main>
      </div>
    );
  }

  const [product, creator, store] = await Promise.all([
    getProduct(productId),
    getCreator(),
    getStore(),
  ]);
  if (!product) notFound();

  let busy: { start: string; end: string }[] = [];
  const googleOn = await isGoogleConnected();
  if (product.type === "session" && googleOn) {
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 21);
    busy = await fetchBusyIntervals(timeMin, timeMax);
  }

  const slots =
    product.type === "session"
      ? generateAvailableSlots(
          creator.availability,
          bookedSlotStarts(store.purchases),
          {
            busy,
            durationMinutes: product.durationMinutes,
          },
        )
      : [];

  return (
    <div className="atmosphere min-h-screen">
      <header className="shell flex items-center justify-between py-5">
        <Link href="/u/camila.nutri" className="text-sm font-semibold text-[var(--ink-muted)]">
          ← Volver a la tienda
        </Link>
        <p className="font-display text-lg font-semibold">Pagate</p>
      </header>

      <main className="shell relative z-[1] max-w-md pb-20 pt-6">
        <h1 className="animate-rise font-display text-3xl text-[var(--ink)]">
          {product.type === "session" ? "Agendar y pagar" : "Checkout"}
        </h1>
        <p className="animate-rise mt-2 text-sm text-[var(--ink-muted)]">
          Simulación de pago con Webpay, transferencia o Mercado Pago.
          {product.type === "session" && googleOn
            ? " Horarios libres según tu Google Calendar."
            : null}
        </p>
        <div className="animate-rise-delay mt-8 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 backdrop-blur-sm">
          <CheckoutForm
            productId={product.id}
            productName={product.name}
            productType={product.type}
            priceClp={product.priceClp}
            priceLabel={formatClp(product.priceClp)}
            durationMinutes={product.durationMinutes}
            slots={slots}
            googleConnected={googleOn}
          />
        </div>
      </main>
    </div>
  );
}
