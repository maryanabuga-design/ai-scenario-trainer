"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HomeView } from "@/components/HomeView/HomeView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { systemClock } from "@/lib/daily-goal";
import { homeCounts, homeSummary, readiness } from "@/lib/home";
import { needsOnboarding, onboardingHref } from "@/lib/onboarding";
import { sampleMaterials } from "@/lib/materials";
import { usePartRecords } from "@/lib/part-progress";
import { useSaved } from "@/lib/saved";
import { useHistory, useProfile, useSession } from "@/lib/session";
import { DEMO_USER } from "@/lib/user";

const guideName =
  sampleMaterials.find((material) => material.id === "evacuation-guide")?.name ?? "";

export default function Home() {
  const router = useRouter();
  const profile = useProfile();
  const session = useSession();
  const history = useHistory();
  const saved = useSaved();
  const records = usePartRecords();
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
      readiness={readiness(history)}
      counts={homeCounts({ history, saved, guideSections: sections.length })}
      guideName={guideName}
    />
  );
}
