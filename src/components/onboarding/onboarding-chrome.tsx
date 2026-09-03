import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { ONBOARDING_STEPPER } from "@/lib/onboarding";
import { getAppBaseUrl } from "@/lib/urls";

export function OnboardingChrome({
  step,
  email,
  children,
}: {
  step: number;
  email?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="atmosphere flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-[var(--line)]/60 bg-[#eef6f3]/80 backdrop-blur-md">
        <div className="shell grid grid-cols-[1fr_auto_1fr] items-center py-4 sm:py-5">
          <span />
          <Link
            href={getAppBaseUrl()}
            className="font-display text-center text-2xl font-semibold text-[var(--ink)]"
          >
            Pagate
          </Link>
          <div className="flex items-center justify-end gap-3">
            {email ? (
              <span className="hidden max-w-[12rem] truncate text-xs text-[var(--ink-muted)] sm:inline">
                {email}
              </span>
            ) : null}
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="shell relative z-[1] w-full max-w-3xl pt-8 sm:pt-10">
        <ol className="flex items-start justify-between gap-1">
          {ONBOARDING_STEPPER.map((item, index) => {
            const n = index + 1;
            const done = n < step;
            const current = n === step;
            return (
              <li
                key={item.id}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <div className="flex w-full items-center">
                  {index > 0 ? (
                    <span
                      className={`h-px flex-1 ${done || current ? "bg-[var(--teal)]" : "bg-[var(--line)]"}`}
                    />
                  ) : (
                    <span className="flex-1" />
                  )}
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      done
                        ? "bg-[var(--teal)] text-white"
                        : current
                          ? "bg-[var(--teal)] text-white"
                          : "border border-[var(--line)] bg-white text-[var(--ink-muted)]"
                    }`}
                  >
                    {done ? "✓" : n}
                  </span>
                  {index < ONBOARDING_STEPPER.length - 1 ? (
                    <span
                      className={`h-px flex-1 ${done ? "bg-[var(--teal)]" : "bg-[var(--line)]"}`}
                    />
                  ) : (
                    <span className="flex-1" />
                  )}
                </div>
                <span
                  className={`text-[11px] font-medium sm:text-xs ${
                    current || done
                      ? "text-[var(--ink)]"
                      : "text-[var(--ink-muted)]"
                  }`}
                >
                  {item.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <main className="shell relative z-[1] flex w-full max-w-3xl flex-1 flex-col pb-8 pt-10 sm:pt-12">
        {children}
      </main>
    </div>
  );
}
