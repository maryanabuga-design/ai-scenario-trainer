import { describe, expect, it } from "vitest";
import {
  CERTIFICATE_FOOTER,
  certificateCode,
  certificateDate,
  cleanCertificates,
  correctLine,
  earnsCertificate,
  withCertificate,
} from "@/lib/certificates";
import type { Certificate } from "@/lib/certificates";

const now = new Date(2026, 9, 23, 12, 0).getTime();
const input = (correct: number, attemptAt = 1, total = 20) => ({
  accountId: "ana@example.com",
  examTitle: "Evacuation basics exam",
  correct,
  total,
  attemptAt,
  now,
});

describe("who earns a certificate", () => {
  it("is a score at or above the pass mark (80%)", () => {
    expect(earnsCertificate(16, 20)).toBe(true);
    expect(earnsCertificate(20, 20)).toBe(true);
    expect(earnsCertificate(15, 20)).toBe(false);
    expect(earnsCertificate(0, 20)).toBe(false);
    expect(earnsCertificate(0, 0)).toBe(false);
    expect(earnsCertificate(4, 5)).toBe(true);
  });
});

describe("creating certificates", () => {
  it("is created only on a pass", () => {
    expect(withCertificate([], input(15))).toEqual([]);
    const made = withCertificate([], input(17));
    expect(made).toHaveLength(1);
    expect(made[0]).toMatchObject({
      accountId: "ana@example.com",
      examTitle: "Evacuation basics exam",
      date: now,
      correct: 17,
      total: 20,
      passMark: 80,
      attemptAt: 1,
    });
    expect(made[0].id).toBe("QT-2026-0001");
  });

  it("numbers them in order, newest first, one per attempt", () => {
    let list = withCertificate([], input(17, 1));
    list = withCertificate(list, input(18, 2));
    expect(list.map((c) => c.id)).toEqual(["QT-2026-0002", "QT-2026-0001"]);
    // the same attempt again: nothing new
    expect(withCertificate(list, input(18, 2))).toBe(list);
    expect(withCertificate(list, input(14, 3))).toBe(list);
  });

  it("makes a short code with the year and at least 4 digits", () => {
    expect(certificateCode(2026, 42)).toBe("QT-2026-0042");
    expect(certificateCode(2027, 12345)).toBe("QT-2027-12345");
  });
});

describe("tolerant loading", () => {
  const good: Certificate = {
    id: "QT-2026-0042",
    accountId: "a@b.co",
    examTitle: "Exam",
    date: 5,
    correct: 17,
    total: 20,
    passMark: 80,
    attemptAt: 5,
  };

  it("drops broken records without throwing", () => {
    const loaded = cleanCertificates([
      good,
      null,
      "x",
      { ...good, id: "bad" },
      { ...good, id: "QT-2026-0043", total: 0 },
      { ...good, id: "QT-2026-0044", correct: 25 },
      { ...good, id: "QT-2026-0045", date: "soon" },
      { ...good, id: "QT-2026-0046", date: 9, passMark: undefined, attemptAt: undefined },
      good,
    ]);
    expect(loaded!.map((c) => c.id)).toEqual(["QT-2026-0046", "QT-2026-0042"]);
    expect(loaded![0].passMark).toBe(80);
    expect(cleanCertificates("garbage")).toBeNull();
    expect(cleanCertificates([])).toBeNull();
    expect(cleanCertificates(null)).toBeNull();
  });
});

describe("texts", () => {
  it("formats the date and the count, and keeps the not-official footer", () => {
    expect(certificateDate(now)).toBe("23 Oct 2026");
    expect(correctLine({ correct: 17, total: 20 })).toBe("17 of 20 correct");
    expect(CERTIFICATE_FOOTER).toBe("Prototype certificate, not an official document.");
  });
});
