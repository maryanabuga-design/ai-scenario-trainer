"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Chevron } from "@/components/Chevron/Chevron";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { MaterialTile } from "@/components/MaterialTile/MaterialTile";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { StatusChip } from "@/components/StatusChip/StatusChip";
import { TrainingTags } from "@/components/TrainingTags/TrainingTags";
import { useTrainings } from "@/lib/trainings";
import { UploadButton } from "@/components/UploadSheet/UploadSheet";
import { formatAdded, materialKind } from "@/lib/materials";
import type { Material, MaterialSection } from "@/lib/materials";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 py-2">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="text-right break-all">{children}</dd>
    </div>
  );
}

function SectionRow({ section, openable }: { section: MaterialSection; openable: boolean }) {
  const { open } = useSourceSheet();
  const content = (
    <>
      <span className="w-8 shrink-0 text-text-secondary tabular-nums">{section.id}</span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span>{section.title}</span>
        <span className="text-text-secondary">{section.excerpt}</span>
      </span>
      {openable && <Chevron />}
    </>
  );
  return openable ? (
    <button
      type="button"
      onClick={() => open(section.id)}
      className="type-small flex min-h-12 w-full items-start gap-3 py-3 text-left active:bg-surface-muted"
    >
      {content}
    </button>
  ) : (
    <div className="type-small flex min-h-12 w-full items-start gap-3 py-3">{content}</div>
  );
}

/** The material page: details, the scenario if there is one, sections with excerpts. */
export function MaterialView({
  material,
  sections,
  sectionsOpenable,
  scenarioCard,
}: {
  material: Material;
  sections: MaterialSection[];
  sectionsOpenable: boolean;
  scenarioCard?: ReactNode;
}) {
  const router = useRouter();
  const { sections: guideSections } = useSourceSheet();
  // An uploaded copy of a sample guide shows that guide's sections and first lines.
  const fromGuide = guideSections
    .filter((section) => material.sectionIds?.includes(section.id))
    .map((section) => ({ id: section.id, title: section.title, excerpt: section.lines[0] ?? "" }));
  const shownSections = sections.length > 0 ? sections : fromGuide;
  const openable = sectionsOpenable || (sections.length === 0 && fromGuide.length > 0);
  const trainings = useTrainings();
  const training = trainings === "loading" ? undefined : trainings?.[material.id];
  const canCreate = material.status === "ready" && (material.sectionIds?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      <CircleBackButton href="/materials" label="Back to materials" />
      <div className="flex flex-col items-start gap-4">
        <MaterialTile type={material.type} />
        <h1 className="type-page-title break-words">{material.name}</h1>
        <TrainingTags training={training} />
      </div>

      <Card>
        <dl className="flex flex-col divide-y divide-border">
          {materialKind(material.type) === "link" ? (
            <>
              <Detail label="Type">Web page</Detail>
              <Detail label="Address">{material.url}</Detail>
            </>
          ) : (
            <>
              <Detail label="Type">{material.type}</Detail>
              <Detail label="Size">{material.size}</Detail>
            </>
          )}
          <Detail label="Added">{formatAdded(material.added)}</Detail>
          <Detail label="Status">
            <StatusChip status={material.status} />
          </Detail>
        </dl>
      </Card>

      {material.status === "processing" && (
        <p className="text-text-secondary">
          This material is still being processed. In this prototype it stays in this state.
        </p>
      )}
      {material.status === "failed" && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-text-secondary">{material.reason}</p>
          <div className="-ml-3">
            <UploadButton label="Try another file" variant="tertiary" />
          </div>
        </div>
      )}

      {scenarioCard}

      <section className="flex flex-col gap-3">
        <h2 className="type-item-title">Sections</h2>
        {shownSections.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border rounded-card bg-card shadow-(--card-shadow) px-4">
            {shownSections.map((section) => (
              <li key={section.id}>
                <SectionRow section={section} openable={openable} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-secondary">
            {material.uploaded
              ? "This prototype does not read uploaded files, so there are no sections to show."
              : "There are no sections to show for this material yet."}
          </p>
        )}
      </section>

      <ActionBar>
        {training ? (
          <>
            <Button
              onClick={() => {
                router.push("/training");
              }}
            >
              Start training
            </Button>
            <ButtonLink href={`/training/${material.id}`} variant="tertiary">
              Create again
            </ButtonLink>
          </>
        ) : canCreate ? (
          <ButtonLink href={`/training/${material.id}`}>Create training</ButtonLink>
        ) : (
          <>
            <p className="type-small text-center text-text-secondary">
              In this prototype, training can be created from the sample guide and its quick card
              only.
            </p>
            <Button disabled>Create training</Button>
            <ButtonLink href="/materials/read/S1" variant="tertiary">
              Read the sample guide
            </ButtonLink>
          </>
        )}
      </ActionBar>
    </div>
  );
}
