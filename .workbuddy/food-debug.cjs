const { chromium } = require('playwright');
(async () => {
  const text = `早上：
吃了一笼小笼包，一碗鸭血粉丝汤，一杯豆浆。

中午：
吃了一碗米饭，一份大概 300g 的辣椒炒肉，一碗鸡蛋羹，半斤牛肉，300g 酸奶。

下午茶：
吃了 3 个鸡肉燕麦饭团，半斤麻辣花生米，两包蒜香面包干，半个黄庄月饼，一个蛋黄酥饼。`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 1200 } });
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  const input = page.getByRole('textbox', { name: /一碗面|实际/ }).first();
  await input.fill(text);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'output/playwright/food-recognition-debug.png', fullPage: true });
  const bodyText = await page.locator('body').innerText();
  console.log(bodyText);
  await browser.close();
})();
