"use client";

import { useRouter } from "next/navigation";
import { ButtonLink } from "@/components/Button/Button";
import { SessionRunner } from "@/components/SessionRunner/SessionRunner";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { getPart } from "@/lib/parts";
import type { Session } from "@/lib/session";
import { finishSession, isValidSession, saveSession, useSession } from "@/lib/session";

function NoSession() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="type-page-title">No session in progress</h1>
      <p className="text-text-secondary">Start a scenario from a material.</p>
      <ButtonLink href="/materials">Go to Materials</ButtonLink>
    </div>
  );
}

function Runner({ session }: { session: Session }) {
  const router = useRouter();
  const { sections } = useSourceSheet();
  const part = session.partId ? getPart(session.partId) : undefined;

  return (
    <SessionRunner
      session={session}
      unit={session.kind === "scenario" ? "Step" : "Question"}
      subtitle={part ? sections.find((section) => section.id === part.sectionId)?.title : undefined}
      onChange={saveSession}
      onFinish={() => {
        finishSession(session);
        router.push("/session/results");
      }}
      onLeave={() => router.push("/")}
    />
  );
}

export default function SessionPage() {
  const session = useSession();
  if (session === "loading") return null;
  if (!session || session.finished || !isValidSession(session)) return <NoSession />;
  return <Runner session={session} />;
}
