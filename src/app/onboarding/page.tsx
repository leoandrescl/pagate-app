import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { pendingOnboardingPath } from "@/lib/onboarding";
import { getMyStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function OnboardingIndexPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const store = await getMyStore(user.id);
  redirect(pendingOnboardingPath(store));
}
