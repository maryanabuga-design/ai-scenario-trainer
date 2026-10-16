import { notFound } from "next/navigation";
import { ReadingView } from "@/components/ReadingView/ReadingView";
import { allTopics, practiseHref, stepsFor, topicFor } from "@/lib/materials-topics";

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
        practiseHref: practiseHref(topic.id),
        stepsHref: steps ? `/checklists/${steps.id}` : null,
        next: topic.next ? { id: topic.next.id, title: topic.next.title } : null,
      }}
    />
  );
}
