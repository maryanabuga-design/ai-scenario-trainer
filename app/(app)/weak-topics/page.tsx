"use client";

import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WeakTopicsView } from "@/components/WeakTopicsView/WeakTopicsView";
import { weakItemsFromHistory } from "@/lib/progress";
import { startRepeat } from "@/lib/repeat";
import { useHistory } from "@/lib/session";
import type { WeakTopic } from "@/lib/weak-topics";
import { weakTopics } from "@/lib/weak-topics";

function Picker({ topics }: { topics: WeakTopic[] }) {
  const router = useRouter();
  const fromResults = useSearchParams().get("from") === "results";
  const [selected, setSelected] = useState(() => topics.map((topic) => topic.sectionId));
  return (
    <WeakTopicsView
      topics={topics}
      selected={selected}
      backHref={fromResults ? "/session/results" : "/"}
      backLabel={fromResults ? "Back to results" : "Back to Home"}
      onToggle={(id) =>
        setSelected((current) =>
          current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        )
      }
      onRepeat={() => {
        startRepeat(topics.filter((topic) => selected.includes(topic.sectionId)));
        router.push("/session");
      }}
    />
  );
}

export default function WeakTopicsPage() {
  const history = useHistory();
  if (history === "loading") return null;
  return (
    <Suspense fallback={null}>
      <Picker topics={weakTopics(weakItemsFromHistory(history))} />
    </Suspense>
  );
}
