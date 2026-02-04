import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL: process.env.WEB_BASE ?? "http://localhost:3000",
    headless: true,
    trace: "retain-on-failure",
  },
});
