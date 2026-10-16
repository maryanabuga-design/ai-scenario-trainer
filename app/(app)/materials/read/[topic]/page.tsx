import { notFound } from "next/navigation";
import { ReadingView } from "@/components/ReadingView/ReadingView";
import { allTopics, stepsFor, topicFor } from "@/lib/materials-topics";
import { canPractise } from "@/lib/parts";

export function generateStaticParams() {
  return allTopics().map((topic) => ({ topic: topic.id }));
}

export default async function ReadingPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: id } = await params;
  const topic = topicFor(id);
  if (!topic) notFound();
  const steps = stepsFor(topic.id);

  return (
    <ReadingView
      topic={{
        id: topic.id,
        title: topic.title,
        guideTitle: topic.guideTitle,
        minutes: topic.minutes,
        body: topic.section.body,
        canPractise: canPractise(topic.id),
        stepsHref: steps ? `/checklists/${steps.id}` : null,
        previous: topic.previous ? { id: topic.previous.id, title: topic.previous.title } : null,
        next: topic.next ? { id: topic.next.id, title: topic.next.title } : null,
      }}
    />
  );
}
