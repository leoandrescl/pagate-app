import { OnboardingChrome } from "@/components/onboarding/onboarding-chrome";
import { PaymentsForm } from "@/components/onboarding/payments-form";
import { loadOnboardingStep } from "@/lib/onboarding-guard";
import {
  isMercadoPagoConnected,
  isMercadoPagoOAuthConfigured,
} from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ mp?: string }>;
};

export default async function PagosPage({ searchParams }: Props) {
  const { mp } = await searchParams;
  const { user, store } = await loadOnboardingStep("pagos");
  const mpConnected = await isMercadoPagoConnected(user.id);

  return (
    <OnboardingChrome step={3} email={user.email}>
      <h1 className="animate-rise font-display text-center text-3xl text-[var(--ink)] sm:text-4xl">
        Configura tus <span className="title-mark">medios de pago</span>
      </h1>
      <p className="animate-rise-delay mx-auto mt-2 max-w-lg text-center text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
        Conecta Mercado Pago para cobrar en línea, o deja tus datos de
        transferencia. Los productos gratuitos no necesitan esto.
      </p>
      <div className="animate-rise-delay-2 mt-6 flex flex-1 flex-col">
        <PaymentsForm
          mpConnected={mpConnected}
          mpConfigured={isMercadoPagoOAuthConfigured()}
          mpStatus={mp}
          defaults={
            store?.paymentSettings ?? {
              mercadoPago: mpConnected ? "connected" : "later",
              transferEnabled: false,
            }
          }
        />
      </div>
    </OnboardingChrome>
  );
}
