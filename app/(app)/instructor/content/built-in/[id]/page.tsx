import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuiltInTopicView } from "@/components/InstructorContent/BuiltInTopicView";
import { topicQuestionCount } from "@/lib/group-exams";
import { stepsFor, topicFor } from "@/lib/materials-topics";
import { trainingSections } from "@/lib/parts";

export function generateStaticParams() {
  return trainingSections.map((id) => ({ id }));
}

type Params = Promise<{ id: string }>;

async function BuiltIn({ params }: { params: Params }) {
  const { id } = await params;
  const topic = trainingSections.includes(id) ? topicFor(id) : undefined;
  if (!topic) notFound();
  return (
    <BuiltInTopicView
      id={id}
      title={topic.title}
      questions={topicQuestionCount(id)}
      minutes={topic.minutes}
      guide={stepsFor(id)}
    />
  );
}

// The id comes from the URL, so it is read inside a Suspense boundary (Next.js 16 asks for it).
export default function BuiltInTopicPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={null}>
      <BuiltIn params={params} />
    </Suspense>
  );
}
