import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 3,
  retries: 0,
  timeout: 25000,
  reporter: [['list'], ['html', {open:'never'}]],
  use: {baseURL:'http://127.0.0.1:4318', channel:process.env.TEST_BROWSER_CHANNEL || 'chrome', headless:true, screenshot:'only-on-failure'},
  webServer: {command:'node server.mjs', env:{PORT:'4318'}, url:'http://127.0.0.1:4318/api/health', reuseExistingServer:false},
});
