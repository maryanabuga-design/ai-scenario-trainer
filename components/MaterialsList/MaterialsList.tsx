"use client";

import Link from "next/link";
import { FileCover } from "@/components/FileCover/FileCover";
import { MaterialCover } from "@/components/MaterialCover/MaterialCover";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { UploadButton } from "@/components/UploadSheet/UploadSheet";
import { formatAdded } from "@/lib/materials";
import { useUploads } from "@/lib/uploads";
import type { Material } from "@/lib/materials";

function MaterialRow({ material }: { material: Material }) {
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
        {material.hasScenario && (
          <span className="text-sm text-text-secondary">Has a prepared scenario</span>
        )}
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
            <UploadButton label="Try another file" />
          </div>
        </>
      )}
    </div>
  );
}

export function MaterialsList({ samples }: { samples: Material[] }) {
  const uploads = useUploads();
  const all = [...(uploads === "loading" ? [] : (uploads ?? [])), ...samples];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl">Materials</h1>
        <UploadButton />
      </div>
      <ul className="flex flex-col gap-3">
        {all.map((material) => (
          <li key={material.id}>
            <MaterialRow material={material} />
          </li>
        ))}
      </ul>
    </div>
  );
}
