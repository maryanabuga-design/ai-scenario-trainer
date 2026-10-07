import { ActionBar } from "@/components/ActionBar/ActionBar";
import { ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { MaterialCover } from "@/components/MaterialCover/MaterialCover";
import { SectionLink } from "@/components/SectionLink/SectionLink";
import { Tag } from "@/components/Tag/Tag";
import { loadGuide } from "@/lib/guide";
import { audienceLabel, scenario, sessionLengths } from "@/lib/scenario";

export default function MaterialPage() {
  const guide = loadGuide();

  return (
    <div className="flex flex-col gap-6">
      <div className="-ml-3">
        <ButtonLink href="/materials" variant="text">
          Back to materials
        </ButtonLink>
      </div>
      <div className="flex flex-col gap-4">
        <MaterialCover size="lg" />
        <h1 className="font-serif text-2xl leading-tight">{guide.title}</h1>
        <p className="text-text-secondary">A simplified summary of building evacuation and basic first aid.</p>
      </div>

      <Card className="flex flex-col gap-2">
        <div>
          <Tag tone="yellow">Scenario</Tag>
        </div>
        <h2 className="font-serif text-xl">{scenario.title}</h2>
        <p className="text-sm text-text-secondary">
          Full: <span className="tabular-nums">{sessionLengths.full.stepIds.length}</span> decisions, about{" "}
          <span className="tabular-nums">{sessionLengths.full.minutes}</span> min. Short:{" "}
          <span className="tabular-nums">{sessionLengths.short.stepIds.length}</span> decisions, about{" "}
          <span className="tabular-nums">{sessionLengths.short.minutes}</span> min.
        </p>
        <p className="text-sm text-text-secondary">For a {audienceLabel}.</p>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Sections</h2>
        <ul className="flex flex-col divide-y divide-border rounded-card bg-surface px-4">
          {guide.sections.map((section) => (
            <li key={section.id}>
              <SectionLink sectionId={section.id} title={section.title} />
            </li>
          ))}
        </ul>
      </section>

      <ActionBar>
        <ButtonLink href="/session/setup">Start scenario</ButtonLink>
      </ActionBar>
    </div>
  );
}
