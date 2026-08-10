import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  colorScheme: "light",
});
const page = await context.newPage();
await page.goto("http://localhost:5173/more", { waitUntil: "networkidle" });
await page.waitForTimeout(300);

const tourRow = page.locator("brew-list-row", { hasText: "Take the tour" });
await tourRow.click();
await page.waitForTimeout(400);

for (let i = 0; i < 3; i++) {
  await page.getByRole("button", { name: "Next" }).first().click();
  await page.waitForTimeout(900);
}

// now on calculator-quick spotlight step. Read cutout inline style + card title.
const readOverlay = () => {
  const shell = document.querySelector("app-shell");
  const overlay = shell?.shadowRoot?.querySelector("brew-tour-overlay");
  const cutout = overlay?.shadowRoot?.querySelector(".cutout");
  const card = overlay?.shadowRoot?.querySelector(".card");
  const title = overlay?.shadowRoot?.querySelector(".title");
  return {
    cutoutStyle: cutout?.getAttribute("style"),
    cardStyle: card?.getAttribute("style"),
    titleText: title?.textContent,
  };
};

const info = await page.evaluate(readOverlay);
console.log("STEP calculator-quick:", JSON.stringify(info, null, 2));

await page.getByRole("button", { name: "Next" }).first().click();
await page.waitForTimeout(900);

const info2 = await page.evaluate(readOverlay);
console.log("STEP calculator-guided:", JSON.stringify(info2, null, 2));

await page.screenshot({
  path: "/private/tmp/claude-501/-Users-quincarter-Documents-Dev-brew-me-app-lit/198b8c22-8f07-4b91-a8bf-30fc0b27f4cc/scratchpad/debug-v60-step.png",
});

await browser.close();
