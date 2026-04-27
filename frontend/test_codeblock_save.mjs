import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Collect console errors
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});

// Login
console.log('1. Logging in...');
await page.goto('http://192.168.0.161:3001/admin/posts/new');
await page.waitForLoadState('networkidle');
await page.fill('input[type="email"], input[placeholder*="邮箱"]', 'admin@test.com');
await page.fill('input[type="password"]', 'xK9#mP2$vL8@nQ5*wR4');
await page.click('button[type="submit"], button:has-text("登录")');
await page.waitForLoadState('networkidle');
console.log('   Logged in.');

// Insert code block
console.log('2. Inserting code block...');
await page.click('button:has-text("{ }")');
await page.waitForTimeout(500);

// Type code content
const editor = page.locator('.ProseMirror').first();
await editor.click();
await page.keyboard.type(`const greeting = "hello world";
console.log(greeting);`);

const domContent = await page.evaluate(() => document.querySelector('.ProseMirror')?.textContent);
console.log('   DOM text:', domContent?.slice(0, 80));

// Fill title
console.log('3. Filling title...');
await page.fill('input[placeholder*="标题"]', 'Shiki代码块验证测试');

// Select category via React state manipulation
console.log('4. Selecting category...');
await page.evaluate(() => {
  // Find the combobox and trigger React state change
  const combobox = document.querySelector('[role="combobox"]');
  if (combobox) {
    // Dispatch events to trigger React state
    combobox.dispatchEvent(new Event('mousedown', { bubbles: true }));
  }
});
await page.waitForTimeout(300);

// Select 计算机科学 via keyboard
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(100);
await page.keyboard.press('ArrowDown'); // Skip "选择分类"
await page.waitForTimeout(100);
await page.keyboard.press('Enter');
await page.waitForTimeout(300);

const categoryValue = await page.evaluate(() => {
  const combobox = document.querySelector('[role="combobox"]');
  return combobox?.textContent;
});
console.log('   Category:', categoryValue);

// Save draft
console.log('5. Saving draft...');
await page.click('button:has-text("保存草稿")');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

// Check for errors during save
if (errors.length > 0) {
  console.log('   Console errors:', errors.slice(0, 3));
} else {
  console.log('   No console errors during save.');
}

// Navigate to posts list
console.log('6. Navigating to posts list...');
await page.goto('http://192.168.0.161:3001/admin/posts');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);

// Find the saved article
const firstTitle = await page.locator('table tbody tr:first-child td:nth-child(2)').textContent();
console.log('   First article:', firstTitle);

// Click edit on first article
console.log('7. Clicking edit on first article...');
await page.locator('table tbody tr:first-child td:last-child a, table tbody tr:first-child a:has-text("编辑")').click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

// Check ProseMirror content after reload
const reloadContent = await page.evaluate(() => document.querySelector('.ProseMirror')?.textContent);
console.log('   After reload DOM text:', reloadContent?.slice(0, 100));

// Check if code is complete
if (reloadContent?.includes('greeting') && reloadContent?.includes('hello world')) {
  console.log('✅ SUCCESS: Code block content saved and loaded correctly!');
} else if (reloadContent?.includes('const')) {
  console.log('⚠️ PARTIAL: Some code present but may be truncated');
} else {
  console.log('❌ FAIL: Code block content NOT saved correctly');
  console.log('   Full content:', reloadContent);
}

if (errors.length > 0) {
  console.log('\nConsole errors found:');
  errors.forEach(e => console.log('  -', e.slice(0, 200)));
}

await browser.close();
console.log('\nDone.');
