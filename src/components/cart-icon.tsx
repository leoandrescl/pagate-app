"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function CartIcon({ username }: { username: string }) {
  const { itemCount } = useCart();

  return (
    <Link
      href={`/u/${username}/carrito`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-white/70 text-[var(--ink)] backdrop-blur-sm transition hover:border-[var(--teal)]/50"
      aria-label={`Carrito${itemCount > 0 ? `, ${itemCount} productos` : ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {itemCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--teal-deep)] px-1 text-[10px] font-bold text-white">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </Link>
  );
}
