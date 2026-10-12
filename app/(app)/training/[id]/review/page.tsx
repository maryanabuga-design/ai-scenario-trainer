"use client";

import { useParams, useRouter } from "next/navigation";
import { ButtonLink } from "@/components/Button/Button";
import { TrainingReview } from "@/components/TrainingReview/TrainingReview";
import { sampleMaterials } from "@/lib/materials";
import { startTraining, useTrainings } from "@/lib/trainings";
import { useMaterial } from "@/lib/uploads";
import { MaterialNotFound } from "@/components/MaterialNotFound/MaterialNotFound";

export default function ReviewTrainingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const material = useMaterial(id, sampleMaterials);
  const trainings = useTrainings();
  if (material === "loading" || trainings === "loading") return null;
  if (!material) return <MaterialNotFound />;

  const training = trainings?.[id];
  if (!training) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="font-semibold text-2xl">No training yet</h1>
        <p className="text-text-secondary">Create training from this material first.</p>
        <ButtonLink href={`/training/${id}`} variant="secondary">
          Create training
        </ButtonLink>
      </div>
    );
  }

  return (
    <TrainingReview
      material={material}
      training={training}
      onStart={() => {
        startTraining(id);
        router.push("/session/setup");
      }}
    />
  );
}
