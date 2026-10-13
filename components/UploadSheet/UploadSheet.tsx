"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button/Button";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { MaterialTile } from "@/components/MaterialTile/MaterialTile";
import { formatSize } from "@/lib/materials";
import { materialFromSample, sampleFiles } from "@/lib/training";
import type { SampleFile } from "@/lib/training";
import { addUpload, updateUpload } from "@/lib/uploads";
import type { Material } from "@/lib/materials";

export type Stage =
  | { kind: "choose" }
  | {
      kind: "progress";
      id: string;
      file: { name: string; size: number };
      percent: number;
      result: Material;
    }
  | { kind: "done"; material: Material };

/** The upload sheet's content, also drawn on its own by the screen review page. */
export function UploadPanel({
  stage,
  onStage,
  onChooseFile,
  onClose,
  onOpenMaterial,
  onCreateTraining,
}: {
  onCreateTraining: (id: string) => void;
  stage: Stage;
  onStage: (stage: Stage) => void;
  onChooseFile: (file: SampleFile) => void;
  onClose: () => void;
  onOpenMaterial: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <h2 id="upload-title" className="type-card-title">
            Upload a file
          </h2>
          <p className="type-small text-text-secondary">
            Upload is simulated for this prototype. Choose a sample file.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="type-body -mt-2 -mr-2 min-h-11 min-w-11 rounded-full px-3 text-text underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          Close
        </button>
      </div>

      {stage.kind === "choose" && (
        <ul className="flex flex-col gap-2" aria-label="Sample files">
          {sampleFiles.map((file) => (
            <li key={file.id}>
              <button
                type="button"
                onClick={() => onChooseFile(file)}
                className="flex w-full items-start gap-3 rounded-panel border border-border bg-surface p-3 text-left active:bg-surface-muted"
              >
                <MaterialTile type={file.name.endsWith(".jpg") ? "Image" : "PDF"} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-body-strong break-words">{file.name}</span>
                  <span className="type-small text-text-secondary">{formatSize(file.size)}</span>
                  <span className="type-small text-text-secondary">{file.summary}</span>
                </span>
                <ChevronRight
                  size={20}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="shrink-0 self-center text-text-secondary"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {stage.kind === "progress" && (
        <div className="flex flex-col gap-3" role="status" aria-live="polite">
          <p className="type-body-strong break-all">{stage.file.name}</p>
          <p className="type-small text-text-secondary">
            {formatSize(stage.file.size)} · Checking the file
          </p>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stage.percent}
            aria-label="Upload progress"
          >
            <div className="h-full bg-primary" style={{ width: `${stage.percent}%` }} />
          </div>
          <p className="type-small tabular-nums">{stage.percent}%</p>
        </div>
      )}

      {stage.kind === "done" && (
        <div className="flex flex-col gap-4" role="status" aria-live="polite">
          <div className="flex flex-col gap-2">
            <p className="type-body-strong break-all">{stage.material.name}</p>
            <StatusBadge status={stage.material.status} />
          </div>
          {stage.material.status === "failed" ? (
            <>
              <p className="text-text-secondary">{stage.material.reason}</p>
              <div>
                <Button variant="secondary" onClick={() => onStage({ kind: "choose" })}>
                  Try another file
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-text-secondary">The file is in your materials, under Ready.</p>
              <Button onClick={() => onCreateTraining(stage.material.id)}>Create training</Button>
              <Button variant="text" onClick={() => onOpenMaterial(stage.material.id)}>
                Open material
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const STEP_MS = 120;

/**
 * A button that opens the simulated upload sheet with sample files. Choosing one adds it under
 * Processing, then shows it as Ready or Failed.
 */
export function UploadButton({
  label = "Upload a file",
  variant = "secondary",
  onUploadStart,
  onUploadEnd,
}: {
  label?: string;
  variant?: "primary" | "secondary";
  /** Called when a file is chosen and appears in the list as Processing. */
  onUploadStart?: () => void;
  /** Called when the simulated processing ends, with the final status. */
  onUploadEnd?: (status: "ready" | "failed") => void;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [stage, setStage] = useState<Stage>({ kind: "choose" });

  useEffect(() => {
    if (stage.kind !== "progress") return;
    if (stage.percent < 100) {
      const timer = setTimeout(() => {
        const percent = Math.min(100, stage.percent + 5);
        updateUpload(stage.id, { progress: percent });
        setStage({ ...stage, percent });
      }, STEP_MS);
      return () => clearTimeout(timer);
    }
    // Finished: decide the simulated outcome once, save it, and show it.
    const timer = setTimeout(() => {
      const material = stage.result;
      updateUpload(stage.id, { ...material, progress: undefined });
      setStage({ kind: "done", material });
      onUploadEnd?.(material.status === "failed" ? "failed" : "ready");
    }, STEP_MS);
    return () => clearTimeout(timer);
  }, [stage, onUploadEnd]);

  function open() {
    setStage({ kind: "choose" });
    dialogRef.current?.showModal();
  }

  return (
    <>
      <Button variant={variant} onClick={open}>
        {label}
      </Button>
      <dialog
        ref={dialogRef}
        data-sheet
        aria-labelledby="upload-title"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-[85dvh] w-full max-w-app overflow-y-auto rounded-t-card bg-surface p-0 text-text"
      >
        <UploadPanel
          stage={stage}
          onStage={setStage}
          onChooseFile={(sample) => {
            const result = materialFromSample(sample, new Date());
            addUpload({ ...result, status: "processing", progress: 0, reason: undefined });
            setStage({
              kind: "progress",
              id: result.id,
              file: { name: sample.name, size: sample.size },
              percent: 0,
              result,
            });
            onUploadStart?.();
          }}
          onClose={() => dialogRef.current?.close()}
          onOpenMaterial={(id) => {
            dialogRef.current?.close();
            router.push(`/materials/${id}`);
          }}
          onCreateTraining={(id) => {
            dialogRef.current?.close();
            router.push(`/training/${id}`);
          }}
        />
      </dialog>
    </>
  );
}
