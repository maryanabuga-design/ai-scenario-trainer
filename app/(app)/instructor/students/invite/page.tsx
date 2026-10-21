"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { InviteView } from "@/components/InstructorStudents/InviteView";
import {
  readInvitations,
  saveInvitations,
  useInvitations,
  withInvitations,
} from "@/lib/invitations";

/** Rendered once the pending list is read, so the time is never part of the prerender. */
function Loaded({ pending }: { pending: ReturnType<typeof readInvitations> }) {
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
        pending={pending}
        onSend={(emails) =>
          setSaveFailed(!saveInvitations(withInvitations(readInvitations(), emails, Date.now())))
        }
        onCancel={() => router.push("/instructor/students")}
      />
    </>
  );
}

export default function InvitePage() {
  const pending = useInvitations();
  if (pending === "loading") return null;
  return <Loaded pending={pending} />;
}
