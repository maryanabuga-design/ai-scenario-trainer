"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { SessionSetup, defaultSetup, setupChoice } from "@/components/SessionSetup/SessionSetup";
import type { SetupValue } from "@/components/SessionSetup/SessionSetup";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { sampleMaterials } from "@/lib/materials";
import { guidePracticed, guideStats } from "@/lib/progress-stats";
import { weakItemsFromHistory } from "@/lib/progress";
import { getScenario } from "@/lib/scenario";
import { defaultSections } from "@/lib/sections";
import { startSession, useHistory, useSession } from "@/lib/session";
import { buildSession } from "@/lib/setup";
import type { Training } from "@/lib/training";
import { useActiveTraining, useTrainings } from "@/lib/trainings";
import { useMaterial } from "@/lib/uploads";
import { weakTopics } from "@/lib/weak-topics";
import type { FinishedSession } from "@/lib/session";

function Setup({
  training,
  materialName,
  scenarioId,
  history,
  initialMode,
}: {
  training: Training | undefined;
  materialName: string | undefined;
  scenarioId: string | undefined;
  history: FinishedSession[];
  /** From the Scenarios or Quiz tile on Home, when no training limits the modes. */
  initialMode?: "scenario" | "quiz";
}) {
  const router = useRouter();
  const session = useSession();
  const scenarioDef = getScenario(scenarioId);
  const { sections: allSections } = useSourceSheet();
  // The guide's sections: the training's, or every section of the guide the scenario belongs to.
  const prefix = scenarioDef.steps[0].section[0];
  const guideSectionIds =
    training?.sections ?? allSections.map((s) => s.id).filter((id) => id.startsWith(prefix));
  const weakSectionIds = weakTopics(weakItemsFromHistory(history))
    .map((topic) => topic.sectionId)
    .filter((id) => guideSectionIds.includes(id));
  const [value, setValue] = useState<SetupValue>(() => ({
    ...defaultSetup,
    sections: defaultSections(guideSectionIds, training?.sections),
    ...(training
      ? { mode: training.scenario ? "scenario" : "quiz" }
      : initialMode
        ? { mode: initialMode }
        : {}),
  }));

  return (
    <SessionSetup
      value={value}
      onChange={setValue}
      training={training}
      materialName={materialName ?? scenarioDef.title}
      scenarioId={scenarioDef.id}
      guideSectionIds={guideSectionIds}
      stats={guideStats(history, guideSectionIds)}
      practised={guidePracticed(history, guideSectionIds)}
      weakSectionIds={weakSectionIds}
      replacesUnfinished={session !== "loading" && session !== null && !session.finished}
      onStart={() => {
        const choice = setupChoice(value, scenarioDef.id, weakSectionIds);
        const built = buildSession(choice);
        startSession(built.kind, built.itemIds, built.scenarioId);
        router.push("/session");
      }}
    />
  );
}

function SetupGate() {
  const modeParam = useSearchParams().get("mode");
  const initialMode = modeParam === "quiz" || modeParam === "scenario" ? modeParam : undefined;
  const trainings = useTrainings();
  const active = useActiveTraining();
  const history = useHistory();
  const material = useMaterial(active === "loading" ? "" : (active ?? ""), sampleMaterials);
  if (
    trainings === "loading" ||
    active === "loading" ||
    material === "loading" ||
    history === "loading"
  ) {
    return null;
  }
  const training = active ? trainings?.[active] : undefined;
  return (
    <Setup
      key={`${training?.materialId ?? "none"}-${initialMode ?? "any"}`}
      training={training}
      materialName={training && material ? material.name : undefined}
      scenarioId={training && material ? material.scenarioId : undefined}
      history={history ?? []}
      initialMode={initialMode}
    />
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <SetupGate />
    </Suspense>
  );
}
