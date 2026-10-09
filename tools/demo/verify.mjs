// 렌더링 검증: 문서마다 깨진 이미지와, 문서 안팎으로 가는 죽은 링크·앵커를 찾는다.
//   node verify.mjs <주소> <쪽>...   예) node verify.mjs http://localhost:3345 dashboard/frames
import { chromium } from "playwright-core";
const [base, ...pages] = process.argv.slice(2);
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, locale: "ko-KR" });
const ids = new Map(); // 쪽 경로 → 제목 id 목록 (없는 쪽이면 null)
async function load(path) {
  if (ids.has(path)) return ids.get(path);
  const res = await p.goto(`${base}/${path}`, { waitUntil: "networkidle", timeout: 120000 });
  await p.waitForTimeout(1200);
  const notFound = res.status() >= 400 || (await p.getByText(/Page not found/).count()) > 0; // 본문에 "404"가 나오는 쪽이 있어 숫자로는 판단하지 않는다
  const v = notFound ? null : await p.$$eval("h2[id], h3[id]", (h) => h.map((x) => x.id));
  ids.set(path, v);
  return v;
}
const found = [];
for (const s of pages) {
  const own = await load(s);
  const broken = await p.$$eval("img", (imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src.split("/").slice(-2).join("/")));
  const hrefs = await p.$$eval("#content-area a[href], #content a[href], article a[href]", (as) => [...new Set(as.map((a) => a.getAttribute("href")))].filter((h) => h.startsWith("#") || (h.startsWith("/") && !h.startsWith("//"))));
  console.log(`${s}: ${own ? "ok" : "없는 쪽"}, 제목 ${own?.length ?? 0}, 깨진 그림 ${broken.length} ${broken.join(" ")}, 내부 링크 ${hrefs.length}`);
  await p.screenshot({ path: `.tmp/doc-${s.replace(/\//g, "-")}.png`, fullPage: true });
  found.push([s, hrefs]);
}
let dead = 0;
for (const [s, hrefs] of found) for (const h of hrefs) {
  const [path, hash] = h.startsWith("#") ? [s, h.slice(1)] : [h.slice(1).split("#")[0], h.split("#")[1]];
  const target = await load(path);
  if (!target) { dead++; console.log(`  죽은 링크  ${s} → ${h}`); continue; }
  // 제목에 % 가 들어가면 앵커가 올바른 인코딩이 아니라 decodeURIComponent 가 던진다 — 그때는 원문 그대로 비교한다.
  const plain = (v) => { try { return decodeURIComponent(v); } catch { return v; } };
  if (hash && !target.includes(plain(hash)) && !target.includes(hash)) { dead++; console.log(`  죽은 앵커  ${s} → ${plain(h)}`); }
}
console.log(dead ? `문제 ${dead}건` : "죽은 링크·앵커 없음");
await b.close();
