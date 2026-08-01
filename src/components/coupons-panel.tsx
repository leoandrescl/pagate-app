"use client";

import { useState } from "react";
import { formatClp } from "@/lib/format-clp";
import { MOCK_COUPONS, type CouponType } from "@/lib/mock-data";
import { useStoreSettings } from "@/lib/store-settings-context";

export function CouponsPanel() {
  const { coupons, addCoupon } = useStoreSettings();
  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponType>("percent");
  const [value, setValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const allCoupons = [...coupons, ...MOCK_COUPONS.filter(
    (m) => !coupons.some((c) => c.code === m.code),
  )];

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const numValue = Number(value.replace(/\D/g, ""));
    if (!code.trim() || code.trim().length < 3) {
      setMessage("El código debe tener al menos 3 caracteres.");
      return;
    }
    if (!Number.isFinite(numValue) || numValue <= 0) {
      setMessage("Ingresa un valor válido.");
      return;
    }
    if (!expiresAt) {
      setMessage("Elige una fecha de vigencia.");
      return;
    }
    addCoupon({
      code: code.trim().toUpperCase(),
      type,
      value: numValue,
      expiresAt,
    });
    setCode("");
    setValue("");
    setExpiresAt("");
    setMessage("Cupón creado (guardado localmente).");
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg text-[var(--ink)]">Cupones activos</h3>
        {allCoupons.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--ink-muted)]">Aún no hay cupones.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {allCoupons.map((coupon) => (
              <li
                key={coupon.code}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-semibold text-[var(--ink)]">{coupon.code}</span>
                  <span className="ml-2 text-[var(--ink-muted)]">
                    {coupon.type === "percent"
                      ? `${coupon.value}% de descuento`
                      : `${formatClp(coupon.value)} de descuento`}
                  </span>
                </div>
                <span className="text-xs text-[var(--ink-muted)]">
                  Vigente hasta{" "}
                  {new Date(coupon.expiresAt).toLocaleDateString("es-CL")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleCreate} className="space-y-4 border-t border-[var(--line)] pt-6">
        <h3 className="font-display text-lg text-[var(--ink)]">Crear cupón</h3>
        <div>
          <label htmlFor="couponCode" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
            Código
          </label>
          <input
            id="couponCode"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="VERANO20"
            className="field uppercase"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
              Tipo de descuento
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm has-[:checked]:border-[var(--teal)] has-[:checked]:bg-[var(--mint)]/40">
                <input
                  type="radio"
                  checked={type === "percent"}
                  onChange={() => setType("percent")}
                />
                Porcentaje
              </label>
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm has-[:checked]:border-[var(--teal)] has-[:checked]:bg-[var(--mint)]/40">
                <input
                  type="radio"
                  checked={type === "fixed"}
                  onChange={() => setType("fixed")}
                />
                Monto fijo
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="couponValue" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
              {type === "percent" ? "Porcentaje (%)" : "Monto (CLP)"}
            </label>
            <input
              id="couponValue"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode="numeric"
              placeholder={type === "percent" ? "10" : "5000"}
              className="field"
            />
          </div>
        </div>
        <div>
          <label htmlFor="couponExpires" className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
            Vigencia hasta
          </label>
          <input
            id="couponExpires"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="field"
          />
        </div>
        {message ? (
          <p className={`text-sm ${message.includes("creado") ? "text-[var(--teal-deep)]" : "text-[var(--coral)]"}`}>
            {message}
          </p>
        ) : null}
        <button type="submit" className="btn-primary text-sm">
          Crear cupón
        </button>
        <p className="text-xs text-[var(--ink-muted)]">
          // MOCK: cupones demo BIENVENIDA10 y NUTRI5000 disponibles en checkout. Los nuevos se guardan en localStorage.
        </p>
      </form>
    </div>
  );
}
