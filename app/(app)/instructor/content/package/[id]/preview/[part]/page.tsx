"use client";

import { useParams } from "next/navigation";
import { PackageStudentRoute } from "@/components/PackageContent/PackageStudentRoute";

/** Preview as student: the student's step guide and practice screens with the preview bar. */
export default function PackagePreviewPartPage() {
  const { id, part } = useParams<{ id: string; part: string }>();
  return <PackageStudentRoute id={id} part={part} preview />;
}
