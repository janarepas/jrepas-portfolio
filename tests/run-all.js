import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const suites = ['site', 'runtime', 'seo', 'ux', 'motion', 'faq', 'sizing'];
const failed = [];
for (const suite of suites) {
  console.log(`\n=== ${suite} ===`);
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(`./${suite}-browser.js`, import.meta.url))], {
    stdio: 'inherit',
    timeout: 180_000,
  });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) failed.push(suite);
}
console.log(failed.length ? `Failed suites: ${failed.join(', ')}` : 'All seven browser suites passed.');
process.exitCode = failed.length ? 1 : 0;
