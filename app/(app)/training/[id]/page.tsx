"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { initialChoice, TrainingCreate } from "@/components/TrainingCreate/TrainingCreate";
import type { TrainingChoice } from "@/lib/training";
import { sampleMaterials } from "@/lib/materials";
import { setPendingTraining, usePendingTraining } from "@/lib/trainings";
import { useMaterial } from "@/lib/uploads";
import type { Material } from "@/lib/materials";
import { MaterialNotFound } from "@/components/MaterialNotFound/MaterialNotFound";

function Create({ material, start }: { material: Material; start: TrainingChoice }) {
  const router = useRouter();
  const [choice, setChoice] = useState(start);
  return (
    <TrainingCreate
      material={material}
      choice={choice}
      onChange={setChoice}
      onGenerate={() => {
        setPendingTraining(material.id, choice);
        router.push(`/training/${material.id}/generating`);
      }}
    />
  );
}

export default function CreateTrainingPage() {
  const { id } = useParams<{ id: string }>();
  const material = useMaterial(id, sampleMaterials);
  const pending = usePendingTraining();
  if (material === "loading" || pending === "loading") return null;
  if (!material) return <MaterialNotFound />;
  // After Cancel on the generating screen, start from the choice that was being generated.
  const start = pending && pending.materialId === id ? pending : initialChoice(material);
  return <Create material={material} start={start} />;
}
