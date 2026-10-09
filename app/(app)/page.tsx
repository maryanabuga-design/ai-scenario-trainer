"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HomeView } from "@/components/HomeView/HomeView";
import { directionTitle } from "@/lib/directions";
import { weakItemsFromHistory } from "@/lib/progress";
import { repeatItems } from "@/lib/weak-topics";
import { startRepeatRound, useHistory, useProfile, useSession } from "@/lib/session";

export default function Home() {
  const router = useRouter();
  const profile = useProfile();
  const session = useSession();
  const history = useHistory();
  const needsOnboarding = profile !== "loading" && !profile?.onboarded;

  useEffect(() => {
    if (needsOnboarding) router.replace("/onboarding");
  }, [needsOnboarding, router]);

  if (profile === "loading" || session === "loading" || history === "loading" || needsOnboarding) {
    return null;
  }

  return (
    <HomeView
      directionTitle={directionTitle(profile?.direction)}
      unfinished={session && !session.finished ? session : null}
      weakItems={weakItemsFromHistory(history)}
      onRepeat={(topics) => {
        startRepeatRound(
          repeatItems(topics),
          topics.map((topic) => topic.sectionId),
        );
        router.push("/session");
      }}
    />
  );
}
