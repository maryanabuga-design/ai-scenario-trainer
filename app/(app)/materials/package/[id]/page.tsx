"use client";

import { useParams } from "next/navigation";
import {
  PackageGone,
  PackageTopicStudentView,
} from "@/components/PackageContent/PackageStudentViews";
import { publishedPackages, usePackages } from "@/lib/packages";

export default function PackageStudentPage() {
  const params = useParams<{ id: string }>();
  const topics = usePackages();
  if (topics === "loading") return null;
  const topic = publishedPackages(topics).find((entry) => entry.id === params.id);
  if (!topic) return <PackageGone />;
  return (
    <PackageTopicStudentView
      title={topic.title}
      summary={topic.summary}
      data={topic}
      partHref={(part) => `/materials/package/${topic.id}/${part}`}
      back={{ label: "Back to Materials", href: "/materials" }}
    />
  );
}
