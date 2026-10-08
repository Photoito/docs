// 3412 → 3411 중계. 데모 세션 쿠키를 서버 쪽에서 붙인다(`__Secure-` 쿠키는 http 브라우저에 못 심는다).
import http from "node:http";
const DEMO = "__Secure-photoito.session_token=demo-token";
http
  .createServer((req, res) => {
    const cookie = [req.headers.cookie, DEMO].filter(Boolean).join("; ");
    const up = http.request(
      { host: "127.0.0.1", port: 3411, path: req.url, method: req.method, headers: { ...req.headers, cookie } },
      (r) => {
        delete r.headers["content-security-policy"];
        res.writeHead(r.statusCode, r.headers);
        r.pipe(res);
      }
    );
    up.on("error", (e) => res.writeHead(502).end(String(e)));
    req.pipe(up);
  })
  .listen(3412, "127.0.0.1", () => console.log("[cookie-proxy] :3412 → :3411"));
