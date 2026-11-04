import { instructorItems } from "@/components/BottomNav/BottomNav";

/** The shared routes an instructor also opens (the shell follows the stored role there). */
const SHARED_PREFIXES = ["/profile", "/notifications", "/about"];

export type ShellKind = "instructor" | "student";

/**
 * Which shell a screen is drawn in. Everything under /instructor is the instructor's; the shared
 * routes follow the stored role (nothing is guessed before it is read: the phone layout).
 */
export function shellKindOf(
  pathname: string,
  role: "instructor" | "student" | "loading",
): ShellKind {
  if (pathname === "/instructor" || pathname.startsWith("/instructor/")) return "instructor";
  const shared = SHARED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return shared && role === "instructor" ? "instructor" : "student";
}

export const sideNavItems = instructorItems;
