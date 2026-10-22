"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { InviteView } from "@/components/InstructorStudents/InviteView";
import { useAuth } from "@/lib/auth";
import { participants } from "@/lib/cohort";
import { groups } from "@/lib/groups";
import type { Scope } from "@/lib/groups";
import {
  readInvitations,
  saveInvitations,
  useInvitations,
  withInvitations,
} from "@/lib/invitations";
import { useScope } from "@/lib/scope-store";

/** Rendered once everything is read, so the time and the address are never part of the prerender. */
function Loaded({
  invitations,
  scope,
  counts,
}: {
  invitations: ReturnType<typeof readInvitations>;
  scope: Scope;
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [saveFailed, setSaveFailed] = useState(false);
  return (
    <>
      {saveFailed && (
        <p role="alert" className="type-small text-status-attention-ink">
          This device has no room left. The invitations are shown for now only.
        </p>
      )}
      <InviteView
        scope={scope}
        counts={counts}
        invitations={invitations}
        origin={window.location.origin}
        onSend={(emails, groupId) =>
          setSaveFailed(
            !saveInvitations(withInvitations(readInvitations(), emails, Date.now(), groupId)),
          )
        }
        onCancel={() => router.push("/instructor/students")}
      />
    </>
  );
}

export default function InvitePage() {
  const invitations = useInvitations();
  const scope = useScope();
  const auth = useAuth();
  if (invitations === "loading" || scope === "loading" || auth === "loading") return null;
  const people = participants(auth.accounts);
  const counts = Object.fromEntries(
    groups.map((group) => [group.id, people.filter((p) => p.groupId === group.id).length]),
  );
  return <Loaded invitations={invitations} scope={scope} counts={counts} />;
}
