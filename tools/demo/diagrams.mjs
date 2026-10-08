// 설명 그림 만들기 — diagrams/*.html 을 그림으로 찍어 images/ko/frame-design/ 에 둔다.
//   node diagrams.mjs
import { chromium } from "playwright-core";
import { mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../../images/ko/frame-design");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1300, height: 800 }, deviceScaleFactor: 2 });
for (const f of readdirSync(join(HERE, "diagrams")).filter((x) => x.endsWith(".html"))) {
  await page.goto(pathToFileURL(join(HERE, "diagrams", f)).href, { waitUntil: "load" });
  await page.locator("#d").screenshot({ path: join(OUT, f.replace(/\.html$/, ".png")) });
  console.log("ok  ", f);
}
await browser.close();
