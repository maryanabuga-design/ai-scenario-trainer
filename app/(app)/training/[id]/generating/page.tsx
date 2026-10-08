"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  generationSteps,
  TrainingGenerating,
} from "@/components/TrainingGenerating/TrainingGenerating";
import { sampleMaterials } from "@/lib/materials";
import { createTraining, planTraining } from "@/lib/training";
import { clearPendingTraining, saveTraining, usePendingTraining } from "@/lib/trainings";
import { useMaterial } from "@/lib/uploads";

const STEP_MS = 1000;
const TICK_MS = 100;

export default function GeneratingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const material = useMaterial(id, sampleMaterials);
  const pending = usePendingTraining();
  const [elapsed, setElapsed] = useState(0);
  // Set once the training is saved, so clearing the pending choice does not send us back.
  const finished = useRef(false);

  const ready = material !== "loading" && pending !== "loading";
  const valid = ready && material !== null && pending !== null && pending.materialId === id;
  const steps = generationSteps(valid ? pending.scenario : true);
  const timed = steps.filter((step) => !step.skipped).length;
  const total = timed * STEP_MS;

  useEffect(() => {
    if (ready && !valid && !finished.current) router.replace(`/training/${id}`);
  }, [ready, valid, router, id]);

  useEffect(() => {
    if (!valid) return;
    if (elapsed < total) {
      const timer = setTimeout(() => setElapsed(elapsed + TICK_MS), TICK_MS);
      return () => clearTimeout(timer);
    }
    const training = createTraining(id, planTraining(material), pending, Date.now());
    finished.current = true;
    saveTraining(training);
    clearPendingTraining();
    router.replace(`/training/${id}/review`);
  }, [valid, elapsed, total, id, material, pending, router]);

  if (!valid) return null;

  // The step being worked on, counting only the steps that take time.
  const timedIndexes = steps.flatMap((step, index) => (step.skipped ? [] : [index]));
  const active = timedIndexes[Math.floor(elapsed / STEP_MS)] ?? steps.length;

  return (
    <TrainingGenerating
      steps={steps}
      active={active}
      percent={Math.min(100, Math.round((elapsed / total) * 100))}
      onCancel={() => router.replace(`/training/${id}`)}
    />
  );
}
