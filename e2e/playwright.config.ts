import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "list",
	use: {
		trace: "on-first-retry",
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},

		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},

		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},
	],

	webServer: [
		{
			command: "pnpm start:e2e",
			url: "http://localhost:3000",
			reuseExistingServer: !process.env.CI,
			env: {
				NEXT_PUBLIC_API_URL: "http://localhost:8000",
			},
			timeout: 120000,
			cwd: "../../client",
			stderr: "ignore",
		},
	],
});
