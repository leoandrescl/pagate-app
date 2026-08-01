"use client";

import { useStoreSettings } from "@/lib/store-settings-context";

function SocialIcon({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: React.ReactNode;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-white/80 text-[var(--ink-muted)] transition hover:border-[var(--teal)] hover:text-[var(--teal-deep)]"
    >
      {children}
    </a>
  );
}

export function StoreHeader({
  displayName,
  avatarInitials,
}: {
  displayName: string;
  avatarInitials: string;
}) {
  const { settings } = useStoreSettings();
  const { bannerUrl, headline, bio, socialLinks } = settings;

  return (
    <section className="animate-rise overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white/80 backdrop-blur-sm">
      <div
        className="h-36 w-full bg-cover bg-center sm:h-44"
        style={{ backgroundImage: `url(${bannerUrl})` }}
        role="img"
        aria-label="Banner de portada"
      />
      <div className="relative px-5 pb-6 pt-0 text-center sm:px-8">
        <div className="mx-auto -mt-10 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[var(--teal-deep)] font-display text-2xl text-white shadow-[0_12px_40px_var(--glow)]">
          {avatarInitials}
        </div>
        <h1 className="font-display mt-4 text-4xl text-[var(--ink)]">
          {displayName}
        </h1>
        <p className="mt-2 text-[var(--teal)]">{headline}</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--ink-muted)]">
          {bio}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <SocialIcon href={socialLinks.instagram} label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </SocialIcon>
          <SocialIcon href={socialLinks.tiktok} label="TikTok">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
            </svg>
          </SocialIcon>
          <SocialIcon href={socialLinks.whatsapp} label="WhatsApp">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
          </SocialIcon>
        </div>
      </div>
    </section>
  );
}
