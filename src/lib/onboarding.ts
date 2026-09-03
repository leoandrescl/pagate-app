import type { OnboardingStepId, StoreBundle } from "@/lib/types";

export const ONBOARDING_STEPPER = [
  { id: "handle", label: "Handle" },
  { id: "product-type", label: "Productos" },
  { id: "pagos", label: "Pagos" },
  { id: "download-expiry", label: "Descargas" },
  { id: "profile", label: "Perfil" },
] as const;

const FLOW: { id: OnboardingStepId; path: string; stepper: number }[] = [
  { id: "handle", path: "/onboarding/handle", stepper: 1 },
  { id: "product-type", path: "/onboarding/product-type", stepper: 2 },
  { id: "pagos", path: "/onboarding/pagos", stepper: 3 },
  { id: "download-expiry", path: "/onboarding/download-expiry", stepper: 4 },
  { id: "profile", path: "/onboarding/profile", stepper: 5 },
  { id: "socials", path: "/onboarding/profile/socials", stepper: 5 },
];

export function isOnboardingComplete(store: StoreBundle | null): boolean {
  return Boolean(store?.onboardingCompletedAt);
}

export function onboardingPath(step: OnboardingStepId): string {
  return FLOW.find((item) => item.id === step)?.path ?? "/onboarding/handle";
}

export function pendingOnboardingPath(store: StoreBundle | null): string {
  if (isOnboardingComplete(store)) return "/dashboard";
  if (!store) return "/onboarding/handle";
  const saved = store.onboardingStep;
  if (saved === "done") return "/dashboard";
  return onboardingPath(saved);
}

export function stepperIndexFor(step: OnboardingStepId): number {
  return FLOW.find((item) => item.id === step)?.stepper ?? 1;
}

function flowIndex(step: OnboardingStepId): number {
  const index = FLOW.findIndex((item) => item.id === step);
  return index < 0 ? 0 : index;
}

export function canVisitOnboardingStep(
  store: StoreBundle | null,
  step: OnboardingStepId,
): boolean {
  if (step === "handle") return true;
  if (!store) return false;
  return flowIndex(step) <= flowIndex(store.onboardingStep);
}

export function nextOnboardingStep(current: OnboardingStepId): OnboardingStepId {
  const index = flowIndex(current);
  return FLOW[Math.min(index + 1, FLOW.length - 1)]?.id ?? "socials";
}

export function advanceOnboardingStep(
  saved: OnboardingStepId,
  completed: OnboardingStepId,
): OnboardingStepId {
  const next = nextOnboardingStep(completed);
  return flowIndex(next) > flowIndex(saved) ? next : saved;
}
