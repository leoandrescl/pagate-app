import Link from "next/link";
import { CreateStoreForm } from "@/components/create-store-form";
import { SignOutButton } from "@/components/sign-out-button";
import { displayNameFromUser, getUser } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getUser();
  const suggestedName = user ? displayNameFromUser(user) : "";

  return (
    <div className="atmosphere min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[var(--line)]/60 bg-[#eef6f3]/80 backdrop-blur-md">
        <div className="shell flex items-center justify-between py-4 sm:py-5">
          <Link
            href={getAppBaseUrl()}
            className="font-display text-2xl font-semibold text-[var(--ink)]"
          >
            Pagate
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="shell relative z-[1] max-w-lg pb-20 pt-4 sm:pt-8">
        <p className="animate-rise text-sm font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
          Onboarding
        </p>
        <h1 className="animate-rise-delay font-display mt-3 text-4xl text-[var(--ink)] sm:text-5xl">
          Configura tu tienda
        </h1>
        <p className="animate-rise-delay-2 mt-4 text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
          Elige tu usuario, preséntate y publica tu primer producto. En minutos
          tendrás un link listo para compartir.
        </p>

        <div className="animate-rise-delay-2 mt-8">
          <CreateStoreForm defaultDisplayName={suggestedName} />
        </div>
      </main>
    </div>
  );
}
