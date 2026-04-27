const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3001/admin/posts/new');
  await page.waitForTimeout(2000);

  // Login
  await page.locator('input[type="email"]').first().fill('demo2024@test.com');
  await page.locator('input[type="password"]').first().fill('demo123456');
  await page.locator('button:has-text("登录")').click();
  await page.waitForTimeout(5000);

  // Wait for editor to fully load
  await page.waitForSelector('.ProseMirror', { timeout: 10000 });

  // Check all buttons
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => ({
      title: b.title, text: b.textContent?.trim().substring(0, 30), className: b.className.substring(0, 80)
    }));
  });
  console.log('ALL BUTTONS:', JSON.stringify(buttons, null, 2));

  // Also check toolbar specifically
  const toolbar = await page.evaluate(() => {
    const tb = document.querySelector('[class*="toolbar"], .toolbar, [class*="Toolbar"]');
    return tb ? tb.innerHTML.substring(0, 500) : 'NO TOOLBAR';
  });
  console.log('\nTOOLBAR:', toolbar);

  await browser.close();
  console.log('\nDONE');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
