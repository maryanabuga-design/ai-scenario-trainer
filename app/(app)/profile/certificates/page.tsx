"use client";

import { useRouter } from "next/navigation";
import { CertificatesList } from "@/components/CertificatesList/CertificatesList";
import { useCertificates } from "@/lib/certificates-store";

export default function CertificatesPage() {
  const router = useRouter();
  const certificates = useCertificates();
  if (certificates === "loading") return null;
  return <CertificatesList certificates={certificates} onBack={() => router.push("/profile")} />;
}
