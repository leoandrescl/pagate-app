import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatClp, getPurchaseByToken, getStoreById } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
        {label}
      </p>
      <p className="mt-1 select-all font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

export default async function TransferenciaPage({ searchParams }: Props) {
  const { token } = await searchParams;
  if (!token) notFound();

  const result = await getPurchaseByToken(token);
  if (!result) notFound();

  const { purchase, product } = result;
  if (purchase.status === "paid") {
    redirect(`/d/${purchase.token}`);
  }
  if (purchase.paymentMethod !== "transfer") {
    notFound();
  }

  const store = await getStoreById(product.creatorId);
  if (!store) notFound();
  const pay = store.paymentSettings;
  const storeHref = `/u/${store.creator.username}`;

  const related = store.purchases.filter((item) => {
    if (item.paymentMethod !== "transfer" || item.status !== "pending") {
      return false;
    }
    if (item.buyerEmail !== purchase.buyerEmail) return false;
    const delta = Math.abs(
      new Date(item.createdAt).getTime() - new Date(purchase.createdAt).getTime(),
    );
    return delta < 5 * 60 * 1000;
  });
  const lines = related.length > 0 ? related : [purchase];
  const totalClp = lines.reduce((sum, item) => sum + item.amountClp, 0);

  return (
    <div className="atmosphere min-h-screen">
      <header className="shell flex items-center justify-between py-5">
        <Link
          href={storeHref}
          className="text-sm font-semibold text-[var(--ink-muted)]"
        >
          ← Volver a la tienda
        </Link>
        <p className="font-display text-lg font-semibold">Pagate</p>
      </header>

      <main className="shell relative z-[1] max-w-md pb-20 pt-6">
        <h1 className="animate-rise font-display text-3xl text-[var(--ink)]">
          Transfiere desde tu banco
        </h1>
        <p className="animate-rise mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
          Pagate no mueve este dinero. Tú transfieres a la cuenta de{" "}
          {store.creator.displayName}. Cuando el vendedor confirme el pago, se
          libera tu descarga o sesión.
        </p>

        <div className="animate-rise-delay mt-8 space-y-4 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-6 backdrop-blur-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
              Monto a transferir
            </p>
            <p className="mt-1 font-display text-3xl text-[var(--teal-deep)]">
              {formatClp(totalClp)}
            </p>
            {lines.length > 1 ? (
              <ul className="mt-3 space-y-1 text-sm text-[var(--ink-muted)]">
                {lines.map((item) => {
                  const name =
                    store.products.find((p) => p.id === item.productId)?.name ??
                    "Producto";
                  return (
                    <li key={item.id}>
                      {name} · {formatClp(item.amountClp)}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{product.name}</p>
            )}
          </div>

          <div className="grid gap-4 rounded-2xl bg-[var(--fog)] p-4">
            <Detail label="Titular" value={pay.transferHolder} />
            <Detail label="RUT" value={pay.transferRut} />
            <Detail label="Banco" value={pay.transferBank} />
            <Detail label="Cuenta" value={pay.transferAccount} />
            <Detail label="Email para el comprobante" value={pay.transferEmail} />
          </div>

          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
            Usa estos datos en tu banco o app. En el comentario puedes poner tu
            nombre ({purchase.buyerName}). Guarda este link para volver cuando el
            vendedor confirme.
          </p>

          <Link href={`/d/${purchase.token}`} className="btn-primary w-full">
            Ya transferí · ver estado
          </Link>
        </div>
      </main>
    </div>
  );
}
