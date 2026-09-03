import { OnboardingChrome } from "@/components/onboarding/onboarding-chrome";
import { ProfileForm } from "@/components/onboarding/profile-form";
import { displayNameFromUser } from "@/lib/auth";
import { loadOnboardingStep } from "@/lib/onboarding-guard";
import { initialsFromName } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user, store } = await loadOnboardingStep("profile");
  const meta = user.user_metadata ?? {};
  const avatarUrl =
    store?.avatarUrl ||
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    null;
  const name =
    store?.creator.displayName || displayNameFromUser(user) || "";

  return (
    <OnboardingChrome step={5} email={user.email}>
      <h1 className="animate-rise font-display text-center text-4xl text-[var(--ink)] sm:text-5xl">
        Dale identidad a tu <span className="title-mark">tienda</span>
      </h1>
      <p className="animate-rise-delay mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-[var(--ink-muted)]">
        Cuéntale a tu audiencia quién eres. Puedes cambiarlo más adelante en el
        panel.
      </p>
      <div className="animate-rise-delay-2 mt-8 flex flex-1 flex-col">
        <ProfileForm
          defaultName={name}
          defaultBio={store?.creator.bio ?? ""}
          avatarUrl={avatarUrl}
          initials={initialsFromName(name)}
        />
      </div>
    </OnboardingChrome>
  );
}
