import { HandleForm } from "@/components/onboarding/handle-form";
import { OnboardingChrome } from "@/components/onboarding/onboarding-chrome";
import { loadOnboardingStep } from "@/lib/onboarding-guard";
import { getAppBaseUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function HandlePage() {
  const { user, store } = await loadOnboardingStep("handle");
  const prefix = `${getAppBaseUrl().replace(/^https?:\/\//, "")}/u/`;

  return (
    <OnboardingChrome step={1} email={user.email}>
      <h1 className="animate-rise font-display text-center text-4xl text-[var(--ink)] sm:text-5xl">
        Elige tu <span className="title-mark">handle</span>
      </h1>
      <p className="animate-rise-delay mx-auto mt-4 max-w-lg text-center text-base leading-relaxed text-[var(--ink-muted)]">
        Este será el link de tu tienda:{" "}
        <span className="font-semibold text-[var(--ink)]">{prefix}tuhandle</span>
      </p>
      <p className="animate-rise-delay mt-2 text-center text-sm text-[var(--ink-muted)]">
        Escríbelo con cuidado: es el usuario público de tu vitrina.
      </p>
      <div className="animate-rise-delay-2 mt-8 flex flex-1 flex-col">
        <HandleForm prefix={prefix} defaultUsername={store?.creator.username} />
      </div>
    </OnboardingChrome>
  );
}
