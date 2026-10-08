"use client";

import Link from "next/link";
import { useState } from "react";
import { FileCover } from "@/components/FileCover/FileCover";
import { MaterialCover } from "@/components/MaterialCover/MaterialCover";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { Tabs, tabPanelProps } from "@/components/Tabs/Tabs";
import { TrainingTags } from "@/components/TrainingTags/TrainingTags";
import { UploadButton } from "@/components/UploadSheet/UploadSheet";
import { formatAdded } from "@/lib/materials";
import type { Training } from "@/lib/training";
import { useTrainings } from "@/lib/trainings";
import { useUploads } from "@/lib/uploads";
import type { Material } from "@/lib/materials";

function MaterialRow({
  material,
  training,
  onUploadStart,
  onUploadEnd,
}: {
  material: Material;
  training: Training | undefined;
  onUploadStart: () => void;
  onUploadEnd: (status: "ready" | "failed") => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-card bg-surface p-4">
      <Link href={`/materials/${material.id}`} className="flex items-center gap-4 hover:underline">
        {material.hasScenario ? <MaterialCover /> : <FileCover type={material.type} />}
        <span className="flex min-w-0 flex-col gap-1">
          <span className="leading-tight font-medium break-words">{material.name}</span>
          <span className="text-sm text-text-secondary">
            {material.type} · {material.size} · {formatAdded(material.added)}
          </span>
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={material.status} />
        <TrainingTags training={training} />
      </div>
      {material.status === "processing" && (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
          role="progressbar"
          aria-label={`${material.name} processing`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={material.progress ?? 0}
        >
          <div
            className="h-full bg-text-secondary"
            style={{ width: `${material.progress ?? 0}%` }}
          />
        </div>
      )}
      {material.status === "failed" && (
        <>
          <p className="text-sm text-text-secondary">{material.reason}</p>
          <div>
            <UploadButton
              label="Try another file"
              onUploadStart={onUploadStart}
              onUploadEnd={onUploadEnd}
            />
          </div>
        </>
      )}
    </div>
  );
}

type TabId = "ready" | "processing" | "failed";

const emptyStates: Record<TabId, string> = {
  ready: "No ready materials yet. Upload a file to add one.",
  processing: "Nothing is processing right now.",
  failed: "No failed uploads.",
};

export function MaterialsList({ samples }: { samples: Material[] }) {
  const uploads = useUploads();
  const trainings = useTrainings();
  const [tab, setTab] = useState<TabId>("ready");
  const all = [...(uploads === "loading" ? [] : (uploads ?? [])), ...samples];
  const count = (status: TabId) => all.filter((material) => material.status === status).length;
  const shown = all.filter((material) => material.status === tab);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl">Materials</h1>
        <UploadButton onUploadStart={() => setTab("processing")} onUploadEnd={setTab} />
      </div>
      <div className="flex flex-col gap-4">
        <Tabs
          idPrefix="materials"
          label="Materials by status"
          tabs={[
            { id: "ready", label: "Ready" },
            { id: "processing", label: "Processing", count: count("processing") },
            { id: "failed", label: "Failed", count: count("failed") },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div {...tabPanelProps("materials", tab)}>
          {shown.length === 0 ? (
            <p className="py-4 text-text-secondary">{emptyStates[tab]}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {shown.map((material) => (
                <li key={material.id}>
                  <MaterialRow
                    material={material}
                    training={trainings === "loading" ? undefined : trainings?.[material.id]}
                    onUploadStart={() => setTab("processing")}
                    onUploadEnd={setTab}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
