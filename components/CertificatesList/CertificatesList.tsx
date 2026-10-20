import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { CERTIFICATES_EMPTY, certificateDate } from "@/lib/certificates";
import type { Certificate } from "@/lib/certificates";

/** The list of certificates (DESIGN.md: Completion certificates): rows of a fixed 72px, or the empty text. */
export function CertificatesList({
  certificates,
  onBack,
}: {
  certificates: Certificate[];
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeaderBand title="Certificates" back={{ label: "Back", onClick: onBack }} />
      {certificates.length === 0 ? (
        <p data-empty className="text-text-secondary">
          {CERTIFICATES_EMPTY}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {certificates.map((certificate) => (
            <li key={certificate.id}>
              <Link
                href={`/profile/certificates/${certificate.id}`}
                data-certificate-row={certificate.id}
                className="flex h-[72px] items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow) has-focus-visible:outline-2"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-body-strong truncate">{certificate.examTitle}</span>
                  <span className="type-small text-text-secondary">
                    {certificateDate(certificate.date)}
                  </span>
                </span>
                <Chevron />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
