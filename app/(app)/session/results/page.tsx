"use client";

import { useRouter } from "next/navigation";
import { NoResults } from "@/components/NoResults/NoResults";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { scoreSession, weakItemsFromHistory } from "@/lib/progress";
import { startRepeat } from "@/lib/repeat";
import { isValidSession, useHistory, useSession } from "@/lib/session";
import { weakTopics } from "@/lib/weak-topics";

export default function ResultsPage() {
  const router = useRouter();
  const session = useSession();
  const history = useHistory();

  if (session === "loading" || history === "loading") return null;
  if (!session || !session.finished || !isValidSession(session)) return <NoResults />;

  const topics = weakTopics(weakItemsFromHistory(history));

  return (
    <ResultsView
      kind={session.kind}
      items={scoreSession(session)}
      topics={topics}
      backHref={session.returnTo ?? "/"}
      onRepeat={() => {
        startRepeat(topics);
        window.scrollTo(0, 0);
        router.push("/session");
      }}
    />
  );
}
