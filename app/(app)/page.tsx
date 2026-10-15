"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HomeView } from "@/components/HomeView/HomeView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { directionTitle } from "@/lib/directions";
import { homeCounts, readiness } from "@/lib/home";
import { needsOnboarding, onboardingHref } from "@/lib/onboarding";
import { useSaved } from "@/lib/saved";
import { useHistory, useProfile, useSession } from "@/lib/session";

export default function Home() {
  const router = useRouter();
  const profile = useProfile();
  const session = useSession();
  const history = useHistory();
  const saved = useSaved();
  const { sections } = useSourceSheet();
  const showOnboarding = profile !== "loading" && needsOnboarding(profile);

  useEffect(() => {
    if (showOnboarding) router.replace(onboardingHref);
  }, [showOnboarding, router]);

  if (
    profile === "loading" ||
    session === "loading" ||
    history === "loading" ||
    saved === "loading" ||
    showOnboarding
  ) {
    return null;
  }

  const unfinished = session && !session.finished ? session : null;

  return (
    <HomeView
      directionTitle={directionTitle(profile?.direction)}
      unfinished={unfinished}
      readiness={readiness(history)}
      counts={homeCounts({ history, saved, guideSections: sections.length })}
    />
  );
}
