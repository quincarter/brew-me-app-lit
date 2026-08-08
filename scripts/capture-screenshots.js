import { chromium } from "playwright";
import { createServer } from "vite";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const screenshotsDir = path.join(rootDir, "screenshots");

if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

async function capture() {
  console.log("Starting Vite server...");
  const server = await createServer({
    configFile: path.join(rootDir, "vite.config.ts"),
    root: rootDir,
    server: { port: 5199 },
  });
  await server.listen();
  const baseUrl = `http://localhost:5199`;
  console.log(`Server listening at ${baseUrl}`);

  console.log("Launching Playwright browser...");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const pagesToCapture = [
    { name: "home.png", path: "/" },
    { name: "calculator.png", path: "/calculate" },
    { name: "saved.png", path: "/saved" },
    { name: "timer.png", path: "/timer" },
    { name: "more.png", path: "/more" },
    { name: "guide-detail.png", path: "/more/guide/v60" },
    { name: "aeropress-recipes.png", path: "/more/aeropress-recipes" },
    { name: "v60-recipes.png", path: "/more/v60-recipes" },
    { name: "settings.png", path: "/more/settings" },
  ];

  for (const item of pagesToCapture) {
    console.log(`Capturing ${item.name} (${item.path})...`);
    await page.goto(`${baseUrl}${item.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const outputPath = path.join(screenshotsDir, item.name);
    await page.screenshot({ path: outputPath, fullPage: false });
  }

  console.log("Screenshots captured successfully!");
  await browser.close();
  await server.close();
  process.exit(0);
}

capture().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
