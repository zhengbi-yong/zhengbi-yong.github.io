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

  // Login
  await page.locator('input[type="email"]').first().fill('demo2024@test.com');
  await page.locator('input[type="password"]').first().fill('demo123456');
  await page.locator('button:has-text("登录")').click();
  await page.waitForTimeout(8000);

  // Get full page snapshot
  const snapshot = await page.evaluate(() => {
    return {
      url: window.location.href,
      hasEditor: !!document.querySelector('.ProseMirror, [contenteditable], .tiptap, [class*="editor"]'),
      hasProseMirror: !!document.querySelector('.ProseMirror'),
      hasCodeBtn: !!document.querySelector('button[title="代码块"]'),
      allButtonTitles: Array.from(document.querySelectorAll('button')).map(b => b.title || b.textContent?.trim().substring(0, 20)).filter(Boolean),
      bodyText: document.body.innerText.substring(0, 400)
    };
  });
  console.log('URL:', snapshot.url);
  console.log('HAS PROSEMIRROR:', snapshot.hasProseMirror);
  console.log('HAS CODE BTN:', snapshot.hasCodeBtn);
  console.log('BUTTONS:', JSON.stringify(snapshot.allButtonTitles));
  console.log('BODY:', snapshot.bodyText);
  console.log('\nERRORS:', errors.slice(-5));

  await browser.close();
  console.log('\nDONE');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
