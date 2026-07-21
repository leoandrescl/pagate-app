import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/forms";
import { formatClp, getProduct } from "@/lib/demo-store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ productId: string }> };

export default async function CheckoutPage({ params }: Props) {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product) notFound();

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
          Simulación de pago con medios chilenos (Webpay / transferencia).
        </p>
        <div className="animate-rise-delay mt-8 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 backdrop-blur-sm">
          <CheckoutForm
            productId={product.id}
            productName={product.name}
            priceLabel={formatClp(product.priceClp)}
          />
        </div>
      </main>
    </div>
  );
}
