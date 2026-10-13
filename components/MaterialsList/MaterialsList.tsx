"use client";

import { ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { MaterialTile } from "@/components/MaterialTile/MaterialTile";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { Tabs, tabPanelProps } from "@/components/Tabs/Tabs";
import { TrainingTags } from "@/components/TrainingTags/TrainingTags";
import { UploadButton } from "@/components/UploadSheet/UploadSheet";
import { metaLine } from "@/lib/materials";
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
    <div className="flex flex-col gap-3 rounded-card bg-card shadow-(--card-shadow) p-4">
      <Link
        href={`/materials/${material.id}`}
        className="-m-2 flex items-center gap-4 rounded-panel p-2 active:bg-surface-muted"
      >
        <MaterialTile type={material.type} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="type-body-strong break-words">{material.name}</span>
          <span className="type-small text-text-secondary">{metaLine(material)}</span>
        </span>
        <ChevronRight
          size={20}
          strokeWidth={2}
          aria-hidden="true"
          className="shrink-0 text-text-secondary"
        />
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={material.status} />
        <TrainingTags training={training} />
      </div>
      {material.status === "processing" && (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-secondary-sand"
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
          <p className="type-small text-text-secondary">{material.reason}</p>
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
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <h1 className="type-page-title">Materials</h1>
          <UploadButton onUploadStart={() => setTab("processing")} onUploadEnd={setTab} />
        </div>
        <p className="type-small text-text-secondary">
          Guides you can turn into scenarios and quizzes.
        </p>
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
            <EmptyState icon={FileText} text={emptyStates[tab]} />
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
