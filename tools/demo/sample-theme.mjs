// 업로드 시연용 첫화면 그림 — 세로 화면(1080×1920) 겨울 시즌.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export async function makeThemePng(context, file) {
  if (existsSync(file)) return file;
  const page = await context.newPage();
  const dataUrl = await page.evaluate(() => {
    const W = 1080, H = 1920;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1d4268");
    grad.addColorStop(1, "#0b1a2b");
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,.6)";
    for (let i = 0; i < 160; i++) {
      const x = (i * 197) % W, y = (i * 419) % H, r = 2 + (i % 5);
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#fff";
    g.textAlign = "center";
    g.font = "800 150px sans-serif";
    g.fillText("PHOTOITO", W / 2, 820);
    g.font = "64px sans-serif";
    g.fillText("WINTER SEASON", W / 2, 920);
    g.fillStyle = "#fff";
    g.beginPath();
    g.roundRect(W / 2 - 300, 1400, 600, 150, 75);
    g.fill();
    g.fillStyle = "#0b1a2b";
    g.font = "700 60px sans-serif";
    g.fillText("화면을 터치하세요", W / 2, 1496);
    return c.toDataURL("image/png");
  });
  await page.close();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
  return file;
}
