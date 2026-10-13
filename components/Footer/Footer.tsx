"use client";

import { usePathname } from "next/navigation";
import { onboardingHref } from "@/lib/onboarding";

export function FooterNote() {
  return (
    <footer className="type-small px-4 py-6 text-text-secondary">
      AI behavior is simulated for this prototype. All feedback comes from the source guide.
    </footer>
  );
}

/** The footer note on every screen. Onboarding carries it on its final screen instead. */
export function Footer() {
  return usePathname() === onboardingHref ? null : <FooterNote />;
}
