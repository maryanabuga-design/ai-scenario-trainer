import { expect, test } from "@playwright/test";

test("the /screens review page opens (it is not development-only) and makes no third-party request", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    const url = r.url();
    if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
  });
  const response = await page.goto("/screens");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Screen review", level: 1 })).toBeVisible();
  await expect(page.locator("figure").first()).toBeVisible();
  expect(requests.filter((url) => !url.startsWith("http://localhost"))).toEqual([]);
});
