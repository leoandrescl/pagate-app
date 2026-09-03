import { OnboardingChrome } from "@/components/onboarding/onboarding-chrome";
import { PaymentsForm } from "@/components/onboarding/payments-form";
import { loadOnboardingStep } from "@/lib/onboarding-guard";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  const { user, store } = await loadOnboardingStep("pagos");

  return (
    <OnboardingChrome step={3} email={user.email}>
      <h1 className="animate-rise font-display text-center text-4xl text-[var(--ink)] sm:text-5xl">
        Configura tus <span className="title-mark">medios de pago</span>
      </h1>
      <p className="animate-rise-delay mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-[var(--ink-muted)]">
        Configura al menos un método para cobrar por tus productos. Los
        productos gratuitos funcionan sin esta configuración.
      </p>
      <div className="animate-rise-delay-2 mt-8 flex flex-1 flex-col">
        <PaymentsForm
          defaults={
            store?.paymentSettings ?? {
              mercadoPago: "later",
              goCuotas: false,
              transferEnabled: false,
            }
          }
        />
      </div>
    </OnboardingChrome>
  );
}
