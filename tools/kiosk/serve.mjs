// 키오스크 화면 하니스 — 키오스크 레포의 실제 화면 컴포넌트를 브라우저에서 띄운다.
//   node serve.mjs [photo-booth-kiosk 경로]   (기본: 이 레포 옆의 ../photo-booth-kiosk)
//
// 키오스크 레포는 읽기만 한다(캐시도 이 폴더의 .tmp 에 둔다).
//
// Vite 루트를 키오스크 레포로 잡는 이유: Vite 는 react 같은 패키지를 "루트" 기준으로 찾아
// 미리 묶는다. 루트를 이 폴더로 두면 여기엔 node_modules 가 없어 그 단계가 실패한다.
// 따로 설치하면 React 가 두 벌이 되어 훅이 깨지므로, 키오스크 것을 그대로 빌려 쓴다.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIOSK = resolve(process.argv[2] ?? join(HERE, "../../../photo-booth-kiosk"));
const DEMO = resolve(HERE, "../demo");
const norm = (p) => p.split("\\").join("/");
const from = (p) => import(pathToFileURL(join(KIOSK, "node_modules", p)).href);

const vite = await from("vite/dist/node/index.js");
const react = (await from("@vitejs/plugin-react/dist/index.js")).default;
const tailwindcss = (await from("@tailwindcss/vite/dist/index.mjs")).default;

const ENTRY = `/@fs/${norm(join(HERE, "main.tsx"))}`;

const harness = {
  name: "kiosk-guide-harness",
  enforce: "pre",
  // 이 폴더(와 demo 폴더)의 파일이 쓰는 패키지 이름을 키오스크 레포 기준으로 찾는다.
  async resolveId(source, importer) {
    if (!importer) return null;
    const imp = norm(importer);
    if (!imp.startsWith(norm(HERE)) && !imp.startsWith(norm(DEMO))) return null;
    if (source.startsWith(".") || source.startsWith("/") || source.startsWith("@kiosk") || source.startsWith("@demo") || /^[a-zA-Z]:/.test(source)) return null;
    return this.resolve(source, join(KIOSK, "src", "main.tsx"), { skipSelf: true });
  },
  // 루트(키오스크 레포)의 index.html 대신 이 폴더의 것을 내준다.
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = req.url ?? "/";
      if (url !== "/" && !url.startsWith("/?")) return next();
      const html = readFileSync(join(HERE, "index.html"), "utf8").replace("/main.tsx", ENTRY);
      res.setHeader("Content-Type", "text/html");
      res.end(await server.transformIndexHtml(url, html));
    });
  }
};

const server = await vite.createServer({
  configFile: false,
  root: KIOSK,
  cacheDir: join(HERE, ".tmp", "vite"),
  publicDir: join(KIOSK, "public"),
  plugins: [harness, tailwindcss(), react()],
  resolve: {
    alias: { "@kiosk": join(KIOSK, "src"), "@demo": DEMO },
    dedupe: ["react", "react-dom", "zustand", "framer-motion", "react-i18next", "i18next", "react-toastify"]
  },
  optimizeDeps: { entries: [norm(join(HERE, "main.tsx"))] },
  server: { port: 5320, strictPort: true, host: "127.0.0.1", fs: { allow: [HERE, KIOSK, DEMO] } }
});
await server.listen();
console.log("[kiosk-harness] http://127.0.0.1:5320/  (kiosk:", KIOSK + ")");
