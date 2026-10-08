"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button/Button";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { formatSize, materialFromUpload, simulateUpload } from "@/lib/materials";
import { addUpload, updateUpload } from "@/lib/uploads";
import type { Material } from "@/lib/materials";

export type Stage =
  | { kind: "choose" }
  | { kind: "progress"; id: string; file: { name: string; size: number }; percent: number }
  | { kind: "done"; material: Material };

/** The upload sheet's content, also drawn on its own by the screen review page. */
export function UploadPanel({
  stage,
  onStage,
  onChooseFile,
  onClose,
  onOpenMaterial,
}: {
  stage: Stage;
  onStage: (stage: Stage) => void;
  onChooseFile: (file: { name: string; size: number }) => void;
  onClose: () => void;
  onOpenMaterial: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <h2 id="upload-title" className="font-serif text-xl">
            Upload a file
          </h2>
          <p className="text-sm text-text-secondary">
            Upload is simulated for this prototype. Nothing is read or sent.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mt-2 -mr-2 min-h-11 min-w-11 rounded-full px-3 text-base text-text underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          Close
        </button>
      </div>

      {stage.kind === "choose" && (
        <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-border-strong bg-surface-muted px-4 py-8 text-center">
          <p>Choose a PDF, a Word document or a text file, up to 20 MB.</p>
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-text bg-surface px-5 font-medium hover:bg-surface-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
            <input
              type="file"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onChooseFile({ name: file.name, size: file.size });
              }}
            />
            Choose a file
          </label>
        </div>
      )}

      {stage.kind === "progress" && (
        <div className="flex flex-col gap-3" role="status" aria-live="polite">
          <p className="font-medium break-all">{stage.file.name}</p>
          <p className="text-sm text-text-secondary">
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
          <p className="text-sm tabular-nums">{stage.percent}%</p>
        </div>
      )}

      {stage.kind === "done" && (
        <div className="flex flex-col gap-4" role="status" aria-live="polite">
          <div className="flex flex-col gap-2">
            <p className="font-medium break-all">{stage.material.name}</p>
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
              <p className="text-text-secondary">
                The file is in your materials. In this prototype a scenario is prepared for the
                sample guide only.
              </p>
              <Button onClick={() => onOpenMaterial(stage.material.id)}>Open material</Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const STEP_MS = 120;

/**
 * A button that opens the simulated upload sheet. Only the chosen file's name and size are used;
 * its content is never read or sent anywhere.
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
      const result = materialFromUpload(stage.file, simulateUpload(stage.file), new Date());
      const material = { ...result, id: stage.id };
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
          onChooseFile={(file) => {
            const material: Material = {
              ...materialFromUpload(file, simulateUpload(file), new Date()),
              status: "processing",
              progress: 0,
              reason: undefined,
            };
            addUpload(material);
            setStage({ kind: "progress", id: material.id, file, percent: 0 });
            onUploadStart?.();
          }}
          onClose={() => dialogRef.current?.close()}
          onOpenMaterial={(id) => {
            dialogRef.current?.close();
            router.push(`/materials/${id}`);
          }}
        />
      </dialog>
    </>
  );
}
