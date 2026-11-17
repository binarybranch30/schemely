import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://127.0.0.1:3000",
    channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || undefined,
  },
});
