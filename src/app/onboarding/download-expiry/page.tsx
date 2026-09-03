import { DownloadExpiryForm } from "@/components/onboarding/download-expiry-form";
import { OnboardingChrome } from "@/components/onboarding/onboarding-chrome";
import { loadOnboardingStep } from "@/lib/onboarding-guard";

export const dynamic = "force-dynamic";

export default async function DownloadExpiryPage() {
  const { user, store } = await loadOnboardingStep("download-expiry");

  return (
    <OnboardingChrome step={4} email={user.email}>
      <h1 className="animate-rise font-display text-center text-4xl text-[var(--ink)] sm:text-5xl">
        ¿Cuánto duran tus <span className="title-mark">links de descarga</span>?
      </h1>
      <p className="animate-rise-delay mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-[var(--ink-muted)]">
        Es el tiempo que tienen tus compradores para descargar los archivos
        después de comprar.
      </p>
      <div className="animate-rise-delay-2 mt-8 flex flex-1 flex-col">
        <DownloadExpiryForm defaultDays={store?.downloadExpiryDays ?? 7} />
      </div>
    </OnboardingChrome>
  );
}
