"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  defaultSetup,
  fitSetup,
  quizSize,
  SessionSetup,
} from "@/components/SessionSetup/SessionSetup";
import type { SetupValue } from "@/components/SessionSetup/SessionSetup";
import { pickQuestions } from "@/lib/quiz";
import { getScenario } from "@/lib/scenario";
import { startQuiz, startSession, useSession } from "@/lib/session";
import type { Training } from "@/lib/training";
import { sampleMaterials } from "@/lib/materials";
import { useActiveTraining, useTrainings } from "@/lib/trainings";
import { useMaterial } from "@/lib/uploads";

function Setup({
  training,
  materialName,
  scenarioId,
}: {
  training: Training | undefined;
  materialName: string | undefined;
  scenarioId: string | undefined;
}) {
  const router = useRouter();
  const session = useSession();
  const scenarioDef = getScenario(scenarioId);
  const [value, setValue] = useState<SetupValue>(() =>
    fitSetup({
      ...defaultSetup,
      length: scenarioDef.defaultLength,
      ...(training
        ? { mode: training.scenario ? "scenario" : "quiz", sections: training.sections }
        : {}),
    }),
  );

  return (
    <SessionSetup
      value={value}
      onChange={setValue}
      training={training}
      materialName={materialName}
      scenarioDef={scenarioDef}
      replacesUnfinished={session !== "loading" && session !== null && !session.finished}
      onStart={() => {
        if (value.mode === "quiz") {
          startQuiz(pickQuestions(value.sections, quizSize(value).size), value.sections);
        } else {
          startSession(
            value.length,
            [...(scenarioDef.lengths[value.length]?.stepIds ?? [])],
            scenarioDef.id,
          );
        }
        router.push("/session");
      }}
    />
  );
}

export default function SetupPage() {
  const trainings = useTrainings();
  const active = useActiveTraining();
  const material = useMaterial(active === "loading" ? "" : (active ?? ""), sampleMaterials);
  if (trainings === "loading" || active === "loading" || material === "loading") return null;
  const training = active ? trainings?.[active] : undefined;
  return (
    <Setup
      key={training?.materialId ?? "none"}
      training={training}
      materialName={training && material ? material.name : undefined}
      scenarioId={training && material ? material.scenarioId : undefined}
    />
  );
}
