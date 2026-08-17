const { test, expect } = require('@playwright/test');

const stubExternalAssets = async (context) => {
  await context.route('https://liuh886.github.io/**', async route => {
    const url = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: url.endsWith('.css') ? 'text/css' : 'application/javascript',
      body: '',
    });
  });
  await context.route('https://challenges.cloudflare.com/**', route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: 'window.turnstile={render(){return "test-widget"},reset(){}};',
  }));
};

test('Buchikui case switching is non-blocking, safe and mobile-contained', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await stubExternalAssets(context);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('http://127.0.0.1:4173/?case=rental', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#heroTitle')).toContainText('租车维权');

  const blockingLocalScripts = await page.locator('script[src]').evaluateAll(nodes => nodes
    .filter(node => !/^https?:\/\//i.test(node.getAttribute('src') || ''))
    .filter(node => !node.defer)
    .map(node => node.getAttribute('src')));
  expect(blockingLocalScripts).toEqual([]);

  const unsafeHrefs = await page.locator('#routeGrid a, #sourceList a').evaluateAll(nodes => nodes
    .map(node => node.getAttribute('href') || '')
    .filter(href => /^javascript:/i.test(href)));
  expect(unsafeHrefs).toEqual([]);

  const beforeTitle = await page.locator('#heroTitle').innerText();
  await page.locator('#caseSwitcherTrigger').click();
  await page.locator('.case-switcher-item:not(.active)').first().click();
  await expect(page.locator('body')).not.toHaveClass(/case-changing/);
  await expect(page.locator('#heroTitle')).not.toHaveText(beforeTitle);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#caseSwitcherTrigger').click();
  await expect(page.locator('#caseSwitcherPopover')).toBeVisible();

  const scrollState = await page.evaluate(() => ({
    bodyOverflow: getComputedStyle(document.body).overflow,
    overscroll: getComputedStyle(document.querySelector('#caseSwitcherPopover')).overscrollBehavior,
    bodyY: window.scrollY,
  }));
  expect(scrollState.bodyOverflow).toBe('hidden');
  expect(scrollState.overscroll).toContain('contain');

  const popover = page.locator('#caseSwitcherPopover');
  await popover.hover();
  await page.mouse.wheel(0, 900);
  const afterScroll = await page.evaluate(() => ({
    bodyY: window.scrollY,
    popoverY: document.querySelector('#caseSwitcherPopover').scrollTop,
  }));
  expect(afterScroll.bodyY).toBe(scrollState.bodyY);
  expect(afterScroll.popoverY).toBeGreaterThan(0);

  await page.screenshot({ path: 'issue39-mobile.png', fullPage: false });
  expect(errors).toEqual([]);
  await context.close();
});
