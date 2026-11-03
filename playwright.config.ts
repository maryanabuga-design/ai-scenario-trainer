import { defineConfig, devices } from "@playwright/test";
import { signedInStudent } from "./e2e/auth-seed";

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
  // every test starts signed in as the demo student; the account tests start from an empty browser
  use: { baseURL: "http://localhost:3100", storageState: signedInStudent },
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 240_000,
  },
  // the baseline pictures of the phone layout live in their own folder, not in docs/screens
  snapshotPathTemplate: "tests/visual-baseline/{arg}{ext}",
  projects: [
    { name: "iPhone 13 (WebKit)", testIgnore: /visual\//, use: { ...devices["iPhone 13"] } },
    { name: "iPhone SE (WebKit)", testIgnore: /visual\//, use: { ...devices["iPhone SE"] } },
    { name: "Pixel 7 (Chromium)", testIgnore: /visual\//, use: { ...devices["Pixel 7"] } },
    { name: "Small 390x640 (WebKit)", testIgnore: /visual\//, use: small(390, 640) },
    { name: "Small 375x560 (WebKit)", testIgnore: /visual\//, use: small(375, 560) },
    // plain desktop Chromium: the width is set by each test, so one engine checks every width
    { name: "visual", testMatch: /visual\/.*\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
  ],
});
