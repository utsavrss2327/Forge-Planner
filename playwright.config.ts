import { defineConfig } from "@playwright/test";
import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Keep browser tests completely separate from the developer's .data and credentials.
process.env.FORGE_E2E_DATA_DIR ??= mkdtempSync(
  join(tmpdir(), "forge-foundation-e2e-"),
);
const browser =
  process.env.FORGE_TEST_BROWSER === "webkit" ? "webkit" : "chromium";
const chrome =
  process.env.PLAYWRIGHT_CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  timeout: 90000,
  retries: 0,
  reporter: "list",
  outputDir: "test-results",
  use: {
    browserName: browser,
    hasTouch: browser === "webkit",
    actionTimeout: 15000,
    baseURL: "http://localhost:3100",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions:
      browser === "chromium" && existsSync(chrome)
        ? { executablePath: chrome }
        : {},
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/e2e-server.cjs",
    url: "http://localhost:3100/login",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      FORGE_DEMO_MODE: "true",
      FORGE_DATA_DIR: process.env.FORGE_E2E_DATA_DIR,
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      YOUTUBE_API_KEY: "",
      OPENAI_API_KEY: "",
      GEMINI_API_KEY: "",
      GROQ_API_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
    },
  },
});
