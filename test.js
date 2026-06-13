const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    const filePath = 'file:///' + path.resolve('dist/register.html').replace(/\\/g, '/');
    console.log('Navigating to', filePath);
    
    await page.goto(filePath);
    await page.waitForTimeout(2000); // Wait for scripts to load
    
    // Select team size 6
    console.log('Selecting team size 6');
    await page.selectOption('#teamSize', '6');
    
    await page.waitForTimeout(1000);
    
    const slots = await page.$$('.player-slot');
    console.log('Found player slots:', slots.length);
    
    await browser.close();
})();
