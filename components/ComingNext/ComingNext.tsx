import { ButtonLink } from "@/components/Button/Button";

export function ComingNext({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="font-serif text-2xl">{title}</h1>
      <p className="text-text-secondary">This section is coming in a later version of the prototype.</p>
      <ButtonLink href="/materials" variant="secondary">
        Go to Materials
      </ButtonLink>
    </div>
  );
}
