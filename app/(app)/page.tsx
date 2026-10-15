"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HomeView } from "@/components/HomeView/HomeView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { systemClock } from "@/lib/daily-goal";
import { homeCounts, homeSummary, readiness } from "@/lib/home";
import { needsOnboarding, onboardingHref } from "@/lib/onboarding";
import { usePartRecords } from "@/lib/part-progress";
import type { Part } from "@/lib/parts";
import { useSaved } from "@/lib/saved";
import { scenario } from "@/lib/scenario";
import {
  startSession,
  useHistory,
  useProfile,
  useSession,
} from "@/lib/session";
import { DEMO_USER } from "@/lib/user";

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

  function startPart(part: Part) {
    startSession(part.mode, part.itemIds, {
      scenarioId: part.mode === "scenario" ? scenario.id : undefined,
      partId: part.id,
      returnTo: "/",
    });
    router.push("/session");
  }

  return (
    <HomeView
      name={DEMO_USER.name}
      summary={homeSummary({
        unfinished,
        history,
        records,
        sections,
        now: systemClock(),
      })}
      readiness={readiness(history)}
      counts={homeCounts({ history, saved, guideSections: sections.length })}
      onStartPart={startPart}
    />
  );
}
