import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StepsTopic } from "@/components/StepsView/StepsTopic";
import { checklists, getChecklist } from "@/lib/checklists";

export function generateStaticParams() {
  return checklists.map((checklist) => ({ id: checklist.id }));
}

type Params = Promise<{ id: string }>;

async function Checklist({ params }: { params: Params }) {
  const { id } = await params;
  const checklist = getChecklist(id);
  if (!checklist) notFound();
  return <StepsTopic checklist={checklist} />;
}

// The id comes from the URL, so it is read inside a Suspense boundary (Next.js 16 asks for it).
export default function ChecklistPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={null}>
      <Checklist params={params} />
    </Suspense>
  );
}
