"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HomeView } from "@/components/HomeView/HomeView";
import { homeCounts, homeSummary } from "@/lib/home";
import { needsOnboarding, onboardingHref } from "@/lib/onboarding";
import { useSaved } from "@/lib/saved";
import { useHistory, useProfile, useSession } from "@/lib/session";
import { useCurrentAccount } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const profile = useProfile();
  const session = useSession();
  const history = useHistory();
  const saved = useSaved();
  const account = useCurrentAccount();
  const showOnboarding = profile !== "loading" && needsOnboarding(profile);

  useEffect(() => {
    if (showOnboarding) router.replace(onboardingHref);
  }, [showOnboarding, router]);

  if (
    profile === "loading" ||
    session === "loading" ||
    history === "loading" ||
    saved === "loading" ||
    account === "loading" ||
    account === null ||
    showOnboarding
  ) {
    return null;
  }

  const unfinished = session && !session.finished ? session : null;

  return (
    <HomeView
      name={account.name}
      summary={homeSummary({ unfinished, history })}
      counts={homeCounts({ history, saved })}
    />
  );
}
