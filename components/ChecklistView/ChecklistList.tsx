import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { checklists, stepCountLabel } from "@/lib/checklists";

/** The Quick checklists list: a card for each checklist with its number of steps. */
export function ChecklistList() {
  return (
    <div className="flex flex-col gap-6">
      <CircleBackButton href="/" label="Back to Home" />
      <h1 className="type-page-title">Quick checklists</h1>
      <ul className="flex flex-col gap-3">
        {checklists.map((checklist) => (
          <li key={checklist.id}>
            <Link
              href={`/checklists/${checklist.id}`}
              className="flex min-h-16 items-center gap-3 rounded-card bg-card p-4 shadow-(--card-shadow) has-focus-visible:outline-2"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="type-item-title">{checklist.title}</span>
                <span className="type-small text-text-secondary tabular-nums">
                  {stepCountLabel(checklist.steps.length)}
                </span>
              </span>
              <Chevron />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
