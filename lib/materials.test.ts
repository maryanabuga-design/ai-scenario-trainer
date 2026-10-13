import { describe, expect, it } from "vitest";
import {
  fileTypeLabel,
  formatAdded,
  formatSize,
  materialFromUpload,
  materialKind,
  metaLine,
  sampleMaterials,
  simulateUpload,
} from "@/lib/materials";
import type { Material } from "@/lib/materials";

describe("sample materials", () => {
  it("has one ready guide with a scenario and one item in each other state", () => {
    expect(sampleMaterials.filter((material) => material.hasScenario).map((m) => m.id)).toEqual([
      "evacuation-guide",
    ]);
    const states = sampleMaterials.map((material) => material.status);
    expect(states).toContain("processing");
    expect(states).toContain("failed");
    sampleMaterials
      .filter((material) => material.status === "failed")
      .forEach((material) => expect(material.reason).toBeTruthy());
  });
});

describe("simulated upload", () => {
  it("accepts PDF, Word and text files up to 20 MB", () => {
    expect(simulateUpload({ name: "Notes.DOCX", size: 120_000 })).toEqual({
      status: "ready",
      type: "Word document",
    });
    expect(simulateUpload({ name: "guide.pdf", size: 20 * 1024 * 1024 }).status).toBe("ready");
  });

  it("fails images and scans with a clear reason", () => {
    const outcome = simulateUpload({ name: "poster.jpg", size: 500_000 });
    expect(outcome.status).toBe("failed");
    expect(outcome.status === "failed" && outcome.reason).toMatch(/no readable text/);
  });

  it("fails files over 20 MB and unsupported types", () => {
    const big = simulateUpload({ name: "manual.pdf", size: 21 * 1024 * 1024 });
    expect(big.status === "failed" && big.reason).toMatch(/20 MB/);
    const zip = simulateUpload({ name: "archive.zip", size: 1000 });
    expect(zip.status === "failed" && zip.reason).toMatch(/not supported/);
  });

  it("builds a material from the file's name and size only", () => {
    const now = new Date("2026-10-08T10:00:00Z");
    const file = { name: "drill.pdf", size: 2_621_440 };
    const material = materialFromUpload(file, simulateUpload(file), now);
    expect(material).toMatchObject({
      name: "drill.pdf",
      type: "PDF",
      size: "2.5 MB",
      added: "2026-10-08",
      status: "ready",
      hasScenario: false,
      uploaded: true,
    });
  });

  it("formats sizes", () => {
    expect(formatSize(900)).toBe("900 B");
    expect(formatSize(84_000)).toBe("82 KB");
  });
});

describe("file-type tags", () => {
  it("gives every material a short label", () => {
    expect(fileTypeLabel("PDF")).toBe("PDF");
    expect(fileTypeLabel("PDF (scanned)")).toBe("PDF");
    expect(fileTypeLabel("Word document")).toBe("DOCX");
    expect(fileTypeLabel("Link")).toBe("LINK");
    expect(fileTypeLabel("Image")).toBe("JPG");
  });
});

describe("material types", () => {
  const link: Material = {
    id: "link",
    name: "Article: Planning a workplace evacuation drill",
    type: "Link",
    url: "example.org/evacuation-drill",
    added: "2026-10-01",
    status: "ready",
    hasScenario: false,
  };

  it("supports PDF, DOCX and LINK", () => {
    expect(materialKind("PDF")).toBe("document");
    expect(materialKind("Word document")).toBe("document");
    expect(materialKind("Link")).toBe("link");
    expect(fileTypeLabel("Link")).toBe("LINK");
  });

  it("describes a LINK as a web page with its site and date, without a file size", () => {
    expect(metaLine(link)).toBe("Web page · example.org · 1 Oct 2026");
  });

  it("describes a file by its type, size and date", () => {
    const guide = sampleMaterials.find((material) => material.id === "evacuation-guide")!;
    expect(metaLine(guide)).toBe(`PDF · 1.2 MB · ${formatAdded(guide.added)}`);
  });

  it("keeps the sample link an address, not a size", () => {
    const article = sampleMaterials.find((material) => material.type === "Link")!;
    expect(article.size).toBeUndefined();
    expect(article.url).toBe("example.org/evacuation-drill");
  });
});
