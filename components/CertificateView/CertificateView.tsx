"use client";

import { useState } from "react";
import { Button } from "@/components/Button/Button";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { CERTIFICATE_FOOTER, certificateDate, correctLine } from "@/lib/certificates";
import type { Certificate } from "@/lib/certificates";
import { copyText } from "@/lib/clipboard";

/**
 * The certificate screen (DESIGN.md: Completion certificates): the header band with Back, ONE light
 * card with the name, the exam and the numbers, and the actions Save as PDF (the browser's print
 * dialog; the print style shows only the card on A4) and Share (the Web Share API, otherwise the
 * address is copied). Simulated: not an official document.
 */
export function CertificateView({
  certificate,
  name,
  onBack,
  readOnly = false,
}: {
  certificate: Certificate;
  name: string;
  onBack: () => void;
  /** The Instructor's read-only view: no Save as PDF and no Share. */
  readOnly?: boolean;
}) {
  const [message, setMessage] = useState("");

  async function share() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Training completion certificate", url });
        return;
      } catch {
        // cancelled or refused: nothing more to do
        return;
      }
    }
    setMessage((await copyText(url)) ? "Link copied" : "Could not copy the link");
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div data-print-hide>
        <PageHeaderBand title="Certificate" back={{ label: "Back", onClick: onBack }} />
      </div>
      <article
        data-certificate
        aria-label="Training completion certificate"
        className="flex flex-col gap-4 rounded-card border border-sand-200 bg-sand-50 p-8"
      >
        <p className="type-label text-text-secondary">Training completion certificate</p>
        <h2 data-certificate-name className="type-page-title break-words">
          {name}
        </h2>
        <p className="type-body">has passed</p>
        <p className="type-card-title">{certificate.examTitle}</p>
        <dl className="type-small flex flex-col gap-1 border-t border-sand-200 pt-4">
          <div className="flex justify-between gap-3">
            <dt className="text-text-secondary">Date</dt>
            <dd data-certificate-date>{certificateDate(certificate.date)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-text-secondary">Result</dt>
            <dd data-certificate-result>{correctLine(certificate)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-text-secondary">Certificate number</dt>
            <dd data-certificate-id>{certificate.id}</dd>
          </div>
        </dl>
        <p className="type-small text-text-secondary">{CERTIFICATE_FOOTER}</p>
      </article>
      {!readOnly && (
        <div data-print-hide className="flex flex-col gap-3">
          <Button onClick={() => window.print()}>Save as PDF</Button>
          <Button variant="secondary" onClick={() => void share()}>
            Share
          </Button>
          <p role="status" className="type-small text-center text-text-secondary">
            {message}
          </p>
        </div>
      )}
    </div>
  );
}
