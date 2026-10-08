"use client";

import { useParams } from "next/navigation";
import { ButtonLink } from "@/components/Button/Button";
import { MaterialView } from "@/components/MaterialView/MaterialView";
import { sampleMaterials } from "@/lib/materials";
import { useUploads } from "@/lib/uploads";

export default function OtherMaterialPage() {
  const { id } = useParams<{ id: string }>();
  const uploads = useUploads();
  if (uploads === "loading") return null;

  const material = [...(uploads ?? []), ...sampleMaterials].find(
    (candidate) => candidate.id === id,
  );

  if (!material) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="font-serif text-2xl">Material not found</h1>
        <p className="text-text-secondary">It may have been uploaded in another browser.</p>
        <ButtonLink href="/materials" variant="secondary">
          Go to Materials
        </ButtonLink>
      </div>
    );
  }

  return (
    <MaterialView material={material} sections={material.sections ?? []} sectionsOpenable={false} />
  );
}
