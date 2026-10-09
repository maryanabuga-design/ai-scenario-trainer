"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WeakTopicsView } from "@/components/WeakTopicsView/WeakTopicsView";
import { weakItemsFromHistory } from "@/lib/progress";
import { startRepeatRound, useHistory } from "@/lib/session";
import type { WeakTopic } from "@/lib/weak-topics";
import { repeatItems, weakTopics } from "@/lib/weak-topics";

function Picker({ topics }: { topics: WeakTopic[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => topics.map((topic) => topic.sectionId));
  return (
    <WeakTopicsView
      topics={topics}
      selected={selected}
      onToggle={(id) =>
        setSelected((current) =>
          current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        )
      }
      onRepeat={() => {
        const chosen = topics.filter((topic) => selected.includes(topic.sectionId));
        startRepeatRound(
          repeatItems(chosen),
          chosen.map((topic) => topic.sectionId),
        );
        router.push("/session");
      }}
    />
  );
}

export default function WeakTopicsPage() {
  const history = useHistory();
  if (history === "loading") return null;
  return <Picker topics={weakTopics(weakItemsFromHistory(history))} />;
}
