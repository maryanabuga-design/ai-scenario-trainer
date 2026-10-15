"use client";

import { useRouter } from "next/navigation";
import { NoResults } from "@/components/NoResults/NoResults";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { scoreSession } from "@/lib/progress";
import { resultsKind, startRepeat } from "@/lib/repeat";
import { useSession } from "@/lib/session";

export default function ResultsPage() {
  const router = useRouter();
  const session = useSession();

  if (session === "loading") return null;
  if (!session || !session.finished) return <NoResults />;

  const items = scoreSession(session);

  return (
    <ResultsView
      results={resultsKind(session)}
      items={items}
      onRepeat={(ids) => {
        startRepeat(session, items, ids);
        window.scrollTo(0, 0);
        router.push("/session");
      }}
    />
  );
}
