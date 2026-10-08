// 키오스크 하니스용 가짜 데이터 — 대시보드 데모(tools/demo/seed.mjs)와 같은 프레임을 쓴다.
// 그래야 "대시보드에서 보낸 프레임이 키오스크에 이렇게 나타난다"가 한 이야기로 이어진다.
// @ts-expect-error — 타입 선언이 없는 .mjs
import { FRAMES, CATEGORIES, THEMES, FILTERS as DEMO_FILTERS } from "@demo/seed.mjs";
// @ts-expect-error — 타입 선언이 없는 .mjs
import { placeholderSvg } from "@demo/placeholder.mjs";

export interface Fx {
  id: string;
  name: string;
  price: number;
  category: string;
  categoryId: string;
  paperSize: string;
  photoCount: number;
  filterId?: string;
}

const catName = (id: string) => (CATEGORIES as { id: string; name: string }[]).find((c) => c.id === id)!.name;
const cuts = (name: string) => (name.includes("2컷") ? 2 : name.includes("6컷") ? 6 : 4);

export const FILTERS = DEMO_FILTERS as { id: string; name: string }[];

const toFx = (f: { id: string; name: string; price: number; cat: string }, filterId?: string): Fx => ({
  id: f.id,
  name: f.name,
  price: f.price,
  category: catName(f.cat),
  categoryId: f.cat,
  paperSize: "2x6",
  photoCount: cuts(f.name),
  filterId
});

// 대시보드 데모에서 키오스크에 할당돼 있는 프레임 5개(6번째는 미할당).
const INSTALLED: Fx[] = (FRAMES as { id: string; name: string; price: number; cat: string }[])
  .slice(0, 5)
  .map((f, i) => toFx(f, i === 0 ? FILTERS[0].id : undefined));

// 문서에서 대시보드로 새로 올려 보내는 프레임. 「새로고침」을 누르면 들어온다.
export const NEW_FRAME: Fx = {
  id: "demo-frame-winter",
  name: "겨울 한정 4컷",
  price: 5000,
  category: "시즌 한정",
  categoryId: "demo-cat-season",
  paperSize: "4x6",
  photoCount: 4,
  filterId: FILTERS[0].id
};

// ── 첫화면(테마) ──
export interface Tx {
  id: string;
  name: string;
}
// 대시보드 데모에서 키오스크에 할당돼 있는 첫화면.
const INSTALLED_THEMES: Tx[] = [{ id: "demo-theme-01", name: "가을 시즌 첫화면" }];
// 문서에서 대시보드로 새로 올려 보내는 첫화면. 「새로고침」을 누르면 들어온다.
export const NEW_THEME: Tx = { id: "demo-theme-winter", name: "겨울 시즌 첫화면" };

export function themeMedia(t: Tx): string {
  if (t.id === NEW_THEME.id) return svgUrl(winterThemeSvg());
  return svgUrl(placeholderSvg(`${t.id}.png`, { FRAMES, CATEGORIES, THEMES }));
}

export const state: { installed: Fx[]; themes: Tx[]; config: ReturnType<typeof defaultConfig> | null } = {
  installed: [...INSTALLED],
  themes: [...INSTALLED_THEMES],
  config: null
};

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export function frameThumb(f: Fx): string {
  if (f.id === NEW_FRAME.id) return svgUrl(winterSvg());
  return svgUrl(placeholderSvg(`${f.id}.png`, { FRAMES, CATEGORIES, THEMES: [] }));
}

export function frameJson(f: Fx) {
  const canvas = f.paperSize === "4x6" ? { width: 1200, height: 1800 } : { width: 600, height: 1800 };
  return {
    frameId: f.id,
    name: f.name,
    photoCount: f.photoCount,
    paperSize: f.paperSize,
    category: f.category,
    categoryId: f.categoryId,
    filterId: f.filterId,
    price: f.price,
    currency: "KRW",
    printingCanvas: canvas
  };
}

export function categoryEntities() {
  return (CATEGORIES as { id: string; name: string; summary: string }[]).map((c, i) => ({
    categoryId: c.id,
    categoryName: c.name,
    summary: c.summary,
    description: null,
    sortOrder: i,
    coverUrl: null,
    introImages: []
  }));
}

export function defaultConfig() {
  return {
    frames: {
      items: INSTALLED.map((f, i) => ({ frameId: f.id, paperSize: f.paperSize, category: f.category, order: i + 1, isActive: true, price: f.price }))
    },
    themes: {
      activeThemeId: INSTALLED_THEMES[0].id as string | null,
      items: INSTALLED_THEMES.map((t) => ({ themeId: t.id, name: t.name, mediaType: "image", fileExtension: "png", isActive: true })) as unknown[]
    },
    payment: { enabled: true },
    basic: { operation: { offline_mode: false, session_timer: { mode: "session", timeout_seconds: 300 } } },
    hardware: { printer: { skip_print: false }, capture: { liveview: {} }, camera: {} },
    display: { font: { size_level: 0 } },
    plugin: { active_bundle_id: null }
  };
}

// 대시보드 문서에서 올리는 샘플 프레임(tools/demo/sample-frame.mjs)과 같은 모양.
function winterSvg() {
  const W = 400, H = 600, pad = 20, gap = 14, foot = 86;
  const cw = (W - pad * 2 - gap) / 2, ch = (H - foot - pad - gap) / 2;
  const tones = ["#e8b4a0", "#a8c5b5", "#b9b0d6", "#f0d38a"];
  let cells = "";
  for (let r = 0; r < 2; r++)
    for (let k = 0; k < 2; k++) {
      const x = pad + k * (cw + gap), y = pad + r * (ch + gap);
      cells += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" fill="${tones[r * 2 + k]}"/><circle cx="${x + cw / 2}" cy="${y + ch * 0.44}" r="${cw * 0.16}" fill="#fff" fill-opacity=".5"/><path d="M${x + cw * 0.2} ${y + ch} q${cw * 0.3} ${-ch * 0.42} ${cw * 0.6} 0z" fill="#fff" fill-opacity=".5"/>`;
    }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#16324f"/>${cells}<text x="${W / 2}" y="${H - 44}" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="700" fill="#fff">PHOTOITO</text><text x="${W / 2}" y="${H - 20}" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#fff">WINTER EDITION</text></svg>`;
}

// 대시보드 문서에서 올리는 샘플 첫화면(tools/demo/sample-theme.mjs)과 같은 모양.
function winterThemeSvg() {
  const W = 540, H = 960;
  let snow = "";
  for (let i = 0; i < 90; i++) snow += `<circle cx="${(i * 197) % W}" cy="${(i * 419) % H}" r="${1 + (i % 4)}" fill="#fff" fill-opacity=".6"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d4268"/><stop offset="1" stop-color="#0b1a2b"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>${snow}<text x="${W / 2}" y="410" text-anchor="middle" font-family="sans-serif" font-size="76" font-weight="800" fill="#fff">PHOTOITO</text><text x="${W / 2}" y="462" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#fff">WINTER SEASON</text><rect x="${W / 2 - 150}" y="700" width="300" height="76" rx="38" fill="#fff"/><text x="${W / 2}" y="749" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="700" fill="#0b1a2b">화면을 터치하세요</text></svg>`;
}
