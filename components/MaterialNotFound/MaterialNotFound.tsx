import { ButtonLink } from "@/components/Button/Button";

export function MaterialNotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="font-semibold text-2xl">Material not found</h1>
      <p className="text-text-secondary">It may have been uploaded in another browser.</p>
      <ButtonLink href="/materials" variant="secondary">
        Go to Materials
      </ButtonLink>
    </div>
  );
}
