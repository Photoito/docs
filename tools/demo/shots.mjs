// 문서 스크린샷 캡처.
//   node shots.mjs            → shots/*.mjs 전부
//   node shots.mjs frames     → shots/frames.mjs 만
//
// 각 shots/<이름>.mjs 는 화면 목록을 default export 한다:
//   { name, path, run?(page, ctx), target?(page) }
//     name   → images/ko/<이름>/<name>.png
//     run    → 찍기 전에 할 조작(메뉴 열기, 파일 올리기 등)
//     target → 화면 전체 대신 이 요소만 찍는다
//     mark   → 누를 곳에 빨간 테두리와 번호를 그린다
//   묶음 단위로 `export const base`, `export const viewport` 를 줄 수 있다.
import { chromium } from "playwright-core";
import { mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.DEMO_BASE ?? "http://127.0.0.1:3412";
const OUT = resolve(HERE, "../../images/ko");

const CLOCK_OFFSET = Number(process.env.DEMO_CLOCK_OFFSET_HOURS || 0) * 3_600_000;

const only = process.argv.slice(2);
const files = readdirSync(join(HERE, "shots"))
  .filter((f) => f.endsWith(".mjs"))
  .filter((f) => only.length === 0 || only.includes(f.replace(/\.mjs$/, "")));

// "여기를 누르세요" 표시 — 요소 둘레에 빨간 테두리와 번호를 그린다.
// 문서 본문의 단계 번호와 맞추려고 번호는 배열 순서(1부터)다. 하나뿐이면 번호를 생략한다.
async function drawMarks(page, locators) {
  const boxes = [];
  for (const loc of locators) {
    await loc.scrollIntoViewIfNeeded();
    const b = await loc.boundingBox();
    if (!b) throw new Error("표시할 요소를 찾지 못했어요");
    boxes.push(b);
  }
  await page.evaluate((boxes) => {
    const pad = 5;
    boxes.forEach((b, i) => {
      const ring = document.createElement("div");
      ring.style.cssText = `position:fixed;z-index:2147483647;pointer-events:none;box-sizing:border-box;border:3px solid #e5484d;border-radius:12px;left:${b.x - pad}px;top:${b.y - pad}px;width:${b.width + pad * 2}px;height:${b.height + pad * 2}px;box-shadow:0 0 0 3px rgba(229,72,77,.18)`;
      document.body.appendChild(ring);
      if (boxes.length < 2) return;
      const badge = document.createElement("div");
      badge.textContent = String(i + 1);
      badge.style.cssText = `position:fixed;z-index:2147483647;pointer-events:none;left:${b.x - pad - 13}px;top:${b.y - pad - 13}px;width:26px;height:26px;border-radius:13px;background:#e5484d;color:#fff;font:700 15px/26px sans-serif;text-align:center`;
      document.body.appendChild(badge);
    });
  }, boxes);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
let failed = 0;

for (const file of files) {
  const group = file.replace(/\.mjs$/, "");
  // 화면 묶음은 주소(base)와 화면 크기(viewport)를 따로 정할 수 있다 — 키오스크 화면은 다른 서버다.
  const mod = await import(pathToFileURL(join(HERE, "shots", file)).href);
  const shots = mod.default;
  const base = mod.base ?? BASE;
  mkdirSync(join(OUT, group), { recursive: true });

  for (const shot of shots) {
    // 화면마다 새 컨텍스트 — 앞 화면의 열린 메뉴·선택 상태가 넘어오지 않게.
    const ctx = await browser.newContext({
      viewport: shot.viewport ?? mod.viewport ?? { width: 1200, height: 780 },
      deviceScaleFactor: 2,
      locale: "ko-KR",
      timezoneId: "Asia/Seoul"
    });
    await ctx.addCookies([{ name: "sidebar_state", value: "true", url: base }]);
    // 데모 서버의 시계를 밀었으면(fake-clock.cjs) 브라우저도 같은 만큼 민다.
    if (CLOCK_OFFSET) {
      await ctx.addInitScript((offset) => {
        const Real = Date;
        const realNow = Real.now.bind(Real);
        class Shifted extends Real {
          constructor(...args) {
            if (args.length === 0) super(realNow() + offset);
            else super(...args);
          }
          static now() {
            return realNow() + offset;
          }
        }
        Shifted.UTC = Real.UTC;
        Shifted.parse = Real.parse;
        globalThis.Date = Shifted;
      }, CLOCK_OFFSET);
    }
    const page = await ctx.newPage();
    const out = join(OUT, group, `${shot.name}.png`);
    try {
      await page.goto(base + shot.path, { waitUntil: mod.waitUntil ?? "networkidle", timeout: 120_000 });
      await page.waitForTimeout(800);
      if (shot.run) await shot.run(page, { here: HERE });
      await page.waitForTimeout(400);
      if (shot.mark) await drawMarks(page, await shot.mark(page));
      const target = shot.target ? await shot.target(page) : null;
      if (target) await target.screenshot({ path: out });
      else await page.screenshot({ path: out, fullPage: shot.fullPage ?? false });
      console.log(`ok   ${group}/${shot.name}`);
    } catch (e) {
      failed++;
      await page.screenshot({ path: out.replace(/\.png$/, ".FAILED.png") }).catch(() => {});
      console.log(`FAIL ${group}/${shot.name} → ${String(e.message).split("\n")[0].slice(0, 200)}`);
    }
    await ctx.close();
  }
}

await browser.close();
process.exit(failed ? 1 : 0);
