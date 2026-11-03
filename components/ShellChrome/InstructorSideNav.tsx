"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrent } from "@/components/BottomNav/BottomNav";
import { sideNavItems } from "@/components/ShellChrome/shell-kind";
import { useCurrentAccount } from "@/lib/auth";
import { initialOf } from "@/lib/user";

const itemClass =
  "flex min-h-11 items-center gap-3 rounded-full px-4 hover:bg-chip-neutral-bg motion-reduce:transition-none";

/**
 * The instructor's side navigation from 1024px (DESIGN.md: Responsive instructor): the product name,
 * the four tabs of the bottom bar and the profile entry. Drawn for the instructor shell only and
 * hidden below 1024px, where the bottom bar is used instead.
 */
export function InstructorSideNav() {
  const pathname = usePathname();
  const account = useCurrentAccount();
  const person = account && account !== "loading" ? account : null;
  const onProfile = pathname === "/profile" || pathname.startsWith("/profile/");
  return (
    <aside
      data-shell="instructor"
      data-side-nav
      className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-selectable-stroke bg-surface px-4 pt-6 pb-4 desk:flex"
    >
      <p className="type-item-title mb-6 px-4">AI Scenario Trainer</p>
      <nav aria-label="Instructor" className="flex-1">
        <ul className="flex flex-col gap-1">
          {sideNavItems.map((item) => {
            const current = isCurrent(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={`${itemClass} ${
                    current
                      ? "type-body-strong bg-sand-100 text-sand-900"
                      : "type-body text-text-secondary"
                  }`}
                >
                  <item.Icon size={20} strokeWidth={2} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Link
        href="/profile"
        aria-current={onProfile ? "page" : undefined}
        data-side-profile
        className={`${itemClass} ${onProfile ? "bg-sand-100 text-sand-900" : "text-text"}`}
      >
        <span
          aria-hidden="true"
          className="type-body-strong flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand-200 text-sand-900"
        >
          {person ? initialOf(person.name) : ""}
        </span>
        <span className="type-body-strong min-w-0 flex-1 truncate">
          {person?.name ?? "Profile"}
        </span>
      </Link>
    </aside>
  );
}
