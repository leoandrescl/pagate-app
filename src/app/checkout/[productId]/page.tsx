import Link from "next/link";
import { notFound } from "next/navigation";
import { CommunityCheckoutLoader } from "@/components/community-checkout-loader";
import { CartCheckoutProviders } from "@/components/cart-checkout-providers";
import { CheckoutForm } from "@/components/forms";
import { formatClp, getStoreForProduct } from "@/lib/store";
import {
  fetchBusyIntervals,
  isGoogleConnected,
} from "@/lib/google-calendar";
import { bookedSlotStarts, generateAvailableSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ type?: string; u?: string }>;
};

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { productId } = await params;
  const { type: typeQuery, u } = await searchParams;

  const isCommunityMock =
    typeQuery === "community" || productId.startsWith("mock_comm");

  if (isCommunityMock) {
    const storeHref = `/u/${u || "camila.nutri"}`;
    return (
      <CartCheckoutProviders username={u || "camila.nutri"}>
        <div className="atmosphere min-h-screen">
          <header className="shell flex items-center justify-between py-5">
            <Link href={storeHref} className="text-sm font-semibold text-[var(--ink-muted)]">
              ← Volver a la tienda
            </Link>
            <p className="font-display text-lg font-semibold">Pagate</p>
          </header>
          <main className="shell relative z-[1] max-w-md pb-20 pt-6">
            <h1 className="animate-rise font-display text-3xl text-[var(--ink)]">Checkout</h1>
            <p className="animate-rise mt-2 text-sm text-[var(--ink-muted)]">
              Pago con Mercado Pago (Checkout Pro).
            </p>
            <div className="animate-rise-delay mt-8 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 backdrop-blur-sm">
              <CommunityCheckoutLoader productId={productId} />
            </div>
          </main>
        </div>
      </CartCheckoutProviders>
    );
  }

  const store = await getStoreForProduct(productId);
  if (!store) notFound();
  const product = store.products.find((p) => p.id === productId);
  if (!product) notFound();
  const creator = store.creator;
  const storeHref = `/u/${creator.username}`;

  let busy: { start: string; end: string }[] = [];
  const googleOn = await isGoogleConnected(store.ownerId);
  if (product.type === "session" && googleOn) {
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 21);
    busy = await fetchBusyIntervals(store.ownerId, timeMin, timeMax);
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
    <CartCheckoutProviders username={creator.username}>
      <div className="atmosphere min-h-screen">
        <header className="shell flex items-center justify-between py-5">
          <Link href={storeHref} className="text-sm font-semibold text-[var(--ink-muted)]">
            ← Volver a la tienda
          </Link>
          <p className="font-display text-lg font-semibold">Pagate</p>
        </header>

        <main className="shell relative z-[1] max-w-md pb-20 pt-6">
          <h1 className="animate-rise font-display text-3xl text-[var(--ink)]">
            {product.type === "session" ? "Agendar y pagar" : "Checkout"}
          </h1>
          <p className="animate-rise mt-2 text-sm text-[var(--ink-muted)]">
            Pago con Mercado Pago (Checkout Pro).
            {product.type === "session" && googleOn
              ? " Horarios libres según Google Calendar."
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
    </CartCheckoutProviders>
  );
}
