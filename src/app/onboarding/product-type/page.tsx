import { OnboardingChrome } from "@/components/onboarding/onboarding-chrome";
import { ProductTypeForm } from "@/components/onboarding/product-type-form";
import { loadOnboardingStep } from "@/lib/onboarding-guard";

export const dynamic = "force-dynamic";

export default async function ProductTypePage() {
  const { user, store } = await loadOnboardingStep("product-type");

  return (
    <OnboardingChrome step={2} email={user.email}>
      <h1 className="animate-rise font-display text-center text-4xl text-[var(--ink)] sm:text-5xl">
        ¿Qué vas a <span className="title-mark">vender</span>?
      </h1>
      <p className="animate-rise-delay mx-auto mt-4 max-w-lg text-center text-base leading-relaxed text-[var(--ink-muted)]">
        Puedes vender uno o varios tipos. Esto nos ayuda a configurar tu tienda.
        El primer producto lo creas después, en el panel.
      </p>
      <div className="animate-rise-delay-2 mt-8 flex flex-1 flex-col">
        <ProductTypeForm defaultTypes={store?.intendedProductTypes ?? []} />
      </div>
    </OnboardingChrome>
  );
}
