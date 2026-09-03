import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  const store = await getMyStore(user.id);
  if (!store) {
    redirect("/onboarding");
  }
  return children;
}
