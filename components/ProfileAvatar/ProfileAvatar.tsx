"use client";

import Link from "next/link";
import { useCurrentAccount } from "@/lib/auth";
import { initialOf } from "@/lib/user";

/**
 * The avatar button at the top right of a tab's header band (DESIGN.md: Ask AI, Avatar button): a 40px
 * sand circle with the person's initial inside a 44px tap area. It opens Profile.
 */
export function ProfileAvatar() {
  const account = useCurrentAccount();
  const initial = account && account !== "loading" ? initialOf(account.name) : "";
  return (
    <Link
      href="/profile"
      aria-label="Profile"
      data-avatar
      className="-m-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full has-focus-visible:outline-2"
    >
      <span
        aria-hidden="true"
        className="type-body-strong flex h-10 w-10 items-center justify-center rounded-full bg-sand-200 text-sand-900"
      >
        {initial}
      </span>
    </Link>
  );
}
