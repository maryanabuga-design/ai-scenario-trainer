import type { Ref } from "react";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import type { ErrorType } from "@/lib/scoring";

export type Result = "correct" | "wrong" | "partial";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span className="text-sm text-text-secondary">{label}</span>
      {children}
    </>
  );
}

/**
 * The status of one answer as two key-value rows: "Result" and "Error type", label on the left
 * and the chip on the right. Without a confidence rating only "Result" is shown. As the title of
 * the answer sheet, the Result row is the heading that takes focus.
 */
export function StatusRows({
  result,
  errorType,
  titleId,
  titleRef,
}: {
  result: Result;
  errorType: ErrorType | null;
  /** Given in the answer sheet: the Result row becomes the sheet's heading. */
  titleId?: string;
  titleRef?: Ref<HTMLHeadingElement>;
}) {
  const resultRow = (
    <Row label="Result">
      <StatusBadge status={result} />
    </Row>
  );
  const rowClass = "flex min-h-11 items-center justify-between gap-3 py-1";
  return (
    <div className="flex flex-col divide-y divide-border">
      {titleId ? (
        <h2 ref={titleRef} id={titleId} tabIndex={-1} className={`${rowClass} font-normal`}>
          {resultRow}
        </h2>
      ) : (
        <div className={rowClass}>{resultRow}</div>
      )}
      {errorType && (
        <div className={rowClass}>
          <Row label="Error type">
            <StatusBadge status={errorType} />
          </Row>
        </div>
      )}
    </div>
  );
}
