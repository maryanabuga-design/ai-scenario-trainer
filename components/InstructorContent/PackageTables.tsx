"use client";

import { DataTable } from "@/components/DataTable/DataTable";
import type { Column } from "@/components/DataTable/DataTable";
import { Chip } from "@/components/Chip/Chip";
import { IssuePill } from "@/components/PackageContent/PackageParts";
import { pillOf } from "@/lib/package-review";
import type { Issue, PackageData } from "@/lib/package-read";

type ItemRow = {
  id: string;
  name: string;
  leading: React.ReactNode;
  href?: string;
  guide: string;
  key: string;
};

const number = (n: number) => (
  <span
    aria-hidden="true"
    className="type-caption-strong flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-olive-tint px-2"
  >
    {n}
  </span>
);

const guideCell = (row: ItemRow) =>
  row.guide ? (
    <Chip tone="sand" size="small">
      Guide · section {row.guide}
    </Chip>
  ) : (
    <span className="text-text-secondary">—</span>
  );

const columns = (issues: Issue[]): Column<ItemRow>[] => [
  {
    id: "guide",
    header: "Guide section",
    width: "190px",
    sortValue: (row) => Number(row.guide) || 0,
    cell: guideCell,
  },
  {
    id: "check",
    header: "To check",
    width: "150px",
    sortValue: (row) => (pillOf(issues, row.key) ? 0 : 1),
    cell: (row) => <IssuePill issues={issues} itemKey={row.key} />,
  },
];

/**
 * The Steps and Questions of a demo topic as the desktop table (DESIGN.md: Responsive instructor,
 * step 5): the same items, text and guide links as the phone cards; a row opens the item's edit
 * screen unless the topic is published. Drawn only from 1024px in the instructor shell.
 */
export function StepsTables({
  data,
  issues,
  editHref,
}: {
  data: PackageData;
  issues: Issue[];
  editHref?: (key: string) => string;
}) {
  return (
    <div data-desk-only className="hidden flex-col gap-6 idesk:flex">
      {(data.steps ?? []).map((list, li) => (
        <section key={li} data-steps-table={li} className="flex flex-col gap-3">
          <h3 className="type-item-title">{list.title}</h3>
          <DataTable
            label={`Steps: ${list.title}`}
            dataAttribute="data-steps-list"
            firstHeader="Step"
            columns={columns(issues)}
            rows={list.steps.map((step, si) => {
              const key = `steps:${li}:${si}`;
              return {
                id: key,
                name: step.action || "(no action)",
                leading: number(si + 1),
                href: editHref?.(key),
                guide: step.guideRef,
                key,
              };
            })}
          />
        </section>
      ))}
    </div>
  );
}

export function QuestionsTable({
  data,
  issues,
  editHref,
}: {
  data: PackageData;
  issues: Issue[];
  editHref?: (key: string) => string;
}) {
  return (
    <div data-desk-only className="hidden flex-col idesk:flex">
      <DataTable
        label="Questions"
        dataAttribute="data-questions-table"
        firstHeader="Question"
        columns={columns(issues)}
        nameLines={2}
        rows={(data.questions ?? []).map((question, index) => {
          const key = `questions:${index}`;
          return {
            id: key,
            name: question.text || "(no question text)",
            leading: number(index + 1),
            href: editHref?.(key),
            guide: question.guideRef,
            key,
          };
        })}
      />
    </div>
  );
}
