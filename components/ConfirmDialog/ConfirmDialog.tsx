"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/Button/Button";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  /** The label of the other action (default Cancel). */
  cancelLabel?: string;
  /** Which action is the Primary button; the other is a Secondary button. */
  emphasis?: "confirm" | "cancel";
  onConfirm: () => void;
  onCancel: () => void;
  /** Only for the screen review page: draw the dialog over its nearest positioned frame instead of the page. */
  inline?: boolean;
};

function DialogCard({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  emphasis = "confirm",
  onConfirm,
  onCancel,
}: Omit<Props, "open" | "inline">) {
  return (
    <div className="flex flex-col gap-4 rounded-card bg-surface p-6">
      <h2 id="confirm-title" className="type-card-title">
        {title}
      </h2>
      <p className="text-text-secondary">{description}</p>
      <div className="flex flex-col gap-3">
        {emphasis === "confirm" ? (
          <>
            <Button onClick={onConfirm}>{confirmLabel}</Button>
            <Button variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onCancel}>{cancelLabel}</Button>
            <Button variant="secondary" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/** A modal confirmation: title, one sentence, a Primary action and a Secondary one. */
export function ConfirmDialog({ open, inline = false, ...card }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || inline) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open, inline]);

  if (inline) {
    return (
      <div className="scrim absolute inset-0 z-20 flex items-center p-4">
        <div className="w-full">
          <DialogCard {...card} />
        </div>
      </div>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      data-sheet
      aria-labelledby="confirm-title"
      onClose={card.onCancel}
      className="fixed inset-x-4 top-1/3 m-0 mx-auto w-auto max-w-[398px] bg-transparent p-0 text-text"
    >
      <DialogCard {...card} />
    </dialog>
  );
}
