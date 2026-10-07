"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export type SourceSection = {
  id: string;
  title: string;
  lines: string[];
};

const SourceSheetContext = createContext<((section: SourceSection) => void) | null>(null);

export function useSourceSheet() {
  const open = useContext(SourceSheetContext);
  if (!open) throw new Error("useSourceSheet must be used inside SourceSheetProvider");
  return open;
}

export function SourceSheetProvider({ children }: { children: ReactNode }) {
  const [section, setSection] = useState<SourceSection | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (section && dialog && !dialog.open) dialog.showModal();
  }, [section]);

  return (
    <SourceSheetContext.Provider value={setSection}>
      {children}
      <dialog
        ref={dialogRef}
        data-sheet
        aria-labelledby="source-sheet-title"
        onClose={() => setSection(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-[80dvh] w-full max-w-app overflow-y-auto rounded-t-card bg-surface text-text"
      >
        {section && (
          <div className="flex flex-col gap-4 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-start justify-between gap-4">
              <h2 id="source-sheet-title" className="font-serif text-xl">
                {section.id}. {section.title}
              </h2>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="-mt-2 -mr-2 min-h-11 min-w-11 rounded-full px-3 text-base text-text hover:underline"
              >
                Close
              </button>
            </div>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-base">
              {section.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </dialog>
    </SourceSheetContext.Provider>
  );
}
