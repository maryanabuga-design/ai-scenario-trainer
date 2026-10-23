import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { StepGuideRows } from "@/components/MaterialsTopics/StepGuideRows";
import { STEPS_SUBTITLE, STEPS_TITLE, STEP_GUIDES_PATH, checklists } from "@/lib/checklists";
import type { Checklist } from "@/lib/checklists";

/**
 * The page behind the old link `/checklists`: the step guides of Materials (`/materials?view=steps`)
 * on a page of their own, with Back to Materials. `items` is for tests.
 */
export function StepsList({ items = checklists }: { items?: Checklist[] }) {
  return (
    <div className="flex flex-col gap-[var(--gutter,1rem)] pb-[var(--gutter,1rem)]">
      <PageHeaderBand
        title={STEPS_TITLE}
        subtitle={STEPS_SUBTITLE}
        back={{ label: "Back to Materials", href: STEP_GUIDES_PATH }}
      />
      <StepGuideRows items={items} />
    </div>
  );
}
