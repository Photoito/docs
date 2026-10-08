// 사진 자리 모양 실험·시연용 프레임 PNG — 네모가 아닌 모양으로 뚫은 4컷(2400×3600, 4×6).
// 왼쪽 위부터: 하트, 별, 손으로 그린 듯 삐뚤삐뚤한 네모, 크레파스로 칠한 듯 거친 네모.
// 난수는 고정 시드라 매번 같은 그림이 나온다.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export async function makeShapesPng(context, file, which = ["heart", "star", "wobbly", "crayon"]) {
  const page = await context.newPage();
  const dataUrl = await page.evaluate((which) => {
    const W = 2400, H = 3600, pad = 130, gap = 110, foot = 520;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#f3e3c8";
    g.fillRect(0, 0, W, H);

    let seed = 20261008;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

    const cw = (W - pad * 2 - gap) / 2, ch = (H - foot - pad - gap) / 2;
    const cells = [0, 1, 2, 3].map((i) => ({ x: pad + (i % 2) * (cw + gap), y: pad + Math.floor(i / 2) * (ch + gap), w: cw, h: ch }));

    const paths = {
      heart(b) {
        const cx = b.x + b.w / 2, top = b.y + b.h * 0.3, s = b.w / 2;
        g.beginPath();
        g.moveTo(cx, b.y + b.h * 0.95);
        g.bezierCurveTo(cx - s * 1.6, b.y + b.h * 0.55, cx - s * 1.05, b.y - b.h * 0.1, cx, top);
        g.bezierCurveTo(cx + s * 1.05, b.y - b.h * 0.1, cx + s * 1.6, b.y + b.h * 0.55, cx, b.y + b.h * 0.95);
        g.closePath();
      },
      star(b) {
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = Math.min(b.w, b.h) / 2, r = R * 0.64; // 통통한 별 — 0.6 아래로 가면 인식되지 않는다
        g.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r : R;
          g[i ? "lineTo" : "moveTo"](cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
        }
        g.closePath();
      },
      // 연필로 그린 듯 가장자리가 삐뚤삐뚤한 네모
      wobbly(b) {
        const pts = [];
        const step = 60, j = 26;
        for (let x = b.x; x <= b.x + b.w; x += step) pts.push([x, b.y + (rnd() - 0.5) * j]);
        for (let y = b.y; y <= b.y + b.h; y += step) pts.push([b.x + b.w + (rnd() - 0.5) * j, y]);
        for (let x = b.x + b.w; x >= b.x; x -= step) pts.push([x, b.y + b.h + (rnd() - 0.5) * j]);
        for (let y = b.y + b.h; y >= b.y; y -= step) pts.push([b.x + (rnd() - 0.5) * j, y]);
        g.beginPath();
        pts.forEach(([x, y], i) => g[i ? "lineTo" : "moveTo"](x, y));
        g.closePath();
      }
    };

    g.globalCompositeOperation = "destination-out";
    which.forEach((kind, i) => {
      const b = cells[i];
      if (!kind) return;
      if (kind === "crayon") {
        // 크레파스로 칠한 듯: 굵고 거친 가로 획을 여러 번 겹쳐 지운다(가장자리가 들쭉날쭉하고 반투명).
        g.lineCap = "round";
        for (let y = b.y + 40; y < b.y + b.h - 20; y += 34) {
          for (let k = 0; k < 3; k++) {
            g.globalAlpha = 0.55 + rnd() * 0.45;
            g.lineWidth = 52 + rnd() * 34;
            g.beginPath();
            g.moveTo(b.x + 30 + rnd() * 60, y + (rnd() - 0.5) * 26);
            g.lineTo(b.x + b.w - 30 - rnd() * 60, y + (rnd() - 0.5) * 26);
            g.stroke();
          }
        }
        g.globalAlpha = 1;
        return;
      }
      paths[kind](b);
      g.fill();
    });
    g.globalCompositeOperation = "source-over";

    g.fillStyle = "#7a4b23";
    g.textAlign = "center";
    g.font = "800 150px sans-serif";
    g.fillText("PHOTOITO", W / 2, H - 290);
    g.font = "76px sans-serif";
    g.fillText("MY SHAPE FRAME", W / 2, H - 170);
    return c.toDataURL("image/png");
  }, which);
  await page.close();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
  return file;
}
