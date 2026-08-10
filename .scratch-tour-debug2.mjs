import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
const page = await context.newPage();
await page.goto("http://localhost:5173/calculate", { waitUntil: "networkidle" });
await page.waitForTimeout(500);

const info = await page.evaluate(() => {
  const direct = document.querySelector("calculator-page");
  const shell = document.querySelector("app-shell");
  const viaShell = shell?.shadowRoot?.querySelector("calculator-page");
  return {
    directFound: !!direct,
    shellFound: !!shell,
    viaShellFound: !!viaShell,
  };
});
console.log(JSON.stringify(info, null, 2));

await browser.close();
