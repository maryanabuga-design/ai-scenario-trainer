"use client";

import { useRouter } from "next/navigation";
import { HomeView } from "@/components/HomeView/HomeView";
import { directionTitle } from "@/lib/directions";
import { weakAnswersFromHistory } from "@/lib/progress";
import { startSession, useHistory, useProfile, useSession } from "@/lib/session";

export default function Home() {
  const router = useRouter();
  const profile = useProfile();
  const session = useSession();
  const history = useHistory();

  if (profile === "loading" || session === "loading" || history === "loading") return null;

  return (
    <HomeView
      directionTitle={directionTitle(profile?.direction)}
      unfinished={session && !session.finished ? session : null}
      weakAnswers={weakAnswersFromHistory(history)}
      onPractise={(stepIds) => {
        startSession("repeat", stepIds);
        router.push("/session");
      }}
    />
  );
}
