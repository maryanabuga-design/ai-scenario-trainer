import { notFound } from "next/navigation";
import { ChecklistDetail } from "@/components/ChecklistView/ChecklistDetail";
import { checklists, getChecklist } from "@/lib/checklists";

export function generateStaticParams() {
  return checklists.map((checklist) => ({ id: checklist.id }));
}

export default async function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const checklist = getChecklist(id);
  if (!checklist) notFound();
  return <ChecklistDetail checklist={checklist} />;
}
