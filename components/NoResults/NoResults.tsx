import { ButtonLink } from "@/components/Button/Button";

/** Results and the Answer review before any session has finished. */
export function NoResults() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="type-page-title">No results yet</h1>
      <p className="text-text-secondary">Finish a session to see its results here.</p>
      <ButtonLink href="/materials">Go to Materials</ButtonLink>
    </div>
  );
}
