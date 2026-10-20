"use client";

import { HomeView } from "@/components/HomeView/HomeView";
import { homeCounts, homeSummary } from "@/lib/home";
import { useSaved } from "@/lib/saved";
import { useHistory, useProfile, useSession } from "@/lib/session";
import { useCurrentAccount } from "@/lib/auth";

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
    <HomeView
      name={account.name}
      summary={homeSummary({ unfinished, history })}
      counts={homeCounts({ history, saved })}
    />
  );
}
