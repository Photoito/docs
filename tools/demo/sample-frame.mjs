// 업로드 시연용 프레임 PNG — 사진이 들어갈 자리가 투명한 4컷(1200×1800, 4×6 인치).
// 브라우저 캔버스로 그려 파일로 떨군다(이미지 라이브러리 의존 없음).
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export async function makeFramePng(context, file) {
  if (existsSync(file)) return file;
  const page = await context.newPage();
  const dataUrl = await page.evaluate(() => {
    const W = 1200, H = 1800, pad = 60, gap = 40, foot = 260;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#16324f";
    g.fillRect(0, 0, W, H);
    // 눈송이 점
    g.fillStyle = "rgba(255,255,255,.55)";
    for (let i = 0; i < 90; i++) {
      const x = (i * 137) % W, y = (i * 311) % H, r = 2 + (i % 4);
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    // 사진 자리 4칸(2×2)을 투명하게 뚫는다.
    const cw = (W - pad * 2 - gap) / 2, ch = (H - foot - pad - gap) / 2;
    for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) g.clearRect(pad + k * (cw + gap), pad + r * (ch + gap), cw, ch);
    g.fillStyle = "#ffffff";
    g.textAlign = "center";
    g.font = "700 76px sans-serif";
    g.fillText("PHOTOITO", W / 2, H - 140);
    g.font = "40px sans-serif";
    g.fillText("WINTER EDITION", W / 2, H - 78);
    return c.toDataURL("image/png");
  });
  await page.close();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
  return file;
}
