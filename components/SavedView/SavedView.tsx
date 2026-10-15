"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { Chip } from "@/components/Chip/Chip";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import type { Item } from "@/lib/items";

export const savedPath = (id: string) => `/saved/${id}`;

/**
 * The Saved screen: a row for each saved question (section chip, the question, a chevron) and,
 * when there are any, the primary "Repeat saved (N)".
 */
export function SavedView({
  items,
  backHref = "/",
  onRepeat,
}: {
  items: Item[];
  backHref?: string;
  onRepeat: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <CircleBackButton href={backHref} label="Back to Home" />
      <h1 className="type-page-title">Saved questions</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          text="No saved questions yet. Tap the bookmark on a question to keep it here."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={savedPath(item.id)}
                className="flex min-h-14 items-center gap-3 rounded-card bg-card p-4 shadow-(--card-shadow) has-focus-visible:outline-2"
              >
                <Chip tone="sand" size="caption">
                  {item.section}
                </Chip>
                <span className="type-body line-clamp-2 min-w-0 flex-1">{item.question}</span>
                <Chevron />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <ActionBar>
          <Button onClick={onRepeat}>
            Repeat saved (<span className="tabular-nums">{items.length}</span>)
          </Button>
        </ActionBar>
      )}
    </div>
  );
}
