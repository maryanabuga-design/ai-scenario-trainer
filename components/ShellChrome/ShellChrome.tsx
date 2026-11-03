"use client";

import { usePathname } from "next/navigation";
import { InstructorSideNav } from "@/components/ShellChrome/InstructorSideNav";
import { shellKindOf } from "@/components/ShellChrome/shell-kind";
import { useRole } from "@/lib/auth";

/**
 * The instructor's extra frame (DESIGN.md: Responsive instructor): a skip link and the side
 * navigation, drawn only on the instructor's screens. The side navigation carries
 * `data-shell="instructor"`, which the frame and its children read with CSS `:has()`, so the
 * choice between the phone column and the wide layout stays CSS only (the `desk:` variant).
 */
export function ShellChrome() {
  const pathname = usePathname();
  const role = useRole();
  if (shellKindOf(pathname, role) !== "instructor") return null;
  return (
    <>
      <a
        href="#main-content"
        className="type-button sr-only rounded-full bg-primary px-4 py-3 text-primary-text focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to main content
      </a>
      <InstructorSideNav />
    </>
  );
}
