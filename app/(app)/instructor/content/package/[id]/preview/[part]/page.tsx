"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PackageStudentRoute } from "@/components/PackageContent/PackageStudentRoute";

/** Preview as student: the student's step guide and practice screens with the preview bar. */
function Preview() {
  const { id, part } = useParams<{ id: string; part: string }>();
  const from = useSearchParams().get("from") ?? undefined;
  return <PackageStudentRoute id={id} part={part} preview from={from} />;
}

export default function PackagePreviewPartPage() {
  return (
    <Suspense fallback={null}>
      <Preview />
    </Suspense>
  );
}
