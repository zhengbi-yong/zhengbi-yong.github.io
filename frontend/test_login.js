const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text().substring(0, 200));
  });

  await page.goto('http://localhost:3001/admin/posts/new');
  await page.waitForTimeout(2000);

  // Check what's on the page
  const pageInfo = await page.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      bodyText: document.body.innerText.substring(0, 300),
      hasLoginForm: !!document.querySelector('input[name="email"], input[placeholder*="邮箱"], input[placeholder*="email"]'),
      inputs: Array.from(document.querySelectorAll('input')).map(i => ({ placeholder: i.placeholder, type: i.type, name: i.name })),
    };
  });
  console.log('Page info:', JSON.stringify(pageInfo, null, 2));
  console.log('\nErrors:', errors.slice(-5));

  // Try to find login form
  const emailInput = page.locator('input[placeholder*="邮箱"], input[name="email"], input[type="email"]');
  if (await emailInput.count() > 0) {
    console.log('Found email input!');
    await emailInput.first().fill('admin@test.com');
  } else {
    console.log('NO EMAIL INPUT FOUND');
  }

  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
