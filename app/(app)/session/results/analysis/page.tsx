"use client";

import { useRouter } from "next/navigation";
import { AnalysisView } from "@/components/AnalysisView/AnalysisView";
import { NoResults } from "@/components/NoResults/NoResults";
import { scoreSession } from "@/lib/progress";
import { resultsKind, startRepeat } from "@/lib/repeat";
import { useSession } from "@/lib/session";

/** The Error analysis of the last finished session. It reads the saved session, so it survives a reload. */
export default function AnalysisPage() {
  const router = useRouter();
  const session = useSession();

  if (session === "loading") return null;
  if (!session || !session.finished) return <NoResults />;

  const items = scoreSession(session);
  return (
    <AnalysisView
      items={items}
      quiz={resultsKind(session).kind === "quiz"}
      backHref="/session/results"
      onRepeat={(ids) => {
        startRepeat(session, items, ids);
        window.scrollTo(0, 0);
        router.push("/session");
      }}
    />
  );
}
