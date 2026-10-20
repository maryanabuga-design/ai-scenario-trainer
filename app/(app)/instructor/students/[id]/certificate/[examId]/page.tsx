"use client";

import { useParams, useRouter } from "next/navigation";
import { StudentNotFound } from "@/components/InstructorStudents/StudentDetailView";
import { CertificateView } from "@/components/CertificateView/CertificateView";
import { useAuth } from "@/lib/auth";
import { localStatus, participants } from "@/lib/cohort";
import { useAttempts, useGroupExams } from "@/lib/group-store";

/** The read-only certificate of a local student's Certified exam result (no Save as PDF, no Share). */
export default function StudentCertificatePage() {
  const params = useParams<{ id: string; examId: string }>();
  const router = useRouter();
  const auth = useAuth();
  const exams = useGroupExams();
  const attempts = useAttempts();
  if (auth === "loading" || exams === "loading" || attempts === "loading") return null;

  const id = decodeURIComponent(params.id);
  const person = participants(auth.accounts).find((entry) => entry.id === id && entry.local);
  const exam = exams.find((entry) => entry.id === params.examId);
  const status = person && exam ? localStatus(attempts, person.id, exam.id) : null;
  if (!person || !exam || status?.kind !== "certified" || !status.certificateId) {
    return <StudentNotFound />;
  }
  const attempt = attempts.find((a) => a.certificateId === status.certificateId)!;
  return (
    <CertificateView
      readOnly
      name={person.name}
      certificate={{
        id: status.certificateId,
        accountId: person.id,
        examTitle: exam.title,
        date: attempt.finishedAt,
        correct: status.correct,
        total: status.total,
        passMark: exam.passMark,
        attemptAt: attempt.finishedAt,
      }}
      onBack={() => router.push(`/instructor/students/${encodeURIComponent(person.id)}`)}
    />
  );
}
