import type { ReactNode } from "react";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import type { ErrorType } from "@/lib/scoring";

export type Result = "correct" | "wrong" | "partial";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 py-1">
      <span className="type-small text-text-secondary">{label}</span>
      {children}
    </div>
  );
}

/**
 * The status of one answer as two key-value rows: "Result" and "Error type", label on the left
 * and the chip on the right. Without a confidence rating only "Result" is shown. Used in the
 * Error analysis cards (the answer sheet has no status rows).
 */
export function StatusRows({ result, errorType }: { result: Result; errorType: ErrorType | null }) {
  return (
    <div className="flex flex-col divide-y divide-border">
      <Row label="Result">
        <StatusBadge status={result} />
      </Row>
      {errorType && (
        <Row label="Error type">
          <StatusBadge status={errorType} />
        </Row>
      )}
    </div>
  );
}
