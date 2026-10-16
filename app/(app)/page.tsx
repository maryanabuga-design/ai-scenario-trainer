"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HomeView } from "@/components/HomeView/HomeView";
import { systemClock } from "@/lib/daily-goal";
import { homeCounts, homeSummary } from "@/lib/home";
import { needsOnboarding, onboardingHref } from "@/lib/onboarding";
import { usePartRecords } from "@/lib/part-progress";
import { useSaved } from "@/lib/saved";
import { useHistory, useProfile, useSession } from "@/lib/session";
import { DEMO_USER } from "@/lib/user";

export default function Home() {
  const router = useRouter();
  const profile = useProfile();
  const session = useSession();
  const history = useHistory();
  const saved = useSaved();
  const records = usePartRecords();
  const showOnboarding = profile !== "loading" && needsOnboarding(profile);

  useEffect(() => {
    if (showOnboarding) router.replace(onboardingHref);
  }, [showOnboarding, router]);

  if (
    profile === "loading" ||
    session === "loading" ||
    history === "loading" ||
    saved === "loading" ||
    records === "loading" ||
    showOnboarding
  ) {
    return null;
  }

  const unfinished = session && !session.finished ? session : null;

  return (
    <HomeView
      name={DEMO_USER.name}
      summary={homeSummary({
        unfinished,
        history,
        records,
        now: systemClock(),
      })}
      counts={homeCounts({ history, saved })}
    />
  );
}
