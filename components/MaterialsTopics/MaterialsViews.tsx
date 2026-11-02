"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";

export type MaterialsView = "topics" | "steps";

export const viewOf = (value: string | null): MaterialsView =>
  value === "steps" ? "steps" : "topics";

/**
 * The selector of Materials, "Topics | Step guides", and the chosen view (DESIGN.md: Steps in
 * Materials). The view lives in the URL (`?view=steps`), so a deep link and Back work; Topics is the
 * default and has no query. The two views are passed in already drawn.
 */
export function MaterialsViews({
  topics,
  steps,
  view: fixed,
}: {
  topics: ReactNode;
  steps: ReactNode;
  /** For tests and the review page: the view without reading the URL. */
  view?: MaterialsView;
}) {
  const router = useRouter();
  const query = useSearchParams();
  const view = fixed ?? viewOf(query.get("view"));
  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl
        name="materials-view"
        legend="View"
        hideLegend
        dense
        options={[
          { value: "topics", label: "Topics" },
          { value: "steps", label: "Step guides" },
        ]}
        value={view}
        onChange={(next: MaterialsView) =>
          router.push(next === "steps" ? "/materials?view=steps" : "/materials")
        }
      />
      {view === "steps" ? steps : topics}
    </div>
  );
}
