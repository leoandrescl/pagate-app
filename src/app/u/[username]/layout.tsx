import { notFound } from "next/navigation";
import { getCreatorByUsername } from "@/lib/store";
import { StoreProviders } from "@/components/store-providers";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
};

export default async function StoreLayout({ children, params }: Props) {
  const { username } = await params;
  const creator = await getCreatorByUsername(username);
  if (!creator) notFound();

  return (
    <StoreProviders
      username={username}
      headline={creator.headline}
      bio={creator.bio}
    >
      {children}
    </StoreProviders>
  );
}
