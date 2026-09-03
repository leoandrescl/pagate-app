import { formatClp } from "@/lib/format-clp";
import {
  INSTALLMENT_COUNT,
  INSTALLMENT_THRESHOLD_CLP,
  type MockCoupon,
} from "@/lib/mock-data";

export type AppliedCoupon = MockCoupon & { discountClp: number };

export function validateCoupon(
  code: string,
  extraCoupons: MockCoupon[] = [],
): AppliedCoupon | null {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const allCoupons = extraCoupons;

  const coupon = allCoupons.find(
    (c) => c.code === normalized && c.active,
  );
  if (!coupon) return null;

  if (new Date(coupon.expiresAt).getTime() < Date.now()) return null;

  return { ...coupon, discountClp: 0 };
}

export function calculateDiscount(
  subtotalClp: number,
  coupon: MockCoupon,
): number {
  if (subtotalClp <= 0) return 0;
  if (coupon.type === "percent") {
    return Math.round(subtotalClp * (coupon.value / 100));
  }
  return Math.min(coupon.value, subtotalClp);
}

export function applyCouponToSubtotal(
  subtotalClp: number,
  code: string,
  extraCoupons: MockCoupon[] = [],
): { coupon: AppliedCoupon | null; discountClp: number; totalClp: number } {
  const base = validateCoupon(code, extraCoupons);
  if (!base) {
    return { coupon: null, discountClp: 0, totalClp: subtotalClp };
  }
  const discountClp = calculateDiscount(subtotalClp, base);
  return {
    coupon: { ...base, discountClp },
    discountClp,
    totalClp: Math.max(0, subtotalClp - discountClp),
  };
}

export function qualifiesForInstallments(amountClp: number): boolean {
  return amountClp > INSTALLMENT_THRESHOLD_CLP;
}

export function installmentLabel(amountClp: number): string | null {
  if (!qualifiesForInstallments(amountClp)) return null;
  const perMonth = Math.ceil(amountClp / INSTALLMENT_COUNT);
  return `${INSTALLMENT_COUNT} cuotas sin interés de ${formatClp(perMonth)}`;
}
