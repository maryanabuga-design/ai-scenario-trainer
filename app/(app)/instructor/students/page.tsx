"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { StudentsHeader, viewFrom } from "@/components/InstructorStudents/StudentsHeader";
import type { StudentsView } from "@/components/InstructorStudents/StudentsHeader";
import { EmptyCard, StudentsListView } from "@/components/InstructorStudents/StudentsListView";
import { TopicsView } from "@/components/InstructorTopics/TopicsView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { useAuth } from "@/lib/auth";
import type { Account } from "@/lib/auth";
import { DEMO_NOTE, participants } from "@/lib/cohort";
import { ALL_GROUPS, inScope } from "@/lib/groups";
import type { Scope } from "@/lib/groups";
import { switcherRows, topicStandings } from "@/lib/overview";
import { saveScope, useScope } from "@/lib/scope-store";
import { readHistories } from "@/lib/student-data";
import {
  filterFrom,
  originFrom,
  profiles,
  showingLine,
  topicFrom,
  visibleStudents,
} from "@/lib/students";
import type { StudentsFilter } from "@/lib/students";

/** Rendered once everything is read, so the time is never part of the prerender. */
function Loaded({ accounts, scope }: { accounts: Account[]; scope: Scope }) {
  const router = useRouter();
  const query = useSearchParams();
  const view = viewFrom(query.get("view"));
  const filter = filterFrom(query.get("filter"));
  const topic = topicFrom(query.get("topic"));
  const origin = originFrom(query.get("from"));
  const { sections } = useSourceSheet();
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;
  const [now] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const people = useMemo(() => inScope(participants(accounts), scope), [accounts, scope]);
  const all = useMemo(
    () => profiles(people, readHistories(accounts), now),
    [people, accounts, now],
  );
  const rows = useMemo(
    () => switcherRows(profiles(participants(accounts), readHistories(accounts), now)),
    [accounts, now],
  );
  // a filter from another screen (Almost ready, Not started, a topic) shows the filter line
  const showing =
    origin || topic
      ? showingLine(filter, topic ? { id: topic, title: titleOf(topic) } : null)
      : showingLine(filter, null);

  const go = (params: URLSearchParams) => {
    const text = params.toString();
    router.replace(text ? `/instructor/students?${text}` : "/instructor/students");
  };
  const keep = () => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (topic) params.set("topic", topic);
    if (origin) params.set("from", origin);
    return params;
  };

  const back =
    origin === "topics"
      ? { label: "Back to Topics", href: "/instructor/students?view=topics" }
      : origin === "overview"
        ? { label: "Back to Overview", href: "/instructor" }
        : undefined;

  return (
    <div className="flex flex-col gap-4 pb-4">
      <StudentsHeader
        scope={scope}
        rows={rows}
        onScope={(next) => {
          saveScope(next);
          const params = new URLSearchParams();
          if (view === "topics") params.set("view", "topics");
          go(params);
        }}
        view={view}
        back={back}
        onView={(next: StudentsView) => {
          const params = new URLSearchParams();
          if (next === "topics") params.set("view", "topics");
          go(params);
        }}
      />
      {view === "topics" ? (
        scope === ALL_GROUPS ? (
          <>
            <EmptyCard
              dataEmpty="all-groups"
              title="Select a group to see topic results."
              text="Topic results mix groups when all are shown. Choose a group with the switch at the top."
              action={null}
            />
            <p data-demo-note className="type-small text-center text-text-secondary">
              {DEMO_NOTE}
            </p>
          </>
        ) : (
          <TopicsView standings={topicStandings(all)} titleOf={titleOf} />
        )
      ) : (
        <StudentsListView
          shown={visibleStudents(all, filter, search, topic)}
          total={all.length}
          filter={filter}
          query={search}
          showing={showing}
          origin={origin}
          topic={topic}
          onFilter={(next: StudentsFilter) => {
            const params = keep();
            if (next === "all") params.delete("filter");
            else params.set("filter", next);
            go(params);
          }}
          onQuery={setSearch}
          onClearFilter={() => router.replace("/instructor/students")}
        />
      )}
    </div>
  );
}

function StudentsScreen() {
  const auth = useAuth();
  const scope = useScope();
  if (auth === "loading" || scope === "loading") return null;
  return <Loaded accounts={auth.accounts} scope={scope} />;
}

export default function StudentsPage() {
  return (
    <Suspense fallback={null}>
      <StudentsScreen />
    </Suspense>
  );
}
