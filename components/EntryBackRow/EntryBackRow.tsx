import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";

/**
 * The top row of an entry screen that has no "Step" caption (DESIGN.md: Invitation picture and a way
 * back): the white round 40px back arrow at the top left, named "Back". A link, or a button when
 * going back runs code.
 */
export function EntryBackRow(props: { href: string } | { onBack: () => void }) {
  return (
    <div data-entry-back className="flex items-center">
      {"href" in props ? (
        <CircleBackButton size="small" label="Back" href={props.href} />
      ) : (
        <CircleBackButton size="small" label="Back" onClick={props.onBack} />
      )}
    </div>
  );
}
