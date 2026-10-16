"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { TrainingView } from "@/components/TrainingView/TrainingView";
import type { TrainingTopic } from "@/components/TrainingView/TrainingView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { sampleMaterials } from "@/lib/materials";
import {
  modeStats,
  partState,
  recommendedPart,
  saveTrainingMode,
  usePartRecords,
  useTrainingMode,
  weakCount,
} from "@/lib/part-progress";
import { partsFor, sectionsWithParts } from "@/lib/parts";
import type { Part, TrainingMode } from "@/lib/parts";
import { scenario } from "@/lib/scenario";
import { sessionLabel, startSession, useHistory, useSession } from "@/lib/session";

const guideName =
  sampleMaterials.find((material) => material.id === "evacuation-guide")?.name ?? "";

function Training({ initial }: { initial: TrainingMode }) {
  const router = useRouter();
  const { sections } = useSourceSheet();
  const history = useHistory();
  const records = usePartRecords();
  const session = useSession();
  const [mode, setMode] = useState<TrainingMode>(initial);

  // A mode from the link (the Home tiles) is remembered like one chosen here.
  useEffect(() => saveTrainingMode(initial), [initial]);

  const ready = history !== "loading" && records !== "loading" && session !== "loading";

  if (!ready) return null;
  const unfinished = session && !session.finished ? session : null;
  const parts = partsFor(mode);

  const topics: TrainingTopic[] = sectionsWithParts(mode).map((sectionId) => {
    const own = parts.filter((part) => part.sectionId === sectionId);
    const next = recommendedPart(own, records, unfinished);
    return {
      sectionId,
      title: sections.find((section) => section.id === sectionId)?.title ?? sectionId,
      toRepeat: weakCount(history, mode, sectionId),
      parts: own.map((part) => ({
        part,
        state: partState(part, records, unfinished),
        recommended: next?.id === part.id,
      })),
    };
  });

  function start(part: Part) {
    // The same unfinished part is resumed, not started again.
    if (!(unfinished && unfinished.partId === part.id)) {
      startSession(part.mode, part.itemIds, {
        scenarioId: part.mode === "scenario" ? scenario.id : undefined,
        partId: part.id,
        returnTo: `/training?mode=${part.mode}`,
      });
    }
    router.push("/session");
  }

  return (
    <TrainingView
      guideName={guideName}
      mode={mode}
      onModeChange={(next) => {
        setMode(next);
        saveTrainingMode(next);
      }}
      stats={modeStats(history, mode)}
      topics={topics}
      records={records}
      onStartPart={start}
      resume={
        unfinished
          ? `${sessionLabel(unfinished)} · Question ${unfinished.index + 1} of ${unfinished.itemIds.length}`
          : undefined
      }
    />
  );
}

function TrainingGate() {
  const params = useSearchParams();
  const param = params.get("mode");
  const remembered = useTrainingMode();
  if (remembered === "loading") return null;
  const initial: TrainingMode =
    param === "scenario" || param === "quiz" ? param : (remembered ?? "scenario");
  return <Training key={initial} initial={initial} />;
}

export default function TrainingPage() {
  return (
    <Suspense fallback={null}>
      <TrainingGate />
    </Suspense>
  );
}
