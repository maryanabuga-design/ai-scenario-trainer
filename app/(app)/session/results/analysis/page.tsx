"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AnalysisView } from "@/components/AnalysisView/AnalysisView";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import { NoResults } from "@/components/NoResults/NoResults";
import { scoreSession } from "@/lib/progress";
import { resultsKind, startRepeat } from "@/lib/repeat";
import { parseFilter } from "@/lib/results";
import { useSession } from "@/lib/session";

function Analysis() {
  const router = useRouter();
  const params = useSearchParams();
  const session = useSession();

  if (session === "loading") return null;
  if (!session || !session.finished) return <NoResults />;

  const items = scoreSession(session);
  return (
    <AskAiProvider>
      <AnalysisView
        items={items}
        filter={parseFilter(params.get("show"))}
        quiz={resultsKind(session).kind === "quiz"}
        backHref="/session/results"
        onRepeat={(ids) => {
          startRepeat(session, items, ids);
          window.scrollTo(0, 0);
          router.push("/session");
        }}
      />
    </AskAiProvider>
  );
}

/** The Error analysis of the last finished session. It reads the saved session, so it survives a reload. */
export default function AnalysisPage() {
  return (
    <Suspense fallback={null}>
      <Analysis />
    </Suspense>
  );
}
