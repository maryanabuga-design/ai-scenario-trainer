import { describe, expect, it } from "vitest";
import { shellKindOf } from "@/components/ShellChrome/shell-kind";

describe("shellKindOf", () => {
  it("every instructor route is the instructor shell, whatever the role is", () => {
    for (const path of ["/instructor", "/instructor/exams", "/instructor/students/stu-01"]) {
      expect(shellKindOf(path, "loading")).toBe("instructor");
      expect(shellKindOf(path, "student")).toBe("instructor");
    }
  });

  it("the shared routes follow the stored role, and the phone layout is kept until it is read", () => {
    for (const path of ["/profile", "/profile/edit", "/notifications", "/about"]) {
      expect(shellKindOf(path, "instructor")).toBe("instructor");
      expect(shellKindOf(path, "student")).toBe("student");
      expect(shellKindOf(path, "loading")).toBe("student");
    }
  });

  it("the student's routes never use the instructor shell", () => {
    for (const path of ["/", "/materials", "/instructorial", "/exam"]) {
      expect(shellKindOf(path, "instructor")).toBe("student");
    }
  });
});
