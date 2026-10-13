/*
 * 포토이토 사용자 가이드를 DGit UI 문서 틀(@dgit/docs, src/lib)로 정적 사이트로 만든다: `bun build.ts` → dist/.
 *
 * 원본은 Mintlify 가 쓰는 그대로다: 레포 루트의 docs.json(목차·로고·링크)과 *.mdx. 그 파일들은 바꾸지 않고
 * 읽기만 한다. 사이트에 맞춰 고칠 것은 아래 FIXES 에서 빌드 단계에 고친다.
 * dist/ 는 Cloudflare Worker 의 정적 에셋으로 올라간다(wrangler.jsonc).
 *
 * 환경 변수(모두 선택)
 *   SITE_URL      사이트 주소. https://docs.photoito.kr 일 때만 검색엔진에 열고, 그 밖의 주소(임시)는 noindex.
 *   POSTHOG_KEY   PostHog 프로젝트 키(phc_…, 공개 값). 없으면 분석 스크립트를 넣지 않는다.
 *   POSTHOG_HOST  PostHog 주소. 기본 https://us.i.posthog.com
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { icons } from "lucide";
import { afterLede, askRow, docMenu, docsLayout, docsScript, escape, frontMatter, lede, llmsTxt, menuPages, mintlifyHeadingId, prevNext, renderMarkdown, tocLinks, type DocGroup } from "./src/lib/docs";
import { DOCS_CSS } from "./src/lib/docs-css";
import { FA_TO_LUCIDE, lucideIcons, svgIcon, lucideExport, type IconNode } from "./src/lib/docs-icons";

const ROOT = join(import.meta.dir, "..");
const OUT = join(import.meta.dir, "dist");
const PROD = "https://docs.photoito.kr";
const SITE = (process.env.SITE_URL ?? "https://photoito-docs.dgit.workers.dev").replace(/\/$/, "");
const INDEXABLE = SITE === PROD;

// ── 빌드 단계 고침 ─────────────────────────────────────────

/**
 * MDX 원문은 바꾸지 않고 사이트에 올리기 전에 고치는 곳. [쪽, 찾을 글, 바꿀 글]. 지금은 없다.
 * (키오스크 관리자 비밀번호는 PR #1 로 원문에서 빠졌다. 그 전에는 여기서 같은 문구로 바꿨다.)
 */
const FIXES: [page: string, from: string, to: string][] = [];
/**
 * 공개 사이트에 나가면 안 되는 낱말의 SHA-256(키오스크 관리자 비밀번호). 글 자체는 이 파일에도 적지 않는다.
 * dist/ 의 html·md·txt·xml·js 에서 영문·숫자 낱말마다 해시를 내 비교하고, 하나라도 맞으면 빌드가 멈춘다.
 */
const SECRET_HASHES = new Set(["240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"]);

const fix = (page: string, md: string) => FIXES.filter(([p]) => p === page).reduce((s, [, from, to]) => s.split(from).join(to), md);

// ── docs.json ──────────────────────────────────────────────

interface NavGroup {
  group: string;
  icon?: string;
  expanded?: boolean;
  pages: (string | NavGroup)[];
}
const config = JSON.parse(readFileSync(join(ROOT, "docs.json"), "utf8")) as {
  name: string;
  description: string;
  colors: { primary: string; light: string; dark: string };
  favicon: { light: string; dark: string };
  logo: { light: string; dark: string };
  navigation: { languages: { language: string; groups: NavGroup[] }[]; global?: { anchors?: { anchor: string; icon?: string; href: string }[] } };
  navbar?: { links?: { label: string; href: string }[]; primary?: { label: string; href: string } };
  redirects?: { source: string; destination: string }[];
};

/** "index" → "/", "dashboard/index" → "/dashboard", "dashboard/frames" → "/dashboard/frames". Mintlify 와 같은 주소. */
const href = (slug: string) => (slug === "index" ? "/" : `/${slug.replace(/\/index$/, "")}`);
/** 그 주소의 파일: "/" → index.html, "/dashboard" → dashboard.html (auto-trailing-slash 가 /dashboard 로 내보낸다). */
const file = (path: string, ext: string) => (path === "/" ? `index${ext}` : `${path.slice(1)}${ext}`);

interface Page {
  slug: string;
  href: string;
  title: string;
  sidebar: string;
  description?: string;
  /** 제목 위에 작게 보이는 그룹 이름(Mintlify 와 같이 가장 가까운 그룹). */
  group: string;
  md: string;
}
const pages = new Map<string, Page>();
const load = (slug: string, group: string): Page => {
  const raw = readFileSync(join(ROOT, `${slug}.mdx`), "utf8");
  const { data, body } = frontMatter(raw);
  const page: Page = { slug, href: href(slug), title: data.title ?? slug, sidebar: data.sidebarTitle ?? data.title ?? slug, description: data.description, group, md: fix(slug, body) };
  pages.set(slug, page);
  return page;
};

/** 사이드바 아이콘(Font Awesome 이름 → lucide). */
const iconSvg = (name: string | undefined, size = 16) => {
  const node = name && (icons as Record<string, IconNode>)[lucideExport(FA_TO_LUCIDE[name] ?? name)];
  return node ? svgIcon(node, { size }) : "";
};
const icon = lucideIcons(icons as Record<string, IconNode>);

const toGroup = (g: NavGroup): DocGroup & { open?: boolean } => ({
  name: g.group,
  icon: iconSvg(g.icon) || undefined,
  open: g.expanded,
  pages: g.pages.map((p) => {
    if (typeof p !== "string") return toGroup(p);
    const page = load(p, g.group);
    return { href: page.href, title: page.sidebar };
  }),
});
const groups = config.navigation.languages[0]!.groups.map(toGroup);
const order = menuPages(groups);

// ── 쪽 틀 ─────────────────────────────────────────────────

const C = config.colors;
/** 0bridge·DGit 과 같은 무채색 바탕에, 포토이토 갈색을 버튼과 지금 쪽 표시에. */
const LIGHT = `--fg:#141210;--muted:#66615b;--line:#e8e5e1;--bg:#fff;--hover:#f6f4f1;--card:#f5f3f0;--card2:#ebe7e2;--dim:#d6d1ca;--warn:#9a5b00;--warn-bg:#fdf6e9;--ok:#1a7f45;--brand:${C.primary};--brand-fg:#fff`;
const DARK = `--fg:#f3f1ee;--muted:#9a958e;--line:#2a2724;--bg:#0c0b0a;--hover:#171513;--card:#151311;--card2:#1f1c19;--dim:#3a3632;--warn:#f5c26b;--warn-bg:#1d1608;--ok:#4ade80;--brand:${C.light};--brand-fg:#1a140e`;
const SHELL = `
:root{color-scheme:light dark;${LIGHT}}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;${DARK}}}
:root[data-theme="light"]{color-scheme:light}
:root[data-theme="dark"]{color-scheme:dark;${DARK}}
*,::before,::after{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 "Pretendard Variable",Pretendard,ui-sans-serif,system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;-webkit-font-smoothing:antialiased;word-break:keep-all;overflow-wrap:anywhere}
.top{position:sticky;top:0;z-index:10;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.top>div{max-width:1280px;margin:0 auto;height:60px;padding:0 24px;display:flex;align-items:center;gap:8px}
.logo{margin-right:auto;display:flex;align-items:center}.logo img{height:28px;width:auto;display:block}
.logo .d{display:none}
:root[data-theme="dark"] .logo .l{display:none}:root[data-theme="dark"] .logo .d{display:block}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .logo .l{display:none}:root:not([data-theme="light"]) .logo .d{display:block}}
.navlink{padding:8px 12px;border-radius:999px;color:var(--muted);text-decoration:none;font-size:14px}.navlink:hover{color:var(--fg)}
.navbtn{display:inline-flex;align-items:center;height:34px;padding:0 16px;border-radius:999px;background:var(--brand);color:var(--brand-fg);font-size:14px;font-weight:600;text-decoration:none;white-space:nowrap}
.theme{display:grid;place-items:center;width:34px;height:34px;padding:0;border:1px solid var(--line);border-radius:999px;background:none;color:var(--fg);cursor:pointer}.theme:hover{background:var(--hover)}
.theme .moon{display:none}:root[data-theme="dark"] .theme .sun{display:none}:root[data-theme="dark"] .theme .moon{display:block}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .theme .sun{display:none}:root:not([data-theme="light"]) .theme .moon{display:block}}
main{max-width:1280px;margin:0 auto;padding:0 24px 80px}
.anchors{display:flex;flex-direction:column;margin-bottom:14px}
.dnav .anchors a,.dnav-m .anchors a{display:flex;align-items:center;gap:10px}
.dnav b,.dnav-m nav b{display:flex;align-items:center;gap:8px}
.dnav a[aria-current],.dnav-m nav a[aria-current]{color:var(--brand)}
.doc .frame img{border-radius:6px}
.doc .card-i{color:var(--brand)}
.doc .eyebrow{margin:0 0 8px;font-size:14px;font-weight:600;color:var(--brand)}
footer{border-top:1px solid var(--line);padding:24px;text-align:center;font-size:13px;color:var(--muted)}footer a{color:inherit}
@media (max-width:820px){.top>div{padding:0 16px}.navlink{display:none}main{padding:0 8px 64px}}
`;

const SUN = iconSvg("sun", 16).replace("<svg", '<svg class="sun"');
const MOON = iconSvg("moon", 16).replace("<svg", '<svg class="moon"');
const THEME_HEAD = `<script>try{const t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch{}</script>`;
const THEME_SCRIPT = `<script>document.querySelector(".theme").addEventListener("click",()=>{const r=document.documentElement,dark=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches,t=dark?"light":"dark";r.dataset.theme=t;try{localStorage.setItem("theme",t)}catch{}})</script>`;

const POSTHOG_KEY = process.env.POSTHOG_KEY ?? "";
const POSTHOG_HOST = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";
/** PostHog: 키가 있을 때만. 없으면 이 자리는 비어 있다. */
const ANALYTICS = POSTHOG_KEY
  ? `<script>!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset identify alias people.set people.set_once set_config get_distinct_id".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init(${JSON.stringify(POSTHOG_KEY)},{api_host:${JSON.stringify(POSTHOG_HOST)},person_profiles:"identified_only"})</script>`
  : "";

const navbar = config.navbar ?? {};
const header = `<header class="top"><div><a class="logo" href="/" aria-label="${escape(config.name)}"><img class="l" src="${config.logo.light}" alt="${escape(config.name)}"><img class="d" src="${config.logo.dark}" alt=""></a>${(navbar.links ?? []).map((l) => `<a class="navlink" href="${escape(l.href)}" target="_blank" rel="noopener">${escape(l.label)}</a>`).join("")}${navbar.primary ? `<a class="navbtn" href="${escape(navbar.primary.href)}" target="_blank" rel="noopener">${escape(navbar.primary.label)}</a>` : ""}<button class="theme" type="button" aria-label="밝은 화면·어두운 화면 바꾸기">${SUN}${MOON}</button></div></header>`;
const anchors = `<div class="anchors">${(config.navigation.global?.anchors ?? []).map((a) => `<a href="${escape(a.href)}" target="_blank" rel="noopener">${iconSvg(a.icon)}${escape(a.anchor)}</a>`).join("")}</div>`;

/** 한국어 버튼 이름. */
const SCRIPT = docsScript({ copy: "복사", copyCode: "이 명령 복사", copied: "복사했어요" });
const ASK_LABELS = { copy: "이 쪽 복사", claude: "Claude 에서 열기", chatgpt: "ChatGPT 에서 열기" };

function html(o: { path: string; title: string; description: string; body: string; extended: boolean; md?: string }) {
  const url = `${SITE}${o.path}`;
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(o.title)}</title>
<meta name="description" content="${escape(o.description)}">
${INDEXABLE ? `<link rel="canonical" href="${url}">` : `<meta name="robots" content="noindex">`}
<meta property="og:title" content="${escape(o.title)}"><meta property="og:description" content="${escape(o.description)}"><meta property="og:url" content="${url}"><meta property="og:type" content="article"><meta property="og:locale" content="ko_KR">
<link rel="icon" href="${config.favicon.light}" type="image/svg+xml">
${o.md ? `<link rel="alternate" type="text/markdown" href="${o.md}">` : ""}
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
${THEME_HEAD}
<style>${SHELL}${DOCS_CSS.focus}${DOCS_CSS.content}${DOCS_CSS.layout}${o.extended ? DOCS_CSS.extra : ""}</style>
${ANALYTICS}
</head>
<body>
${header}
<main>${o.body}</main>
<footer>© 포토이토 · <a href="https://www.photoito.kr" target="_blank" rel="noopener">photoito.kr</a></footer>
${SCRIPT}
${THEME_SCRIPT}
<script src="/channeltalk.js" defer></script>
</body>
</html>
`;
}

// ── 쓰기 ──────────────────────────────────────────────────

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const write = (rel: string, content: string) => {
  const to = join(OUT, rel);
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, content);
};

const all = [...pages.values()];
order.forEach((link, i) => {
  const p = all.find((x) => x.href === link.href)!;
  const r = renderMarkdown(p.md, { icon, headingId: mintlifyHeadingId, anchorLabel: "이 제목으로 가는 링크" });
  const mdUrl = `/${file(p.href, ".md")}`;
  const head = `<div class="eyebrow">${escape(p.group)}</div><h1>${escape(p.title)}</h1>${p.description ? `<p>${escape(p.description)}</p>` : ""}`;
  const ask = askRow({ markdownUrl: mdUrl, prompt: `${SITE}${mdUrl} (포토이토 사용자 가이드: ${p.title}) 를 읽고 내 질문에 답해 줘. 먼저 내가 무엇을 하려는지 물어봐 줘.`, labels: ASK_LABELS });
  const article = `${afterLede(head + r.html, ask)}${prevNext(order[i - 1], order[i + 1], { prev: "이전", next: "다음" })}`;
  const menu = anchors + docMenu(groups, p.href);
  const body = docsLayout({ menu, title: p.sidebar, article, toc: tocLinks(p.md, { headingId: mintlifyHeadingId }), label: "가이드", tocLabel: "이 쪽의 내용" });
  const description = p.description ?? lede(p.md);
  write(file(p.href, ".html"), html({ path: p.href, title: p.slug === "index" ? config.name : `${p.title} - ${config.name}`, description, body, extended: r.extended, md: mdUrl }));
  write(file(p.href, ".md"), `# ${p.title}\n\n${p.description ? `${p.description}\n\n` : ""}${p.md.trim()}\n`);
});

// 404
write(
  "404.html",
  html({
    path: "/404",
    title: `찾는 쪽이 없어요 - ${config.name}`,
    description: config.description,
    extended: false,
    body: docsLayout({ menu: anchors + docMenu(groups, ""), title: "찾는 쪽이 없어요", article: `<h1>찾는 쪽이 없어요</h1><p>주소가 바뀌었거나 없는 쪽이에요. 왼쪽 목차에서 찾아보거나 <a href="/">가이드 홈</a>으로 가 주세요.</p>`, toc: "", label: "가이드" }),
  }),
);

// 정적 파일: 그림, 로고, 채널톡 버튼
for (const dir of ["images", "logo"]) cpSync(join(ROOT, dir), join(OUT, dir), { recursive: true });
cpSync(join(ROOT, "channeltalk.js"), join(OUT, "channeltalk.js"));

// docs.json 의 redirects, /dashboard/index 같은 index 주소
const redirects = [...(config.redirects ?? []).map((r) => `${r.source} ${r.destination} 301`), ...all.filter((p) => p.slug.endsWith("/index")).map((p) => `/${p.slug} ${p.href} 301`)];
write("_redirects", `${redirects.join("\n")}\n`);
write("_headers", `/images/*\n  Cache-Control: public, max-age=86400\n/*.md\n  Content-Type: text/markdown; charset=utf-8\n`);
write("robots.txt", INDEXABLE ? `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n");
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${order.map((l) => `<url><loc>${SITE}${l.href}</loc></url>`).join("\n")}\n</urlset>\n`);
write(
  "llms.txt",
  llmsTxt({
    name: config.name,
    summary: config.description,
    sections: groups.map((g) => ({ name: g.name, links: menuPages([g]).map((l) => ({ title: l.title, url: `${SITE}/${file(l.href, ".md")}` })) })),
  }),
);

// 비밀값 검사: 나가면 안 되는 글이 dist/ 에 남았으면 멈춘다.
const leaked = new Bun.Glob("**/*.{html,md,txt,xml,js}").scanSync(OUT);
const sha256 = (w: string) => new Bun.CryptoHasher("sha256").update(w).digest("hex");
for (const f of leaked) {
  const words = new Set(readFileSync(join(OUT, f), "utf8").match(/[A-Za-z0-9!@#$%^&*_.-]{4,}/g) ?? []);
  for (const w of words) {
    // 낱말 그대로, 그리고 앞뒤 문장부호를 뗀 것
    for (const v of new Set([w, w.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ""), ...w.split(/[^A-Za-z0-9]+/)]))
      if (v && SECRET_HASHES.has(sha256(v))) throw new Error(`${f} 에 공개하면 안 되는 글(키오스크 관리자 비밀번호)이 있어요. 원문에서 빼거나 build.ts 의 FIXES 로 바꿔 주세요.`);
  }
}
if (!existsSync(join(OUT, "index.html"))) throw new Error("index.html 이 없어요");
console.log(`${order.length}쪽 → ${OUT}`);
