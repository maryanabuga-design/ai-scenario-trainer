import { expect, test } from "@playwright/test";

test.describe("the build marker", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("/build.json names the commit and About this prototype shows the same short id", async ({
    page,
    request,
  }) => {
    const response = await request.get("/build.json");
    expect(response.ok()).toBe(true);
    const { build } = (await response.json()) as { build: string };
    expect(build).toMatch(/^[0-9a-f]{7}$|^dev$/);
    await page.goto("/about");
    await expect(page.locator("[data-build]")).toHaveText(`Build ${build}`);
  });
});
