import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/EmptyState/EmptyState";

export const INSTRUCTOR_EMPTY = "No exams yet. Exam tools are coming next.";

/** The Instructor Home stub: a title and an empty state, no buttons (exam tools come in a later step). */
export function InstructorHomeView() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-page-title">Instructor</h1>
      <EmptyState icon={ClipboardList} text={INSTRUCTOR_EMPTY} />
    </div>
  );
}
