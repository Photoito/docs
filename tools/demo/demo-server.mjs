// 데모 서버 — 메모리 Postgres(PGlite) + 가짜 BE API. 전부 지어낸 데이터.
//   node demo-server.mjs [photoito-ddl 경로]   (기본: 이 레포 옆의 ../photoito-ddl)
import "./fake-clock.cjs"; // DEMO_CLOCK_OFFSET_HOURS — 맨 먼저 불러야 한다
import { readdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { seed, FRAMES, CATEGORIES, THEMES } from "./seed.mjs";
import { placeholderSvg } from "./placeholder.mjs";
import { handleBe } from "./mock-routes.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DDL_DIR = process.argv[2] ?? resolve(HERE, "../../../photoito-ddl");
const DB_PORT = 54329;
const API_PORT = 54330;

export const DEMO_USER = {
  id: "demo-owner",
  name: "김포토",
  email: "owner@demo.photoito.example",
  phoneNumber: "+821000000000",
  role: "user",
  banned: false,
  approved: true,
  locale: "ko"
};

const db = await PGlite.create();

await db.exec(`
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE auth."user" (
    id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
    "emailVerified" boolean NOT NULL DEFAULT false, image text,
    "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
    role text, banned boolean, "banReason" text, "banExpires" timestamptz,
    "phoneNumber" text, "phoneNumberVerified" boolean, approved boolean DEFAULT false
  );
  CREATE TABLE auth."session" (
    id text PRIMARY KEY, "expiresAt" timestamptz NOT NULL, token text NOT NULL UNIQUE,
    "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
    "ipAddress" text, "userAgent" text,
    "userId" text NOT NULL REFERENCES auth."user"(id) ON DELETE CASCADE, "impersonatedBy" text
  );
  CREATE TABLE auth."account" (
    id text PRIMARY KEY, "accountId" text NOT NULL, "providerId" text NOT NULL,
    "userId" text NOT NULL REFERENCES auth."user"(id) ON DELETE CASCADE,
    "accessToken" text, "refreshToken" text, "idToken" text,
    "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, scope text, password text,
    "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE auth."verification" (
    id text PRIMARY KEY, identifier text NOT NULL, value text NOT NULL, "expiresAt" timestamptz NOT NULL,
    "createdAt" timestamptz DEFAULT now(), "updatedAt" timestamptz DEFAULT now()
  );
`);

for (const f of readdirSync(DDL_DIR).filter((f) => /^\d\d_.*\.sql$/.test(f)).sort()) {
  await db.exec(readFileSync(join(DDL_DIR, f), "utf8"));
}
for (const f of readdirSync(join(DDL_DIR, "views")).filter((f) => f.endsWith(".sql"))) {
  await db.exec(readFileSync(join(DDL_DIR, "views", f), "utf8"));
}

await db.exec(`
  CREATE TABLE IF NOT EXISTS push_device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES auth."user"(id) ON DELETE CASCADE,
    store_id VARCHAR(50) REFERENCES stores(id) ON DELETE SET NULL,
    fcm_token TEXT NOT NULL UNIQUE,
    platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios','android')),
    device_model TEXT, app_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, revoked_at TIMESTAMPTZ
  );
`);
await seed(db);

const dbServer = new PGLiteSocketServer({ db, port: DB_PORT, host: "127.0.0.1", maxConnections: 30 });
await dbServer.start();

// ── 가짜 BE API ── 모르는 경로는 로그로 남겨 어떤 화면이 무엇을 부르는지 알아낸다.
const session = {
  id: "demo-session",
  token: "demo-token",
  userId: DEMO_USER.id,
  expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString()
};
const routes = {
  "GET /v1/auth/get-session": () => ({ user: DEMO_USER, session })
};
const api = createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] ?? "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }
  if (req.method === "OPTIONS") return res.writeHead(204).end();
  const path = new URL(req.url, "http://x").pathname;
  const handler = routes[`${req.method} ${path}`];

  // ── 가짜 R2 ── 서명된 주소(/{bucket}/{key})로 오는 요청에 그림·메타를 내준다.
  const r2 = decodeURIComponent(path).match(/^\/(store-datas|kiosk-uploads|release-files)\/(.+)$/);
  if (r2 && (req.method === "GET" || req.method === "HEAD")) {
    const key = r2[2];
    if (key.endsWith(".json")) {
      const f = FRAMES.find((x) => key.includes(x.id));
      const cat = f && CATEGORIES.find((c) => c.id === f.cat);
      res.setHeader("Content-Type", "application/json");
      return res.writeHead(200).end(JSON.stringify(f ? { categoryId: cat.id, category: cat.name } : {}));
    }
    const svg = placeholderSvg(key, { FRAMES, CATEGORIES, THEMES });
    if (svg) {
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "no-store");
      return res.writeHead(200).end(req.method === "HEAD" ? undefined : svg);
    }
    console.log(`[mock-r2] 그림 없음 ${key}`);
    return res.writeHead(404).end();
  }

  res.setHeader("Content-Type", "application/json");
  if (handler) return res.writeHead(200).end(JSON.stringify(handler()));

  // DB 를 읽어 답하는 BE 경로들.
  try {
    const hit = await handleBe(req.method, path, new URL(req.url, "http://x").searchParams, db);
    if (hit) return res.writeHead(hit.status ?? 200).end(JSON.stringify(hit.body));
  } catch (e) {
    console.log(`[mock-api] 오류 ${req.method} ${path}: ${e.message}`);
    return res.writeHead(500).end(JSON.stringify({ success: false, message: "demo: " + e.message }));
  }
  console.log(`[mock-api] 미정의 ${req.method} ${req.url}`);
  res.writeHead(404).end(JSON.stringify({ success: false, message: "demo: not mocked" }));
});
api.listen(API_PORT, "127.0.0.1", () => {
  console.log(`[demo] db :${DB_PORT}  api :${API_PORT}  ready`);
});
