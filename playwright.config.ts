import { defineConfig, devices } from "@playwright/test";

/**
 * Phone-sized checks of the session flow (DESIGN.md: Session screens). Run with `npm run test:e2e`
 * while nothing else uses port 3100: it starts the production build itself.
 * The two small viewports stand for a browser with top and bottom toolbars, such as an in-app browser.
 */
const small = (width: number, height: number) => ({
  ...devices["iPhone 13"],
  viewport: { width, height },
});

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: "http://localhost:3100" },
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 240_000,
  },
  projects: [
    { name: "iPhone 13 (WebKit)", use: { ...devices["iPhone 13"] } },
    { name: "iPhone SE (WebKit)", use: { ...devices["iPhone SE"] } },
    { name: "Pixel 7 (Chromium)", use: { ...devices["Pixel 7"] } },
    { name: "Small 390x640 (WebKit)", use: small(390, 640) },
    { name: "Small 375x560 (WebKit)", use: small(375, 560) },
  ],
});
