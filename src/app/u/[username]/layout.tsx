import { notFound } from "next/navigation";
import { getStoreByUsername } from "@/lib/store";
import { storeSettingsFromBundle } from "@/lib/store-appearance";
import { StoreProviders } from "@/components/store-providers";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
};

export default async function StoreLayout({ children, params }: Props) {
  const { username } = await params;
  const store = await getStoreByUsername(username);
  if (!store) notFound();

  return (
    <StoreProviders
      username={username}
      initialSettings={storeSettingsFromBundle(store)}
    >
      {children}
    </StoreProviders>
  );
}
