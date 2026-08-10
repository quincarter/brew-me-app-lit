import { chromium } from "playwright";

const OUT =
  process.argv[2] ||
  "/private/tmp/claude-501/-Users-quincarter-Documents-Dev-brew-me-app-lit/198b8c22-8f07-4b91-a8bf-30fc0b27f4cc/scratchpad";
const BASE = "http://localhost:5173";

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "desktop", width: 1280, height: 800 },
];

const browser = await chromium.launch();

for (const vp of viewports) {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: theme,
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/more`, { waitUntil: "networkidle" });
    // ensure our theme actually applied - app may use its own toggle/localStorage
    await page.waitForTimeout(300);

    // click "Take the tour" row
    const tourRow = page.locator("brew-list-row", { hasText: "Take the tour" });
    await tourRow.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${vp.name}-${theme}-01-welcome-slide.png` });

    // step through: home-welcome -> more-page
    await page.getByRole("button", { name: "Next" }).first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${vp.name}-${theme}-02-more-slide.png` });

    // more-page -> brew-guide-example
    await page.getByRole("button", { name: "Next" }).first().click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${vp.name}-${theme}-03-guide-slide.png` });

    // brew-guide-example -> calculator-quick (spotlight)
    await page.getByRole("button", { name: "Next" }).first().click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${vp.name}-${theme}-04-spotlight-quick-calc.png` });

    // calculator-quick -> calculator-guided (spotlight)
    await page.getByRole("button", { name: "Next" }).first().click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${vp.name}-${theme}-05-spotlight-v60.png` });

    // final slide
    await page.getByRole("button", { name: "Next" }).first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${vp.name}-${theme}-06-final-slide.png` });

    await context.close();
  }
}

await browser.close();
console.log("done");
