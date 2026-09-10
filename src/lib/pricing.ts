import { formatClp } from "@/lib/format-clp";
import {
  INSTALLMENT_COUNT,
  INSTALLMENT_THRESHOLD_CLP,
} from "@/lib/mock-data";

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Reparte un descuento entero entre montos sin perder ni un peso. */
export function distributeDiscount(
  amounts: number[],
  discountClp: number,
): number[] {
  const clean = amounts.map((a) => Math.max(0, Math.round(a)));
  const total = clean.reduce((a, b) => a + b, 0);
  const discount = Math.min(Math.max(0, Math.round(discountClp)), total);
  if (discount <= 0 || clean.length === 0) return clean.map(() => 0);

  const shares = clean.map((a) => Math.floor((a / total) * discount));
  let remainder = discount - shares.reduce((a, b) => a + b, 0);

  const fractions = clean.map((a, i) => (a / total) * discount - shares[i]);
  const order = fractions
    .map((f, i) => i)
    .sort((a, b) => fractions[b] - fractions[a]);

  let cursor = 0;
  while (remainder > 0 && cursor < order.length) {
    const idx = order[cursor % order.length];
    shares[idx] += 1;
    remainder -= 1;
    cursor += 1;
  }

  return shares.map((share, i) => Math.min(share, clean[i]));
}

export function qualifiesForInstallments(amountClp: number): boolean {
  return amountClp > INSTALLMENT_THRESHOLD_CLP;
}

export function installmentLabel(amountClp: number): string | null {
  if (!qualifiesForInstallments(amountClp)) return null;
  const perMonth = Math.ceil(amountClp / INSTALLMENT_COUNT);
  return `${INSTALLMENT_COUNT} cuotas sin interés de ${formatClp(perMonth)}`;
}