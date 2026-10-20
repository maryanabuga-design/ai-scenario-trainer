import { ClipboardList } from "lucide-react";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { EmptyState } from "@/components/EmptyState/EmptyState";

export const INSTRUCTOR_EMPTY = "No exams yet. Exam tools are coming next.";

/** The Instructor Home stub: the header band and an empty state, no buttons (exam tools come in a later step). */
export function InstructorHomeView() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeaderBand title="Instructor" />
      <EmptyState icon={ClipboardList} text={INSTRUCTOR_EMPTY} />
    </div>
  );
}
