"use client";

import { Bookmark, ClipboardCheck, ListChecks, ListOrdered } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/Button/Button";
import { MiniQuizLink } from "@/components/MiniQuizLink/MiniQuizLink";
import { Media3D } from "@/components/Media3D/Media3D";
import { NotificationBell } from "@/components/NotificationBell/NotificationBell";
import { Tile } from "@/components/Tile/Tile";
import {
  HERO_BUTTON_LABEL,
  HERO_SUBTITLE,
  HERO_TITLE,
  homeArtwork,
  homeImages,
  homeTiles,
} from "@/lib/home";
import type { HomeCounts, HomeSummary, HomeTileId } from "@/lib/home";

const miniQuizPath = "/mini-quiz?from=home";

const tileIcons: Record<HomeTileId, LucideIcon> = {
  exam: ClipboardCheck,
  steps: ListOrdered,
  weak: ListChecks,
  saved: Bookmark,
};

/**
 * Home, the student view: an avatar (Profile), the greeting and the notification bell, then one sentence, the hero card (its
 * one Primary button opens Training), four tiles and the Mini-quiz row. Nothing from Progress is
 * repeated here, and no readiness percentage.
 */
export function HomeView({
  name,
  summary,
  counts,
}: {
  name: string;
  summary: HomeSummary;
  counts: HomeCounts;
}) {
  const tiles = homeTiles(counts);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <header className="flex flex-col gap-1 pt-1">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            aria-label="Profile"
            data-avatar
            className="type-body-strong flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-olive-tint text-primary active:bg-secondary-pressed"
          >
            {name.charAt(0)}
          </Link>
          <h1 className="type-page-title min-w-0 flex-1 truncate">Hi, {name}</h1>
          <NotificationBell />
        </div>
        <p className="type-body text-text-secondary">{summary.subtitle}</p>
      </header>

      <section
        aria-label={HERO_TITLE}
        className="relative rounded-[28px] bg-card p-2 shadow-(--card-shadow) has-focus-visible:outline-2"
      >
        <div className="flex flex-col gap-4 rounded-[22px] bg-secondary-sand p-4">
          {/* the frame is placed at the right and adds no height: the text decides the row */}
          <div className="relative">
            <div className="flex min-w-0 flex-col gap-1 pr-[84px]">
              <h2 className="type-card-title">{HERO_TITLE}</h2>
              <p className="type-small text-text-secondary">{HERO_SUBTITLE}</p>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center">
              <Media3D
                variant="tile"
                src={homeImages.heroTraining}
                artwork={homeArtwork.heroTraining}
              />
            </div>
          </div>

          <Link
            href="/training"
            className={`${buttonClasses({ variant: "primary" })} after:absolute after:inset-0 after:rounded-[28px]`}
          >
            {HERO_BUTTON_LABEL}
          </Link>
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <li key={tile.id}>
            <Tile
              href={tile.href}
              title={tile.title}
              subtitle={tile.count}
              icon={tileIcons[tile.id]}
            />
          </li>
        ))}
      </ul>

      <MiniQuizLink
        href={miniQuizPath}
        subtitle="Pick topics and how many questions"
        minHeight="min-h-[104px]"
        clampSubtitle
      />
    </div>
  );
}
