"use client";

import { useParams } from "next/navigation";
import { PackageStudentRoute } from "@/components/PackageContent/PackageStudentRoute";

/** Preview as student: the student's reading screen with the preview bar; nothing is saved. */
export default function PackagePreviewPage() {
  const { id } = useParams<{ id: string }>();
  return <PackageStudentRoute id={id} preview />;
}
