// 지어낸 그림 — 프레임(세로 스트립), 첫화면(세로 화면), 손님 사진(실루엣).
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const dark = (hex) => parseInt(hex.slice(1, 3), 16) * 0.299 + parseInt(hex.slice(3, 5), 16) * 0.587 + parseInt(hex.slice(5, 7), 16) * 0.114 < 128;
const PALETTE = ["#e8b4a0", "#a8c5b5", "#b9b0d6", "#f0d38a", "#9cc7ea", "#e7a6b8"];

function person(x, y, w, h, tone) {
  const cx = x + w / 2;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${tone}"/>
    <circle cx="${cx - w * 0.16}" cy="${y + h * 0.42}" r="${w * 0.12}" fill="#fff" fill-opacity=".55"/>
    <path d="M${cx - w * 0.36} ${y + h} q${w * 0.2} ${-h * 0.42} ${w * 0.4} 0z" fill="#fff" fill-opacity=".55"/>
    <circle cx="${cx + w * 0.17}" cy="${y + h * 0.46}" r="${w * 0.11}" fill="#fff" fill-opacity=".4"/>
    <path d="M${cx - w * 0.02} ${y + h} q${w * 0.19} ${-h * 0.36} ${w * 0.38} 0z" fill="#fff" fill-opacity=".4"/>`;
}

function strip(color, label, cuts = 4, seedStr = "x") {
  const W = 400, H = 1200, pad = 26, foot = 150;
  const ink = dark(color) ? "#ffffff" : "#2a2a2e";
  const ch = (H - foot - pad * (cuts + 1)) / cuts;
  let body = "";
  for (let i = 0; i < cuts; i++) body += person(pad, pad + i * (ch + pad), W - pad * 2, ch, PALETTE[(hash(seedStr) + i) % PALETTE.length]);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${color}"/>${body}
    <text x="${W / 2}" y="${H - 84}" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="700" fill="${ink}">PHOTOITO</text>
    <text x="${W / 2}" y="${H - 46}" text-anchor="middle" font-family="sans-serif" font-size="20" fill="${ink}" fill-opacity=".7">${label}</text>
  </svg>`;
}

function screen(color, label) {
  const W = 720, H = 1280;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#15161c"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <circle cx="560" cy="250" r="150" fill="#fff" fill-opacity=".12"/><circle cx="150" cy="900" r="220" fill="#fff" fill-opacity=".07"/>
    <text x="${W / 2}" y="560" text-anchor="middle" font-family="sans-serif" font-size="76" font-weight="800" fill="#fff">PHOTOITO</text>
    <text x="${W / 2}" y="630" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#fff" fill-opacity=".85">${label}</text>
    <rect x="210" y="980" width="300" height="92" rx="46" fill="#fff"/>
    <text x="${W / 2}" y="1038" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="700" fill="#15161c">화면을 터치하세요</text>
  </svg>`;
}

export function placeholderSvg(key, { FRAMES, CATEGORIES, THEMES }) {
  const frame = FRAMES.find((f) => key.includes(f.id));
  if (frame) return strip(frame.color, frame.name, frame.name.includes("2컷") ? 2 : frame.name.includes("6컷") ? 6 : 4, frame.id);
  const theme = THEMES.find((t) => key.includes(t.id));
  if (theme) return screen(theme.color, theme.name);
  const cat = CATEGORIES.find((c) => key.includes(c.id));
  if (cat) return screen("#6a7fa8", cat.name);
  if (/\.(png|jpe?g|webp|gif)$/i.test(key)) {
    if (key.includes("result")) return strip("#f5f1ea", "", 4, key);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">${person(0, 0, 600, 400, PALETTE[hash(key) % PALETTE.length])}</svg>`;
  }
  return null;
}
