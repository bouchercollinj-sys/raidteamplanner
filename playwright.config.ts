import { defineConfig, devices } from '@playwright/test'

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
const port = process.env.E2E_PORT ?? '43127'
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: executablePath
      ? {
          executablePath,
          args: ['--no-sandbox'],
        }
      : undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx vite dev --host 0.0.0.0 --port ${port}`,
    url: baseURL,
    reuseExistingServer: true,
  },
})
