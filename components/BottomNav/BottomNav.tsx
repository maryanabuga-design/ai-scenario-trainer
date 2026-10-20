"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/lib/auth";
import type { Role } from "@/lib/role";
import { ChartNoAxesColumn, ClipboardList, FileText, House, Sparkles, User } from "lucide-react";

const studentItems = [
  { href: "/", label: "Home", Icon: House },
  { href: "/materials", label: "Materials", Icon: FileText },
  { href: "/progress", label: "Progress", Icon: ChartNoAxesColumn },
  { href: "/ask-ai", label: "Ask AI", Icon: Sparkles },
];

/** An instructor has Overview (Instructor Home), Exams and Profile, in the same style. */
const instructorItems = [
  { href: "/instructor", label: "Overview", Icon: House },
  { href: "/instructor/exams", label: "Exams", Icon: ClipboardList },
  { href: "/profile", label: "Profile", Icon: User },
];

/** The reading screens of the Materials tab have no bottom navigation (DESIGN.md: Reading screen). */
const READING_PREFIX = "/materials/read/";

function isCurrent(href: string, pathname: string) {
  if (pathname.startsWith(READING_PREFIX) || pathname === "/profile/edit") return false;
  // Training is a sub-screen of Home and keeps the Home item active.
  if (href === "/") return pathname === "/" || pathname === "/training";
  if (href === "/instructor") return pathname === "/instructor";
  // the exams list is a tab; its detail screens (new, <id>) are sub-screens with Back: no navigation
  if (href === "/instructor/exams") return pathname === "/instructor/exams";
  // a thread (/ask-ai/<id>) is a sub-screen with Back: no navigation
  if (href === "/ask-ai") return pathname === "/ask-ai";
  return pathname.startsWith(href);
}

/**
 * `role` is given by the screen review page; otherwise it is the saved role, and nothing is drawn
 * until that has been read (so an instructor never sees the student's four items).
 */
export function BottomNav({ activePath, role }: { activePath?: string; role?: Role }) {
  const currentPath = usePathname();
  const stored = useRole();
  const pathname = activePath ?? currentPath;
  const current = role ?? (activePath !== undefined ? "student" : stored);
  if (current === "loading") return null;
  const items = current === "instructor" ? instructorItems : studentItems;

  if (!items.some((item) => isCurrent(item.href, pathname))) return null;

  return (
    <nav
      aria-label="Main"
      className="mx-[var(--gutter,1rem)] mt-2 mb-3 rounded-full border border-border bg-surface p-1.5 shadow-[0_2px_12px_color-mix(in_srgb,var(--text)_8%,transparent)]"
    >
      <ul className="flex gap-1">
        {items.map((item) => {
          const current = isCurrent(item.href, pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full ${
                  current
                    ? "type-caption-strong bg-sand-100 text-sand-900"
                    : "type-caption text-text-secondary"
                }`}
              >
                <item.Icon size={22} strokeWidth={2} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
