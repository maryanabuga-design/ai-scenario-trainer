import { CircleCheck, CircleAlert, Pencil } from "lucide-react";
import type { SetStatus } from "@/lib/content-sets";

/** A set's status as an icon plus text (never colour alone): Draft in the neutral tone, Published in the success tone. */
export function SetStatusLine({ status }: { status: SetStatus }) {
  const published = status === "published";
  const Icon = published ? CircleCheck : Pencil;
  return (
    <span
      data-set-status={status}
      className={`type-small flex items-center gap-1.5 ${published ? "text-status-success-ink" : "text-text-secondary"}`}
    >
      <Icon size={14} strokeWidth={2} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{published ? "Published" : "Draft"}</span>
    </span>
  );
}

/** A question's status: Ready in the success tone, Needs attention in the amber tone with its reason. */
export function QuestionStatusLine({ problems }: { problems: string[] }) {
  const ready = problems.length === 0;
  const Icon = ready ? CircleCheck : CircleAlert;
  const extra = problems.length > 1 ? ` (+${problems.length - 1})` : "";
  return (
    <span
      data-question-status={ready ? "ready" : "attention"}
      className={`type-small flex items-center gap-1.5 ${ready ? "text-status-success-ink" : "text-status-attention-ink"}`}
    >
      <Icon size={14} strokeWidth={2} aria-hidden="true" className="shrink-0" />
      <span className="truncate">
        {ready ? "Ready" : `Needs attention: ${problems[0]}${extra}`}
      </span>
    </span>
  );
}
