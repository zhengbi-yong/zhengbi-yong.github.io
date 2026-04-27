const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3001/admin/posts/new', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check the page
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type, placeholder: i.placeholder, name: i.name, id: i.id, className: i.className
    }));
  });
  console.log('INPUTS:', JSON.stringify(inputs, null, 2));

  // Fill using type selectors
  const emailInput = page.locator('input[type="email"]').first();
  const passInput = page.locator('input[type="password"]').first();

  if (await emailInput.count() > 0) {
    console.log('Filling email...');
    await emailInput.fill('demo2024@test.com');
    console.log('Filling password...');
    await passInput.fill('demo123456');
    await page.locator('button:has-text("登录")').click();
    await page.waitForTimeout(4000);
    console.log('URL after login:', page.url());
  } else {
    console.log('NO EMAIL INPUT FOUND');
  }

  // Now try code block
  try {
    const codeBtn = page.locator('button[title="代码块"]');
    console.log('Code block button count:', await codeBtn.count());
    await codeBtn.click({ timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.keyboard.type('const greeting = "hello world";');
    await page.waitForTimeout(2500);

    const state = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror');
      const nvc = editor?.querySelector('.node-view-content');
      const shikiPre = editor?.querySelector('[class*="shiki"]');
      const codeEl = editor?.querySelector('code');
      return {
        editorText: editor?.textContent?.substring(0, 100) || 'NO EDITOR',
        nvcText: nvc?.textContent?.substring(0, 100) || 'NO NVC',
        codeText: codeEl?.textContent?.substring(0, 100) || 'NO CODE',
        hasShiki: !!shikiPre,
        shikiHTML: shikiPre?.innerHTML?.substring(0, 100) || 'NONE'
      };
    });
    console.log('\nEDITOR STATE:');
    console.log('  editorText:', state.editorText);
    console.log('  nvcText:', state.nvcText);
    console.log('  codeText:', state.codeText);
    console.log('  hasShiki:', state.hasShiki, '|', state.shikiHTML.substring(0, 60));
  } catch(e) {
    console.log('CODEBLOCK ERROR:', e.message.substring(0, 150));
  }

  await browser.close();
  console.log('\nDONE');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
