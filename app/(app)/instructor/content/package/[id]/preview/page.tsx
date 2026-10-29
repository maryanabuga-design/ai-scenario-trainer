"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PackageStudentRoute } from "@/components/PackageContent/PackageStudentRoute";

/** Preview as student: the student's reading screen with the preview bar; nothing is saved. */
function Preview() {
  const { id } = useParams<{ id: string }>();
  const from = useSearchParams().get("from") ?? undefined;
  return <PackageStudentRoute id={id} preview from={from} />;
}

export default function PackagePreviewPage() {
  return (
    <Suspense fallback={null}>
      <Preview />
    </Suspense>
  );
}
