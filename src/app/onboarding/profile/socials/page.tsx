import { OnboardingChrome } from "@/components/onboarding/onboarding-chrome";
import { SocialsForm } from "@/components/onboarding/socials-form";
import { loadOnboardingStep } from "@/lib/onboarding-guard";

export const dynamic = "force-dynamic";

export default async function SocialsPage() {
  const { user, store } = await loadOnboardingStep("socials");

  return (
    <OnboardingChrome step={5} email={user.email}>
      <h1 className="animate-rise font-display text-center text-4xl text-[var(--ink)] sm:text-5xl">
        Agrega tus <span className="title-mark">redes</span>
      </h1>
      <p className="animate-rise-delay mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-[var(--ink-muted)]">
        Instagram, TikTok o WhatsApp, si quieres. No es obligatorio para
        publicar tu tienda.
      </p>
      <div className="animate-rise-delay-2 mt-8 flex flex-1 flex-col">
        <SocialsForm defaults={store?.socialLinks ?? {}} />
      </div>
    </OnboardingChrome>
  );
}
