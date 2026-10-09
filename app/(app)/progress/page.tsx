"use client";

import { useRouter } from "next/navigation";
import { ProgressView } from "@/components/ProgressView/ProgressView";
import { repeatItems } from "@/lib/weak-topics";
import { startRepeatRound, useHistory } from "@/lib/session";

export default function Progress() {
  const router = useRouter();
  const history = useHistory();

  if (history === "loading") return null;

  return (
    <ProgressView
      history={history ?? []}
      onRepeat={(topics) => {
        startRepeatRound(
          repeatItems(topics),
          topics.map((topic) => topic.sectionId),
        );
        router.push("/session");
      }}
    />
  );
}
