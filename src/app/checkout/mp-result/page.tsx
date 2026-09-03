import Link from "next/link";
import { getPurchaseByToken, getStoreById } from "@/lib/store";

type Props = {
  searchParams: Promise<{ status?: string; token?: string }>;
};

export default async function MpResultPage({ searchParams }: Props) {
  const { status, token } = await searchParams;
  const found = token ? await getPurchaseByToken(token) : null;
  const store = found
    ? await getStoreById(found.product.creatorId)
    : null;
  const storeHref = store ? `/u/${store.creator.username}` : "/";
  const title =
    status === "pending"
      ? "Pago pendiente"
      : status === "failure"
        ? "Pago no completado"
        : "Estado del pago";

  const body =
    status === "pending"
      ? "Mercado Pago aún está procesando el pago. Si se aprueba, la entrega se completa sola."
      : status === "failure"
        ? "El pago fue rechazado o cancelado. Puedes intentar de nuevo desde la tienda."
        : "No pudimos confirmar el resultado. Revisa tu email o vuelve a la tienda.";

  return (
    <div className="atmosphere flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[1.5rem] border border-[var(--line)] bg-white/85 p-8 text-center backdrop-blur-sm">
        <p className="font-display text-3xl text-[var(--ink)]">{title}</p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">{body}</p>
        <div className="mt-8 flex flex-col gap-2">
          {token ? (
            <Link href={`/d/${token}`} className="btn-primary">
              Ver comprobante
            </Link>
          ) : null}
          <Link href={storeHref} className="btn-ghost">
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
