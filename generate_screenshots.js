
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  
  const takeScreenshots = async (prefix) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    
    // 1. Explore page
    const page1 = await context.newPage();
    await page1.goto('http://localhost:3000/explore/Naples', { waitUntil: 'networkidle' });
    await page1.waitForTimeout(2000);
    await page1.screenshot({ path: \\_explore.png\, fullPage: true });
    
    // 2. Map page
    const page2 = await context.newPage();
    await page2.goto('http://localhost:3000/Florida-Real-Estate-Search/Naples?view=map', { waitUntil: 'networkidle' });
    await page2.waitForTimeout(2000);
    // Click 'Map Options' button
    try {
      await page2.click('text=Map Options');
      await page2.waitForTimeout(1000);
    } catch(e) {}
    await page2.screenshot({ path: \\_map.png\ });
    
    await context.close();
  };

  // Currently we are in 'after' state (assuming stash popped, wait, check git status)
  await takeScreenshots('after');
  
  await browser.close();
})();

