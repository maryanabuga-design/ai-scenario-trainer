import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";

/** A placeholder until the Mini-quiz screen is built. */
export default function MiniQuizPage() {
  return (
    <div className="flex flex-col items-start gap-4">
      <CircleBackButton href="/training?mode=quiz" label="Back to Training" />
      <h1 className="type-page-title">Mini-quiz</h1>
      <p className="text-text-secondary">
        Pick topics and how many questions. This screen is coming next.
      </p>
    </div>
  );
}
