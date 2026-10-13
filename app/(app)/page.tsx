"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HomeView } from "@/components/HomeView/HomeView";
import { directionTitle } from "@/lib/directions";
import { homeScenarios, repeatUnderWay, scenarioLines, scenarioTitle } from "@/lib/home";
import type { Material } from "@/lib/materials";
import { needsOnboarding, onboardingHref } from "@/lib/onboarding";
import { sampleMaterials } from "@/lib/materials";
import { weakItemsFromHistory } from "@/lib/progress";
import { getScenario } from "@/lib/scenario";
import { startRepeatRound, useHistory, useProfile, useSession } from "@/lib/session";
import { startTraining, useTrainings } from "@/lib/trainings";
import { useUploads } from "@/lib/uploads";
import { repeatItems } from "@/lib/weak-topics";

export default function Home() {
  const router = useRouter();
  const profile = useProfile();
  const session = useSession();
  const history = useHistory();
  const uploads = useUploads();
  const trainings = useTrainings();
  const showOnboarding = profile !== "loading" && needsOnboarding(profile);

  useEffect(() => {
    if (showOnboarding) router.replace(onboardingHref);
  }, [showOnboarding, router]);

  if (
    profile === "loading" ||
    session === "loading" ||
    history === "loading" ||
    uploads === "loading" ||
    trainings === "loading" ||
    showOnboarding
  ) {
    return null;
  }

  const unfinished = session && !session.finished ? session : null;
  const created = trainings ?? {};

  /** Session setup for a material: the sample guide always, an upload once its training exists. */
  function openScenario(material: Material) {
    if (sampleMaterials.some((sample) => sample.id === material.id) || created[material.id]) {
      startTraining(material.id);
      router.push("/session/setup");
    } else {
      router.push(`/training/${material.id}`);
    }
  }

  const materials = homeScenarios([...sampleMaterials, ...(uploads ?? [])]);

  return (
    <HomeView
      directionTitle={directionTitle(profile?.direction)}
      unfinished={unfinished}
      weakItems={weakItemsFromHistory(history)}
      hasHistory={(history ?? []).length > 0}
      scenarios={materials.map((material) => ({
        id: material.id,
        title: scenarioTitle(material),
        lines: scenarioLines(getScenario(material.scenarioId)),
        onOpen: () => openScenario(material),
      }))}
      onRepeat={(topics) => {
        // A card for the topic whose repeat round is under way resumes it.
        if (!(topics.length === 1 && repeatUnderWay(topics[0], unfinished))) {
          startRepeatRound(
            repeatItems(topics),
            topics.map((topic) => topic.sectionId),
          );
        }
        router.push("/session");
      }}
      onStartScenario={() => openScenario(materials[0] ?? sampleMaterials[0])}
    />
  );
}
