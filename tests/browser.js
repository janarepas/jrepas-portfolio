import { chromium } from 'playwright';

// Use Playwright's version-matched Chromium unless explicitly overridden.
export function launchBrowser() {
  const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
  return chromium.launch(executablePath ? { executablePath } : {});
}
