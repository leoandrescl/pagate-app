import Link from "next/link";

export default function NotFound() {
  return (
    <div className="atmosphere flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="font-display text-5xl text-[var(--ink)]">404</p>
        <p className="mt-3 text-[var(--ink-muted)]">
          No encontramos esa página o el link de descarga ya no existe.
        </p>
        <Link href="/" className="btn-primary mt-8 inline-flex">
          Volver a Pagate
        </Link>
      </div>
    </div>
  );
}
