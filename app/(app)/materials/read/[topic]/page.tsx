import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReadingView } from "@/components/ReadingView/ReadingView";
import { allTopics, stepsFor, topicFor } from "@/lib/materials-topics";
import { canPractise } from "@/lib/parts";

export function generateStaticParams() {
  return allTopics().map((topic) => ({ topic: topic.id }));
}

type Params = Promise<{ topic: string }>;

async function Reading({ params }: { params: Params }) {
  const { topic: id } = await params;
  const topic = topicFor(id);
  if (!topic) notFound();
  const steps = stepsFor(topic.id);
  const inGuide = allTopics().filter((other) => other.guideId === topic.guideId);

  return (
    <ReadingView
      key={topic.id}
      topic={{
        id: topic.id,
        title: topic.title,
        guideTitle: topic.guideTitle,
        minutes: topic.minutes,
        body: topic.section.body,
        canPractise: canPractise(topic.id),
        stepsHref: steps ? `/checklists/${steps.id}` : null,
        position: inGuide.findIndex((other) => other.id === topic.id) + 1,
        total: inGuide.length,
        previous: topic.previous ? { id: topic.previous.id, title: topic.previous.title } : null,
        next: topic.next ? { id: topic.next.id, title: topic.next.title } : null,
      }}
    />
  );
}

// The topic comes from the URL, so it is read inside a Suspense boundary (Next.js 16 asks for it);
// the pages themselves are still prepared at build time by generateStaticParams.
export default function ReadingPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={null}>
      <Reading params={params} />
    </Suspense>
  );
}
