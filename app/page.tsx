import { ActionBar } from "@/components/ActionBar/ActionBar";
import { ButtonLink } from "@/components/Button/Button";
import { Dropzone } from "@/components/Dropzone/Dropzone";
import { MaterialCard } from "@/components/MaterialCard/MaterialCard";
import { ScenarioCard } from "@/components/ScenarioCard/ScenarioCard";
import { loadGuide } from "@/lib/guide";
import { loadScenarioSummary } from "@/lib/scenario";

export default function Library() {
  const guide = loadGuide();
  const scenario = loadScenarioSummary();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="mb-2 font-serif text-2xl">Library</h1>
      <MaterialCard guide={guide} />
      <ScenarioCard scenario={scenario} />
      <Dropzone />
      <ActionBar>
        <ButtonLink href="/practice">Start scenario</ButtonLink>
      </ActionBar>
    </div>
  );
}
