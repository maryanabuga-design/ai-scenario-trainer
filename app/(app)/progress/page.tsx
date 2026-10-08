"use client";

import { useRouter } from "next/navigation";
import { ProgressView } from "@/components/ProgressView/ProgressView";
import { startSession, useHistory } from "@/lib/session";

export default function Progress() {
  const router = useRouter();
  const history = useHistory();

  if (history === "loading") return null;

  return (
    <ProgressView
      history={history ?? []}
      onPractise={(stepIds) => {
        startSession("repeat", stepIds);
        router.push("/session");
      }}
    />
  );
}
