"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { Chevron } from "@/components/Chevron/Chevron";
import { nextSort, sortRows } from "@/components/DataTable/sort";
import type { SortState } from "@/components/DataTable/sort";
import { InitialsAvatar } from "@/components/InitialsAvatar/InitialsAvatar";

/** A column that may be hidden when the table is narrow (a container rule, not a window rule). */
export type HideBelow = 800 | 960;

const hideClass: Record<HideBelow, string> = {
  800: "hidden @[800px]:table-cell",
  960: "hidden @[960px]:table-cell",
};

export type Column<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** The value the column sorts by; without it the header is plain text. */
  sortValue?: (row: T) => string | number;
  align?: "right";
  hideBelow?: HideBelow;
  /** A width for the column (the others share the rest). */
  width?: string;
};

export type TableRow = {
  id: string;
  /** The text of the first cell (and the value the Student column sorts by). */
  name: string;
  /** The initials circle, unless `leading` is given. */
  initials?: string;
  /** Something else before the name (the topic code). */
  leading?: ReactNode;
  /** After the name, on the same line (the certificate mark). */
  after?: ReactNode;
  /** A row without an address is a plain row: no link, no hover and no chevron. */
  href?: string;
};

const SortIcon = ({ direction }: { direction: "ascending" | "descending" | null }) =>
  direction === "ascending" ? (
    <ArrowUp size={14} strokeWidth={2.25} aria-hidden="true" />
  ) : direction === "descending" ? (
    <ArrowDown size={14} strokeWidth={2.25} aria-hidden="true" />
  ) : (
    <ChevronsUpDown size={14} strokeWidth={2} aria-hidden="true" className="opacity-60" />
  );

/**
 * The one desktop table (DESIGN.md: Responsive instructor, step 3): a real table in a white card,
 * drawn only from 1024px in the instructor shell. The first cell is the real link (the initials and
 * the name) and the whole row is clickable through its `::after`; sortable headers are buttons with
 * `aria-sort`. The phone keeps its row list: this table is hidden there, so it is not in the
 * accessibility tree.
 */
export function DataTable<T extends TableRow>({
  label,
  rows,
  columns,
  firstHeader = "Student",
  firstSortable = true,
  dataAttribute = "data-table",
  nameLines = 1,
}: {
  /** The accessible name of the table. */
  label: string;
  rows: T[];
  columns: Column<T>[];
  firstHeader?: string;
  firstSortable?: boolean;
  dataAttribute?: string;
  /** How many lines the first cell may take before it is cut (a question text: 2). */
  nameLines?: 1 | 2;
}) {
  const [sort, setSort] = useState<SortState>(null);
  const ordered = sortRows(rows, sort, (row, id) => {
    if (id === "student") return row.name;
    return columns.find((column) => column.id === id)?.sortValue?.(row) ?? "";
  });
  const sortOf = (id: string) => (sort?.id === id ? sort.direction : null);

  const header = (id: string, text: string, sortable: boolean, align?: "right") => {
    const direction = sortOf(id);
    return (
      <>
        {sortable ? (
          <button
            type="button"
            onClick={() => setSort((current) => nextSort(current, id))}
            className={`type-label -mx-2 inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-[8px] px-2 text-text-secondary hover:text-text focus-visible:outline-2 focus-visible:outline-primary ${align === "right" ? "flex-row-reverse" : ""}`}
          >
            {text}
            <SortIcon direction={direction} />
          </button>
        ) : (
          <span className="type-label text-text-secondary">{text}</span>
        )}
      </>
    );
  };

  return (
    <div
      {...{ [dataAttribute]: "" }}
      data-desk-only
      className="@container hidden overflow-clip rounded-[16px] border border-selectable-stroke bg-card idesk:block"
    >
      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr>
            <th
              scope="col"
              aria-sort={sortOf("student") ?? undefined}
              className="sticky top-0 z-10 bg-secondary-sand px-6 py-1 text-left font-normal"
            >
              {header("student", firstHeader, firstSortable)}
            </th>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                aria-sort={column.sortValue ? (sortOf(column.id) ?? undefined) : undefined}
                style={column.width ? { width: column.width } : undefined}
                className={`sticky top-0 z-10 bg-secondary-sand px-3 py-1 font-normal ${column.align === "right" ? "text-right" : "text-left"} ${column.hideBelow ? hideClass[column.hideBelow] : ""}`}
              >
                {header(column.id, column.header, !!column.sortValue, column.align)}
              </th>
            ))}
            <th scope="col" className="sticky top-0 z-10 w-14 bg-secondary-sand">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-selectable-stroke">
          {ordered.map((row) => (
            <tr
              key={row.id}
              data-table-row={row.id}
              className={`relative h-16 ${row.href ? "hover:bg-bg has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-(--accent)" : ""}`}
            >
              <th scope="row" className="px-6 py-2 text-left font-normal">
                {(() => {
                  const content = (
                    <>
                      {row.leading ??
                        (row.initials !== undefined ? (
                          <InitialsAvatar initials={row.initials} size={48} />
                        ) : null)}
                      <span
                        className={`type-body-strong min-w-0 ${nameLines === 2 ? "line-clamp-2" : "truncate"}`}
                      >
                        {row.name}
                      </span>
                      {row.after}
                    </>
                  );
                  return row.href ? (
                    <Link
                      href={row.href}
                      data-table-link={row.id}
                      className="flex min-w-0 items-center gap-3 focus-visible:outline-none! after:absolute after:inset-0 after:content-['']"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex min-w-0 items-center gap-3">{content}</div>
                  );
                })()}
              </th>
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={`type-small px-3 py-2 ${column.align === "right" ? "text-right tabular-nums" : ""} ${column.hideBelow ? hideClass[column.hideBelow] : ""}`}
                >
                  {column.cell(row)}
                </td>
              ))}
              <td className="w-14 pr-2">{row.href && <Chevron />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
