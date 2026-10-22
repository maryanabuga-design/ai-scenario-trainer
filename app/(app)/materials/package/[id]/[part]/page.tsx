"use client";

import { useParams } from "next/navigation";
import {
  PackageGone,
  PackagePartView,
  isPart,
} from "@/components/PackageContent/PackageStudentViews";
import { publishedPackages, usePackages } from "@/lib/packages";

/** One part of a published demo topic (a student route; answers are not saved anywhere). */
export default function PackagePartPage() {
  const params = useParams<{ id: string; part: string }>();
  const topics = usePackages();
  if (topics === "loading") return null;
  const topic = publishedPackages(topics).find((entry) => entry.id === params.id);
  if (!topic || !isPart(params.part)) return <PackageGone />;
  return (
    <PackagePartView
      title={topic.title}
      part={params.part}
      data={topic}
      guideHref={(section) => `/materials/package/${topic.id}/guide#section-${section}`}
      back={{ label: "Back to topic", href: `/materials/package/${topic.id}` }}
    />
  );
}
