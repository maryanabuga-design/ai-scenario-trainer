"use client";

import { ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { HeaderRow } from "@/components/HeaderRow/HeaderRow";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { MaterialTile } from "@/components/MaterialTile/MaterialTile";
import { StatusChip } from "@/components/StatusChip/StatusChip";
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
    // The whole card is one link (stretched over the card); the chevron sits in the middle of its
    // right side. "Try another file" stays its own button above the link.
    <div className="relative flex items-center gap-2 rounded-card bg-card p-4 shadow-(--card-shadow) has-[a:active]:bg-surface-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Link
          href={`/materials/${material.id}`}
          className="flex items-center gap-4 outline-none after:absolute after:inset-0 after:rounded-card after:content-['']"
        >
          <MaterialTile type={material.type} />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="type-body-strong break-words">{material.name}</span>
            <span className="type-small text-text-secondary">{metaLine(material)}</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={material.status} />
          <TrainingTags training={training} />
        </div>
        {material.status === "processing" && (
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-secondary-sand-pressed"
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
            <div className="relative z-10">
              <UploadButton
                label="Try another file"
                onUploadStart={onUploadStart}
                onUploadEnd={onUploadEnd}
              />
            </div>
          </>
        )}
      </div>
      <span
        aria-hidden="true"
        className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-primary"
      >
        <ChevronRight size={20} strokeWidth={2} />
      </span>
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
      <HeaderRow
        title={<h1 className="type-page-title">Materials</h1>}
        action={<UploadButton onUploadStart={() => setTab("processing")} onUploadEnd={setTab} />}
        subtitle={
          <p className="type-small text-text-secondary">
            Guides you can turn into scenarios
            <br />
            and quizzes.
          </p>
        }
      />
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
