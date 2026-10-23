"use client";

import { useParams } from "next/navigation";
import { PackageStudentRoute } from "@/components/PackageContent/PackageStudentRoute";

/** The step guide and the practice of a published demo topic (a student route; nothing is saved). */
export default function PackagePartPage() {
  const { id, part } = useParams<{ id: string; part: string }>();
  return <PackageStudentRoute id={id} part={part} preview={false} />;
}
