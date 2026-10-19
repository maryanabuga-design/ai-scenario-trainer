"use client";

import { useRouter } from "next/navigation";
import { usePartRecords } from "@/lib/part-progress";
import { practicePlan } from "@/lib/practise";
import { scenario } from "@/lib/scenario";
import { isValidSession, saveSession, startSession, useSession } from "@/lib/session";

/**
 * Practising a topic: resumes an unfinished session of the topic, otherwise starts its next
 * recommended part, and opens the session. CLIENT ONLY (it reads progress). `returnTo` is where
 * Exit and Back on Results go afterwards. Returns the function to call with a topic id.
 */
export function usePractiseTopic(returnTo?: string) {
  const router = useRouter();
  const session = useSession();
  const records = usePartRecords();

  return function practise(topicId: string) {
    if (session === "loading" || records === "loading") return;
    const unfinished = session && !session.finished && isValidSession(session) ? session : null;
    const plan = practicePlan(topicId, records, unfinished);
    if (!plan) return;
    if (plan.resume && unfinished) {
      saveSession(returnTo ? { ...unfinished, returnTo } : unfinished);
    } else {
      startSession(plan.part.mode, plan.part.itemIds, {
        scenarioId: plan.part.mode === "scenario" ? scenario.id : undefined,
        partId: plan.part.id,
        returnTo,
      });
    }
    router.push("/session");
  };
}

/** "Practise this topic" for one topic (the Materials reading screen). */
export function usePractise(topicId: string, returnTo?: string) {
  const practise = usePractiseTopic(returnTo);
  return () => practise(topicId);
}
