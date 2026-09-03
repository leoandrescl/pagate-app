"use client";

import { signOutAction } from "@/lib/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="btn-ghost text-sm">
        Cerrar sesión
      </button>
    </form>
  );
}
