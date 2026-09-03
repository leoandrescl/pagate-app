import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { isOnboardingComplete } from "@/lib/onboarding";
import { getMyStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StudioAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  const store = await getMyStore(user.id);
  if (isOnboardingComplete(store)) {
    redirect("/dashboard");
  }
  return children;
}
