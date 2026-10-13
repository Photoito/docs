/*
 * dist/ 검사: `bun check.ts` (build.ts 다음에).
 *  - 글로 남은 문법: 렌더되지 않은 태그(<Step …>), JSX 중괄호, **, ](, ``` 같은 글자
 *  - 컴포넌트 개수: MDX 의 <Step>·<Accordion>·<Frame>·<Card>·알림 상자 수와 HTML 의 수가 같은지
 *  - 안쪽 링크: 가는 쪽과 #제목이 있는지, 그림 파일이 있는지
 * 문제가 있으면 목록을 찍고 1 로 끝난다.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(import.meta.dir, "dist");
const pages = [...new Bun.Glob("**/*.html").scanSync(OUT)].filter((f) => f !== "404.html").sort();
const problems: string[] = [];
const say = (f: string, m: string) => problems.push(`${f}: ${m}`);

const decode = (s: string) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
const pathOf = (f: string) => (f === "index.html" ? "/" : `/${f.replace(/\.html$/, "")}`);
const ids = new Map<string, Set<string>>();
const htmlOf = new Map<string, string>();
for (const f of pages) {
  const h = readFileSync(join(OUT, f), "utf8");
  htmlOf.set(f, h);
  ids.set(pathOf(f), new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => decode(m[1]!))));
}

/** 브라우저처럼: 잘못된 %xx(20%-할인)는 그대로 둔다. */
const safeDecode = (s: string) => s.replace(/(%[0-9a-f]{2})+/gi, (m) => { try { return decodeURIComponent(m); } catch { return m; } });
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

for (const f of pages) {
  const h = htmlOf.get(f)!;
  const article = /<article class="doc">([\s\S]*?)<\/article>/.exec(h)?.[1] ?? "";
  // 글자만: 태그를 빼고, <pre> 안(코드)은 빼고
  const text = decode(article.replace(/<pre[\s\S]*?<\/pre>/g, "").replace(/<[^>]+>/g, "\n"));
  for (const [name, re] of [
    ["태그 글자", /<\/?[A-Za-z][^\n>]*>?/],
    ["JSX 중괄호", /\{\{|\}\}|=\{/],
    ["굵게 표시 글자", /\*\*/],
    ["링크 문법", /\]\(/],
    ["코드 울타리", /```/],
    ["주석", /\{\/\*|<!--/],
  ] as const) {
    for (const line of text.split("\n")) if (re.test(line)) say(f, `${name}: ${line.trim().slice(0, 120)}`);
  }

  // 컴포넌트 수 (원본 MDX 와)
  const mdxPath = join(import.meta.dir, "..", f === "index.html" ? "index.mdx" : f === "dashboard.html" ? "dashboard/index.mdx" : f.replace(/\.html$/, ".mdx"));
  const mdx = readFileSync(mdxPath, "utf8");
  for (const [name, src, out] of [
    ["Step", /<Step[\s>]/g, /<li class="step">/g],
    ["Accordion", /<Accordion[\s>]/g, /<details class="acc"/g],
    ["Frame", /<Frame[\s>]/g, /<figure class="frame">/g],
    ["Card", /<Card[\s>]/g, /class="card"/g],
    ["Note/Tip/Warning/Info", /<(Note|Tip|Warning|Info|Check|Danger)[\s>]/g, /<div class="note[ "]/g],
    ["img", /<img\s|!\[/g, /<img\s/g],
    ["Tabs", /<Tab[\s>]/g, /<input type="radio"/g],
  ] as const) {
    const a = count(mdx, src),
      b = count(article, out);
    if (a !== b) say(f, `${name} 수가 달라요: MDX ${a}, HTML ${b}`);
  }

  // 안쪽 링크와 그림
  for (const m of article.matchAll(/href="(\/[^"#]*)?(#[^"]*)?"/g)) {
    const path = (m[1] ?? pathOf(f)).replace(/\/$/, "") || "/";
    const hash = m[2] ? safeDecode(decode(m[2].slice(1))) : "";
    if (/\.md$/.test(path)) continue;
    const target = ids.get(path);
    if (!target) {
      say(f, `없는 쪽으로 가는 링크: ${m[0]}`);
      continue;
    }
    if (hash && !target.has(hash)) say(f, `없는 제목으로 가는 링크: ${decode(m[0])}`);
  }
  for (const m of article.matchAll(/<(?:img|video|source)[^>]*\ssrc="([^"]+)"/g)) {
    const src = decode(m[1]!);
    if (src.startsWith("/") && !existsSync(join(OUT, decodeURIComponent(src)))) say(f, `없는 그림: ${src}`);
  }
}

console.log(`${pages.length}쪽 검사`);
if (problems.length) {
  console.log(problems.join("\n"));
  process.exit(1);
}
console.log("문제 없음");
