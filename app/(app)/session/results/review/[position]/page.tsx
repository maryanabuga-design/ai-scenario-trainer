"use client";

import { Suspense } from "react";
import { NoResults } from "@/components/NoResults/NoResults";
import { SessionReview } from "@/components/SessionReview/SessionReview";
import { isValidSession, useSession } from "@/lib/session";

function Review() {
  const session = useSession();
  if (session === "loading") return null;
  if (!session || !session.finished || !isValidSession(session)) return <NoResults />;
  return <SessionReview session={session} base="/session/results" backLabel="Back to results" />;
}

/** The Answer review of one question of the last finished session. */
export default function ReviewPage() {
  return (
    <Suspense fallback={null}>
      <Review />
    </Suspense>
  );
}
