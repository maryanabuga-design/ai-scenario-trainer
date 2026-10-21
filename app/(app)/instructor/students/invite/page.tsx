"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Scope } from "@/lib/groups";
import { useScope } from "@/lib/scope-store";
import { InviteView } from "@/components/InstructorStudents/InviteView";
import {
  readInvitations,
  saveInvitations,
  useInvitations,
  withInvitations,
} from "@/lib/invitations";

/** Rendered once the pending list is read, so the time is never part of the prerender. */
function Loaded({ pending, scope }: { pending: ReturnType<typeof readInvitations>; scope: Scope }) {
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
        pending={pending}
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
  const pending = useInvitations();
  const scope = useScope();
  if (pending === "loading" || scope === "loading") return null;
  return <Loaded pending={pending} scope={scope} />;
}
