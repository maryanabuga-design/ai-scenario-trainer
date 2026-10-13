import { ArrowCircle } from "@/components/ArrowCircle/ArrowCircle";
import { Tag } from "@/components/Tag/Tag";

/** A material's prepared scenario on Home. The whole card opens Session setup for it. */
export function ScenarioCard({
  title,
  lines,
  onOpen,
}: {
  title: string;
  lines: string[];
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col items-start gap-2 rounded-card bg-card p-5 text-left shadow-(--card-shadow) active:bg-surface-muted"
    >
      <span className="flex w-full items-start justify-between gap-3">
        <Tag>Scenario</Tag>
        <ArrowCircle />
      </span>
      <span className="type-item-title">{title}</span>
      {lines.map((line) => (
        <span key={line} className="type-small text-text-secondary">
          {line}
        </span>
      ))}
    </button>
  );
}
