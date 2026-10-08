"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { BackLink } from "@/components/BackLink/BackLink";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { FileCover } from "@/components/FileCover/FileCover";
import { MaterialCover } from "@/components/MaterialCover/MaterialCover";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { Tag } from "@/components/Tag/Tag";
import { TrainingTags } from "@/components/TrainingTags/TrainingTags";
import { startTraining, useTrainings } from "@/lib/trainings";
import { UploadButton } from "@/components/UploadSheet/UploadSheet";
import { formatAdded } from "@/lib/materials";
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
      {openable && (
        <span aria-hidden="true" className="text-text-secondary">
          ›
        </span>
      )}
    </>
  );
  return openable ? (
    <button
      type="button"
      onClick={() => open(section.id)}
      className="flex min-h-12 w-full items-start gap-3 py-3 text-left text-sm hover:underline"
    >
      {content}
    </button>
  ) : (
    <div className="flex min-h-12 w-full items-start gap-3 py-3 text-sm">{content}</div>
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
  const trainings = useTrainings();
  const training = trainings === "loading" ? undefined : trainings?.[material.id];
  const canCreate = material.status === "ready" && (material.sectionIds?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/materials" label="Back to materials" />
      <div className="flex flex-col items-start gap-4">
        {material.hasScenario ? (
          <MaterialCover size="lg" />
        ) : (
          <FileCover type={material.type} size="lg" />
        )}
        <Tag tone="blue">{material.type}</Tag>
        <h1 className="font-serif text-2xl leading-tight break-words">{material.name}</h1>
        <TrainingTags training={training} />
      </div>

      <Card>
        <dl className="flex flex-col divide-y divide-border">
          <Detail label="Type">{material.type}</Detail>
          <Detail label={material.type === "Link" ? "Address" : "Size"}>{material.size}</Detail>
          <Detail label="Added">{formatAdded(material.added)}</Detail>
          <Detail label="Status">
            <StatusBadge status={material.status} />
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
          <UploadButton label="Try another file" />
        </div>
      )}

      {scenarioCard}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Sections</h2>
        {sections.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border rounded-card bg-surface px-4">
            {sections.map((section) => (
              <li key={section.id}>
                <SectionRow section={section} openable={sectionsOpenable} />
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
                startTraining(material.id);
                router.push("/session/setup");
              }}
            >
              Start training
            </Button>
            <ButtonLink href={`/training/${material.id}`} variant="text">
              Create again
            </ButtonLink>
          </>
        ) : canCreate ? (
          <ButtonLink href={`/training/${material.id}`}>Create training</ButtonLink>
        ) : (
          <>
            <p className="text-center text-sm text-text-secondary">
              In this prototype, training can be created from the sample guide and its quick card
              only.
            </p>
            <Button disabled>Create training</Button>
            <ButtonLink href="/materials/evacuation-guide" variant="text">
              Open the sample guide
            </ButtonLink>
          </>
        )}
      </ActionBar>
    </div>
  );
}
