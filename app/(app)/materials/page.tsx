import Link from "next/link";
import { MaterialCover } from "@/components/MaterialCover/MaterialCover";
import { Tag } from "@/components/Tag/Tag";
import { loadGuide } from "@/lib/guide";

export default function Materials() {
  const guide = loadGuide();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl">Materials</h1>
      <Link
        href="/materials/evacuation-guide"
        className="flex items-center gap-4 rounded-card bg-surface p-4 hover:bg-surface-muted"
      >
        <MaterialCover />
        <div className="flex min-w-0 flex-col gap-1">
          <Tag tone="blue">Material</Tag>
          <span className="font-serif text-lg leading-tight">{guide.title}</span>
          <span className="text-sm text-text-secondary">
            <span className="tabular-nums">{guide.sections.length}</span> sections · 1 scenario
          </span>
        </div>
      </Link>
    </div>
  );
}
