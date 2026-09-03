import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  canVisitOnboardingStep,
  isOnboardingComplete,
  pendingOnboardingPath,
} from "@/lib/onboarding";
import { getMyStore } from "@/lib/store";
import type { OnboardingStepId, StoreBundle } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export async function loadOnboardingStep(step: OnboardingStepId): Promise<{
  user: User;
  store: StoreBundle | null;
}> {
  const user = await requireUser();
  const store = await getMyStore(user.id);
  if (isOnboardingComplete(store)) {
    redirect("/dashboard");
  }
  if (!canVisitOnboardingStep(store, step)) {
    redirect(pendingOnboardingPath(store));
  }
  return { user, store };
}
