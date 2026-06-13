const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    console.log('Navigating to local server...');
    
    await page.goto('http://localhost:3000/register.html');
    await page.waitForTimeout(2000); // Wait for scripts to load
    
    // Select team size 6
    console.log('Selecting team size 6');
    await page.selectOption('#teamSize', '6');
    
    await page.waitForTimeout(1000);
    
    const slots = await page.$$('.player-slot');
    console.log('Found player slots:', slots.length);
    
    await browser.close();
})();
