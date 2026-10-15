"use client";

import { useRouter } from "next/navigation";
import { SavedView } from "@/components/SavedView/SavedView";
import { findItem, inGuideOrder } from "@/lib/items";
import type { Item } from "@/lib/items";
import { useSaved } from "@/lib/saved";
import { startSession } from "@/lib/session";

export default function SavedPage() {
  const router = useRouter();
  const saved = useSaved();
  if (saved === "loading") return null;
  const items = (saved ?? []).flatMap((id) => findItem(id) ?? []);

  return (
    <SavedView
      items={items}
      onRepeat={() => {
        // Guide order, whatever order they were saved in.
        const order = inGuideOrder([...new Set(items.map((item: Item) => item.section))]);
        const sorted = [...items].sort(
          (a, b) => order.indexOf(a.section) - order.indexOf(b.section),
        );
        startSession(
          "repeat",
          sorted.map((item) => item.id),
        );
        router.push("/session");
      }}
    />
  );
}
