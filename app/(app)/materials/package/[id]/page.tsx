"use client";

import { useParams } from "next/navigation";
import { PackageStudentRoute } from "@/components/PackageContent/PackageStudentRoute";

/** A published demo topic opens its reading screen directly, like a built-in topic. */
export default function PackageStudentPage() {
  const { id } = useParams<{ id: string }>();
  return <PackageStudentRoute id={id} preview={false} />;
}
