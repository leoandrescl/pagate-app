import { installmentLabel } from "@/lib/pricing";

export function InstallmentBadge({ amountClp }: { amountClp: number }) {
  const label = installmentLabel(amountClp);
  if (!label) return null;

  return (
    <span className="inline-flex items-center rounded-full border border-[var(--teal)]/30 bg-[var(--mint)]/40 px-2.5 py-1 text-xs font-semibold text-[var(--teal-deep)]">
      Disponible en cuotas sin interés · {label}
    </span>
  );
}
