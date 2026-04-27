const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3001/admin/posts/new', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const pageUrl = page.url();
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 300));
  console.log('URL:', pageUrl);
  console.log('BODY:', bodyText);

  // Try login
  try {
    await page.getByPlaceholder('邮箱').fill('admin@test.com');
    await page.getByPlaceholder('密码').fill('xK9#mP2$vL8@nQ5*wR4');
    await page.getByRole('button', { name: '登录' }).click();
    await page.waitForTimeout(3000);
    console.log('AFTER LOGIN URL:', page.url());
  } catch(e) {
    console.log('LOGIN ERROR:', e.message.substring(0, 150));
  }

  // Try code block
  try {
    await page.locator('button[title="代码块"]').click();
    await page.waitForTimeout(1000);
    await page.keyboard.type('const x = 42;');
    await page.waitForTimeout(2000);

    const state = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror');
      const nvc = editor?.querySelector('.node-view-content');
      const shikiPre = editor?.querySelector('pre.shiki, [class*="shiki"]');
      return {
        text: editor?.textContent?.substring(0, 100) || 'NO EDITOR',
        nvcText: nvc?.textContent?.substring(0, 100) || 'NO NVC',
        hasShiki: !!shikiPre,
        shikiHTML: shikiPre?.innerHTML?.substring(0, 100) || 'NONE'
      };
    });
    console.log('\nEDITOR STATE:');
    console.log('  text:', state.text);
    console.log('  nvcText:', state.nvcText);
    console.log('  hasShiki:', state.hasShiki);
    console.log('  shikiHTML:', state.shikiHTML);
  } catch(e) {
    console.log('CODEBLOCK ERROR:', e.message.substring(0, 150));
  }

  await browser.close();
  console.log('\nDONE');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
