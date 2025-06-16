const fs = require('fs');
const path = require('path');
const os = require('os');

const dir = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), '.cache', 'ms-playwright');
function installed() {
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir).some(e => e.startsWith('chromium_headless_shell')); 
}
if (!installed()) {
  console.log('Playwright browsers not installed, skipping e2e tests');
  process.exit(1);
}

