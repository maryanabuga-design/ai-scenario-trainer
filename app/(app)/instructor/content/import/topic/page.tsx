"use client";

import { useRouter } from "next/navigation";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { updateDraft, useImportDraft } from "@/lib/import-draft";
import { trainingSections } from "@/lib/parts";

/** The topic picker of Import (the pattern of the Direction picker): a choice applies and returns. */
export default function ImportTopicPage() {
  const router = useRouter();
  const draft = useImportDraft();
  const { sections } = useSourceSheet();
  return (
    <div className="flex flex-col gap-6 pb-4">
      <PageHeaderBand
        title="Topic"
        subtitle="The guide topic of these questions"
        back={{ label: "Back to Import", href: "/instructor/content/import" }}
      />
      <span id="topic-picker-label" className="sr-only">
        Topic
      </span>
      <fieldset
        role="radiogroup"
        aria-labelledby="topic-picker-label"
        className="flex flex-col gap-2"
      >
        {trainingSections.map((id) => (
          <SelectableRow
            key={id}
            name="topic"
            value={id}
            compact
            checked={draft.topic === id}
            onChange={(value) => {
              updateDraft({ topic: value });
              router.replace("/instructor/content/import");
            }}
          >
            <span className="type-body-strong min-w-0 flex-1 truncate">
              <span className="sr-only">{id} </span>
              {sections.find((section) => section.id === id)?.title ?? id}
            </span>
          </SelectableRow>
        ))}
      </fieldset>
    </div>
  );
}
