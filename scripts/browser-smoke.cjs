const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

async function main() {
  const environment = Object.fromEntries(readFileSync(process.argv[2], 'utf8').trim().split('\n').map(line => {
    const separator = line.indexOf('=');
    return [line.slice(0, separator), line.slice(separator + 1)];
  }));
  const refreshed = process.argv[3] === 'refreshed';
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ httpCredentials: {
      username: environment.EVIDENCE_BASIC_USER, password: environment.EVIDENCE_BASIC_PASSWORD,
    } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const expected = {
      freshness: ['customers', 'orders', 'payments', 'NEVER', 'FRESH', ...(refreshed ? [] : ['STALE'])],
      reconciliation: ['MATCH', 'MISSING', 'CURRENCY', 'DUPLICATE', 'ORPHAN', ...(refreshed ? [] : ['MISMATCH'])],
    };
    for (const [route, values] of Object.entries(expected)) {
      await page.goto(`${process.env.BASE_URL || 'http://127.0.0.1:18309'}/${route}`);
      await page.waitForFunction(({ values }) => {
        const table = document.querySelector('table');
        return table && values.every(value => table.innerText.includes(value));
      }, { values }, { timeout: 45000 });
      const rows = await page.locator('table tbody tr').allTextContents();
      assert.equal(rows.length, route === 'freshness' ? 3 : 6);
      if (route === 'freshness' && refreshed) assert.ok(rows.find(row => row.includes('payments')).includes('FRESH'));
      if (route === 'reconciliation' && refreshed) assert.ok(!rows.some(row => row.includes('MISMATCH')));
      console.log(`PASS: hydrated ${route} ${rows.length} rows (${refreshed ? 'refreshed' : 'baseline'})`);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
