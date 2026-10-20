"use client";

import { useParams, useRouter } from "next/navigation";
import { ButtonLink } from "@/components/Button/Button";
import { CertificateView } from "@/components/CertificateView/CertificateView";
import { useCurrentAccount } from "@/lib/auth";
import { useCertificates } from "@/lib/certificates-store";

export default function CertificatePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const certificates = useCertificates();
  const account = useCurrentAccount();
  if (certificates === "loading" || account === "loading" || !account) return null;
  const certificate = certificates.find((entry) => entry.id === params.id);
  if (!certificate) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="type-page-title">Certificate not found</h1>
        <p className="text-text-secondary">It may belong to another account.</p>
        <ButtonLink href="/profile/certificates">Back to certificates</ButtonLink>
      </div>
    );
  }
  return (
    <CertificateView
      certificate={certificate}
      name={account.name}
      onBack={() => router.push("/profile/certificates")}
    />
  );
}
