"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  GroupPickerView,
  originBack,
  originOf,
} from "@/components/InstructorGroups/GroupPickerView";
import { useAuth } from "@/lib/auth";
import { participants } from "@/lib/cohort";
import { groups } from "@/lib/groups";
import { saveScope, useScope } from "@/lib/scope-store";

function Picker() {
  const router = useRouter();
  const origin = originOf(useSearchParams().get("from"));
  const auth = useAuth();
  const scope = useScope();
  if (auth === "loading" || scope === "loading") return null;
  const people = participants(auth.accounts);
  const counts = Object.fromEntries(
    groups.map((group) => [
      group.id,
      people.filter((p) => p.groupId === group.id).length,
    ]),
  );
  return (
    <GroupPickerView
      scope={scope}
      counts={counts}
      origin={origin}
      onChoose={(next) => {
        saveScope(next);
        router.push(originBack(origin).href);
      }}
    />
  );
}

export default function GroupsPage() {
  return (
    <Suspense fallback={null}>
      <Picker />
    </Suspense>
  );
}
