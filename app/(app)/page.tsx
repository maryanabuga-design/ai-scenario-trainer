"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HomeView } from "@/components/HomeView/HomeView";
import { homeCounts, homeSummary } from "@/lib/home";
import { useSaved } from "@/lib/saved";
import { modeItems } from "@/lib/parts";
import { readHistory, startSession, useHistory, useProfile, useSession } from "@/lib/session";
import { pickTodays, todaysResult } from "@/lib/todays-practice";
import { useCurrentAccount } from "@/lib/auth";

/** Rendered once everything is read, so the time is never part of the prerender. */
function Loaded({ children }: { children: (now: number, start: () => void) => React.ReactNode }) {
  const router = useRouter();
  const [now] = useState(() => Date.now());
  function start() {
    const ids = pickTodays(modeItems("quiz"), readHistory());
    if (ids.length === 0) return;
    startSession("quiz", ids, { returnTo: "/", mode: "today" });
    router.push("/session");
  }
  return <>{children(now, start)}</>;
}

export default function Home() {
  const profile = useProfile();
  const session = useSession();
  const history = useHistory();
  const saved = useSaved();
  const account = useCurrentAccount();

  if (
    profile === "loading" ||
    session === "loading" ||
    history === "loading" ||
    saved === "loading" ||
    account === "loading" ||
    account === null
  ) {
    return null;
  }

  const unfinished = session && !session.finished ? session : null;

  return (
    <Loaded>
      {(now, start) => (
        <HomeView
          name={account.name}
          summary={homeSummary({ unfinished, history })}
          counts={homeCounts({ history, saved })}
          todays={todaysResult(history, now)}
          onStartToday={start}
        />
      )}
    </Loaded>
  );
}
