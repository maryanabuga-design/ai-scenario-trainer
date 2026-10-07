import type { Guide } from "@/lib/guide";

export function MaterialCard({ guide }: { guide: Guide }) {
  return (
    <section
      aria-labelledby="material-title"
      className="rounded-card border border-border bg-surface p-4"
    >
      <p className="text-xs text-text-secondary">Loaded material</p>
      <h2 id="material-title" className="mt-1 font-serif text-xl">
        {guide.title}
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        A simplified summary of building evacuation and basic first aid.
      </p>
      <h3 className="mt-6 text-sm font-medium">
        <span className="tabular-nums">{guide.sections.length}</span> sections
      </h3>
      <ul className="mt-2 flex flex-col gap-1 text-sm text-text-secondary">
        {guide.sections.map((section) => (
          <li key={section.id} className="flex gap-3">
            <span className="w-8 shrink-0 tabular-nums">{section.id}</span>
            <span>{section.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
