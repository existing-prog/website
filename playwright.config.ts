import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: process.env.TEST_URL || "http://127.0.0.1:4173/website/",
    headless: true,
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        launchOptions: {
          executablePath: process.env.CHROMIUM_PATH || undefined,
          args: ["--no-sandbox"],
        },
      },
    },
    ...(process.env.TEST_WEBKIT
      ? [{ name: "webkit", use: { browserName: "webkit" as const } }]
      : []),
  ],
  webServer: process.env.TEST_URL
    ? undefined
    : {
        command: "npm run preview -- --port 4173",
        url: "http://127.0.0.1:4173/website/",
        reuseExistingServer: !process.env.CI,
      },
  reporter: "list",
});
