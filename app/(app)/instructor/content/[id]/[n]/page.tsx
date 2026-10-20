"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ButtonLink } from "@/components/Button/Button";
import { EditQuestionView } from "@/components/InstructorContent/EditQuestionView";
import { Amber } from "@/components/InstructorContent/Amber";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { NO_ROOM, updateSet, useContentSets } from "@/lib/content-sets";

export default function EditQuestionPage() {
  const { id, n } = useParams<{ id: string; n: string }>();
  const router = useRouter();
  const sets = useContentSets();
  const { sections } = useSourceSheet();
  const [noRoom, setNoRoom] = useState(false);
  if (sets === "loading") return null;
  const set = sets.find((entry) => entry.id === id);
  const index = Number(n) - 1;
  if (!set || !Number.isInteger(index) || index < 0 || index >= set.questions.length) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="type-page-title">Question not found</h1>
        <p className="text-text-secondary">It may have been removed from this browser.</p>
        <ButtonLink
          href={set ? `/instructor/content/${set.id}` : "/instructor/content"}
          variant="secondary"
        >
          {set ? "Back to Review" : "Back to Content"}
        </ButtonLink>
      </div>
    );
  }
  if (set.status === "published") {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="type-page-title">This set is published</h1>
        <p className="text-text-secondary">Unpublish it to edit its questions.</p>
        <ButtonLink href={`/instructor/content/${set.id}`} variant="secondary">
          Back to Review
        </ButtonLink>
      </div>
    );
  }
  const topicTitle = sections.find((section) => section.id === set.topic)?.title ?? set.topic;
  const back = `/instructor/content/${set.id}`;

  return (
    <>
      {noRoom && <Amber>{NO_ROOM}</Amber>}
      <EditQuestionView
        key={set.questions[index].id}
        set={set}
        index={index}
        topicTitle={topicTitle}
        onSave={(question) => {
          const saved = updateSet(set.id, (s) => ({
            ...s,
            questions: s.questions.map((q, i) => (i === index ? question : q)),
          }));
          if (!saved) return setNoRoom(true);
          router.push(back);
        }}
        onDelete={() => {
          updateSet(set.id, (s) => ({
            ...s,
            questions: s.questions.filter((_, i) => i !== index),
          }));
          router.push(back);
        }}
      />
    </>
  );
}
