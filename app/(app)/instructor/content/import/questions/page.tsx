import { redirect } from "next/navigation";

/** The separate question-set import is retired: one document creates one topic (DESIGN.md). */
export default function ImportQuestionsPage() {
  redirect("/instructor/content/import");
}
