"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { HeaderRow } from "@/components/HeaderRow/HeaderRow";
import { Button } from "@/components/Button/Button";
import type { GuideSection } from "@/lib/guide";

type SourceSheetContextValue = {
  sections: GuideSection[];
  open: (sectionId: string) => void;
};

const SourceSheetContext = createContext<SourceSheetContextValue | null>(null);

export function useSourceSheet() {
  const context = useContext(SourceSheetContext);
  if (!context) throw new Error("useSourceSheet must be used inside SourceSheetProvider");
  return context;
}

export function SourceSheetProvider({
  sections,
  children,
}: {
  sections: GuideSection[];
  children: ReactNode;
}) {
  const [sectionId, setSectionId] = useState<string | null>(null);
  const section = sections.find((candidate) => candidate.id === sectionId) ?? null;
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (section && dialog && !dialog.open) dialog.showModal();
  }, [section]);

  return (
    <SourceSheetContext.Provider value={{ sections, open: setSectionId }}>
      {children}
      <dialog
        ref={dialogRef}
        data-sheet
        aria-labelledby="source-sheet-title"
        onClose={() => setSectionId(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-[80dvh] w-full max-w-app overflow-y-auto rounded-t-card bg-surface text-text"
      >
        {section && (
          <div className="flex flex-col gap-4 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <HeaderRow
              title={
                <h2 id="source-sheet-title" className="type-card-title">
                  {section.id}. {section.title}
                </h2>
              }
              action={
                <div className="-mr-3">
                  <Button variant="text" onClick={() => dialogRef.current?.close()}>
                    Close
                  </Button>
                </div>
              }
              subtitle={<p className="type-small text-text-secondary">Guide · {section.id}</p>}
            />
            <ul className="type-body flex list-disc flex-col gap-2 pl-5">
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
