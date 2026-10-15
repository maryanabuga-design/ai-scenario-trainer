"use client";

import { Bookmark, ClipboardCheck, ListChecks, ListOrdered, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ButtonLink, buttonClasses } from "@/components/Button/Button";
import { Chip } from "@/components/Chip/Chip";
import { Chevron } from "@/components/Chevron/Chevron";
import { Media3D } from "@/components/Media3D/Media3D";
import { Ring } from "@/components/Ring/Ring";
import { TileIcon } from "@/components/TileIcon/TileIcon";
import { heroCounts, heroCountsLine, homeImages, homeTiles } from "@/lib/home";
import type { HomeCounts, HomeSummary, HomeTileId, SegmentState } from "@/lib/home";
import { onboardingHref } from "@/lib/onboarding";

const miniQuizPath = "/mini-quiz?from=home";

const tileIcons: Record<HomeTileId, LucideIcon> = {
  exam: ClipboardCheck,
  steps: ListOrdered,
  weak: ListChecks,
  saved: Bookmark,
};

const segmentTones: Record<SegmentState, string> = {
  done: "bg-primary",
  "in progress": "bg-olive-tint",
  "not started": "bg-arrow-stroke",
};

/**
 * Home, the learner view: a greeting with one sentence and the profile button, the hero card
 * "Your training" (it always says Start training and opens Training), six tiles and the Mini-quiz
 * row. Nothing from Progress is repeated here.
 */
export function HomeView({
  name,
  summary,
  readiness,
  counts,
  guideName,
}: {
  name: string;
  summary: HomeSummary;
  /** The readiness percentage: 0 when nothing is done. */
  readiness: number;
  counts: HomeCounts;
  guideName: string;
}) {
  const { goal, strip } = summary;
  const tiles = homeTiles(counts);
  const topicsDone = strip.filter((segment) => segment.state === "done").length;

  return (
    <div className="flex flex-col gap-4 pb-4">
      <header className="flex items-start justify-between gap-3 pt-1">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="type-page-title">Hi, {name}</h1>
          <p className="type-body text-text-secondary">{summary.subtitle}</p>
        </div>
        <Link
          href="/profile"
          aria-label="Profile"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-text shadow-(--card-shadow) active:bg-surface-muted"
        >
          <User size={20} strokeWidth={2} aria-hidden="true" />
        </Link>
      </header>

      <section
        aria-label="Your training"
        className="relative rounded-[28px] bg-card p-2 shadow-(--card-shadow) has-focus-visible:outline-2"
      >
        <div className="flex flex-col gap-4 rounded-[22px] bg-secondary-sand p-4">
          <div className="flex h-10 items-center justify-between gap-2 rounded-full bg-surface pr-1.5 pl-4">
            <span className="type-body-strong">Your training</span>
            <Chip tone="green" size="caption">
              {strip.length} topics
            </Chip>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 className="type-card-title">{guideName}</h2>
              <p className="type-small text-text-secondary">
                {heroCountsLine(heroCounts.scenarios, heroCounts.questions)}
              </p>
            </div>
            <Media3D variant="tile" src={homeImages.heroTraining} />
          </div>

          <div className="flex flex-col gap-2">
            <ul aria-label="Topics" className="flex gap-1">
              {strip.map((segment) => (
                <li
                  key={segment.sectionId}
                  data-state={segment.state}
                  title={`${segment.sectionId}: ${segment.state}`}
                  className={`h-1.5 flex-1 rounded-[3px] ${segmentTones[segment.state]}`}
                />
              ))}
            </ul>
            <p className="type-caption flex justify-between text-text-secondary">
              <span>
                Topics {topicsDone}/{strip.length}
              </span>
              <span>
                Today {goal.done}/{goal.goal}
              </span>
            </p>
          </div>

          <hr className="border-t border-arrow-stroke" />

          <div className="flex items-center gap-3">
            <Link
              href="/training"
              className={`${buttonClasses({ variant: "primary" })} after:absolute after:inset-0 after:rounded-[28px]`}
            >
              Start training
            </Link>
            <Link
              href="/progress"
              aria-label={`Readiness ${readiness}%, open Progress`}
              className="relative z-10 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-button border border-arrow-stroke bg-surface"
            >
              <Ring percent={readiness} size={40} label={`Readiness ${readiness}%`} />
            </Link>
          </div>
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <li key={tile.id}>
            <Link
              href={tile.href}
              className="flex h-full min-h-32 flex-col justify-between gap-4 rounded-card bg-card p-4 shadow-(--card-shadow) has-focus-visible:outline-2"
            >
              <Media3D
                variant="icon"
                fallback={<TileIcon icon={tileIcons[tile.id]} tone={tile.tone} />}
              />
              <span className="flex flex-col gap-0.5">
                <span className="type-body-strong">{tile.title}</span>
                <span className="type-small text-text-secondary">{tile.count}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={miniQuizPath}
        className="flex min-h-[104px] items-center gap-3 rounded-card bg-card p-4 shadow-(--card-shadow) has-focus-visible:outline-2"
      >
        <Media3D variant="row" src={homeImages.iconMiniQuiz} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="type-body-strong">Mini-quiz</span>
          <span className="type-small line-clamp-2 text-text-secondary">
            Pick topics and how many questions
          </span>
        </span>
        <Chevron />
      </Link>

      <div className="-ml-3 self-start">
        <ButtonLink href={onboardingHref} variant="tertiary">
          How it works
        </ButtonLink>
      </div>
    </div>
  );
}
