"use client";

import { useParams } from "next/navigation";
import { MaterialNotFound } from "@/components/MaterialNotFound/MaterialNotFound";
import { MaterialView } from "@/components/MaterialView/MaterialView";
import { sampleMaterials } from "@/lib/materials";
import { useMaterial } from "@/lib/uploads";

export default function OtherMaterialPage() {
  const { id } = useParams<{ id: string }>();
  const material = useMaterial(id, sampleMaterials);
  if (material === "loading") return null;
  if (!material) return <MaterialNotFound />;

  return (
    <MaterialView material={material} sections={material.sections ?? []} sectionsOpenable={false} />
  );
}
