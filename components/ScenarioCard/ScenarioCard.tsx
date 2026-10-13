import { ArrowCircle } from "@/components/ArrowCircle/ArrowCircle";
import { SoftShape } from "@/components/SoftShape/SoftShape";
import { Tag } from "@/components/Tag/Tag";

/** A material's prepared scenario on Home. The whole card opens Session setup for it. */
export function ScenarioCard({
  title,
  line,
  onOpen,
}: {
  title: string;
  line: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative isolate flex w-full flex-col items-start gap-2 overflow-hidden rounded-card bg-card p-5 text-left shadow-(--card-shadow) active:bg-surface-muted"
    >
      <SoftShape variant="faint" />
      <span className="flex w-full items-start justify-between gap-3">
        <Tag tone="yellow">Scenario</Tag>
        <ArrowCircle />
      </span>
      <span className="type-item-title">{title}</span>
      <span className="type-small text-text-secondary">{line}</span>
    </button>
  );
}
