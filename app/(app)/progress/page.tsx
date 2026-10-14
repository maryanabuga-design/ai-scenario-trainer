"use client";

import { ProgressView } from "@/components/ProgressView/ProgressView";
import { useHistory } from "@/lib/session";

export default function Progress() {
  const history = useHistory();

  if (history === "loading") return null;

  return <ProgressView history={history ?? []} />;
}
