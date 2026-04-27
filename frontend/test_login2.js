const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // First: login
  await page.goto('http://localhost:3001/admin/login');
  await page.waitForTimeout(1500);

  const loginPageInfo = await page.evaluate(() => ({
    url: window.location.href,
    bodyText: document.body.innerText.substring(0, 200),
    inputs: Array.from(document.querySelectorAll('input')).map(i => ({placeholder: i.placeholder, type: i.type}))
  }));
  console.log('LOGIN PAGE:', JSON.stringify(loginPageInfo, null, 2));

  // Login
  await page.locator('input[type="email"], input[placeholder*="邮箱"]').first().fill('admin@test.com');
  await page.locator('input[type="password"]').first().fill('xK9#mP2$vL8@nQ5*wR4');
  await page.locator('button[type="submit"], button:has-text("登录")').first().click();

  await page.waitForTimeout(3000);
  console.log('AFTER LOGIN URL:', page.url());

  // Now go to new post page
  await page.goto('http://localhost:3001/admin/posts/new');
  await page.waitForTimeout(3000);
  console.log('NEW POST URL:', page.url());

  // Check editor
  const editorInfo = await page.evaluate(() => {
    const editor = document.querySelector('.ProseMirror');
    return {
      hasEditor: !!editor,
      editorText: editor ? editor.textContent.substring(0, 200) : 'NO EDITOR'
    };
  });
  console.log('EDITOR:', JSON.stringify(editorInfo));

  // Click code block
  const codeBtn = page.locator('button[title="代码块"]');
  if (await codeBtn.count() > 0) {
    await codeBtn.click();
    await page.waitForTimeout(500);
    await page.keyboard.type('const x = 42;');
    await page.waitForTimeout(2000);

    const afterState = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror');
      const nvc = editor ? editor.querySelector('.node-view-content') : null;
      const pre = editor ? editor.querySelector('pre.shiki') : null;
      return {
        text: editor ? editor.textContent.substring(0, 200) : '',
        nvcText: nvc ? nvc.textContent : '',
        hasShiki: !!pre,
        shikiHTML: pre ? pre.innerHTML.substring(0, 100) : ''
      };
    });
    console.log('\nAFTER TYPING:');
    console.log('  text:', afterState.text);
    console.log('  nvcText:', afterState.nvcText);
    console.log('  hasShiki:', afterState.hasShiki);
    console.log('  shikiHTML:', afterState.shikiHTML);
  } else {
    console.log('CODE BUTTON NOT FOUND');
  }

  await browser.close();
  console.log('\nDONE');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
