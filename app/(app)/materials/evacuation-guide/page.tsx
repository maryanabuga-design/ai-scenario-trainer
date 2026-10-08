import { Card } from "@/components/Card/Card";
import { MaterialView } from "@/components/MaterialView/MaterialView";
import { Tag } from "@/components/Tag/Tag";
import { loadGuide } from "@/lib/guide";
import { sampleMaterials } from "@/lib/materials";
import { audienceLabel, scenario, sessionLengths } from "@/lib/scenario";

export default function MaterialPage() {
  const guide = loadGuide();
  const material = sampleMaterials.find((candidate) => candidate.id === "evacuation-guide");
  if (!material) throw new Error("The sample guide is missing from content/materials.json");

  return (
    <MaterialView
      material={material}
      sections={guide.sections.map((section) => ({
        id: section.id,
        title: section.title,
        excerpt: section.lines[0] ?? "",
      }))}
      sectionsOpenable
      scenarioCard={
        <Card className="flex flex-col gap-2">
          <div>
            <Tag tone="yellow">Scenario</Tag>
          </div>
          <h2 className="font-serif text-xl">{scenario.title}</h2>
          <p className="text-sm text-text-secondary">
            Short: <span className="tabular-nums">{sessionLengths.short.stepIds.length}</span>{" "}
            decisions, about <span className="tabular-nums">{sessionLengths.short.minutes}</span>{" "}
            min. Full: <span className="tabular-nums">{sessionLengths.full.stepIds.length}</span>,
            about <span className="tabular-nums">{sessionLengths.full.minutes}</span> min. Extended:{" "}
            <span className="tabular-nums">{sessionLengths.extended.stepIds.length}</span>, about{" "}
            <span className="tabular-nums">{sessionLengths.extended.minutes}</span> min.
          </p>
          <p className="text-sm text-text-secondary">
            For a {audienceLabel}. A quiz on the guide is also available.
          </p>
        </Card>
      }
    />
  );
}
