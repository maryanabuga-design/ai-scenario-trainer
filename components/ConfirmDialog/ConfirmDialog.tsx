"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/Button/Button";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Only for the screen review page: draw the dialog card in place, without the overlay. */
  inline?: boolean;
};

function DialogCard({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: Omit<Props, "open" | "inline">) {
  return (
    <div className="flex flex-col gap-4 rounded-card bg-surface p-6">
      <h2 id="confirm-title" className="font-serif text-xl">
        {title}
      </h2>
      <p className="text-text-secondary">{description}</p>
      <div className="flex flex-col items-center gap-2">
        <Button onClick={onConfirm}>{confirmLabel}</Button>
        <Button variant="text" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/** A modal confirmation: title, one sentence, a black confirm pill and a text cancel. */
export function ConfirmDialog({ open, inline = false, ...card }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || inline) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open, inline]);

  if (inline) return <DialogCard {...card} />;

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
