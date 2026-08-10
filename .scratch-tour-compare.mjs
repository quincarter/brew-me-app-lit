import { chromium } from "playwright";

const OUT =
  "/private/tmp/claude-501/-Users-quincarter-Documents-Dev-brew-me-app-lit/198b8c22-8f07-4b91-a8bf-30fc0b27f4cc/scratchpad";
const browser = await chromium.launch();

for (const theme of ["light", "dark"]) {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    colorScheme: theme,
  });
  const page = await context.newPage();
  await page.goto("http://localhost:5173/more/guide/v60", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/compare-${theme}-no-tour.png` });
  await context.close();
}

await browser.close();
