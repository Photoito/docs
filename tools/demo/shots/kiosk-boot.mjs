// 키오스크 부팅 화면 — 켜질 때 마주칠 수 있는 상황들.
// 서버는 tools/kiosk/serve.mjs, 상황별 가짜 응답은 tools/kiosk/boot.ts.
export const base = "http://127.0.0.1:5320";
export const viewport = { width: 1280, height: 800 };
export const waitUntil = "load";

const PATH = (name) => `/?screen=boot&case=${name}`;
const settle = (page, ms = 1500) => page.waitForTimeout(ms);
const input = (page) => page.getByPlaceholder("XXXX-XXXX-XXXX-XXXX");

// 활성화 키를 넣고 「라이선스 활성화」를 누른 뒤의 화면.
const activate = async (page) => {
  await input(page).waitFor({ timeout: 60_000 });
  await input(page).fill("DEMO1234ABCD5678");
  await page.getByRole("button", { name: "라이선스 활성화" }).click();
  await page.getByText(/활성화 실패/).first().waitFor();
  await settle(page, 600);
};

export default [
  { name: "progress", path: PATH("progress"), run: async (page) => { await page.getByText("리소스 동기화").first().waitFor({ timeout: 60_000 }); await settle(page, 3500); } },
  { name: "offline", path: PATH("offline"), run: async (page) => { await page.getByText("네트워크 오프라인 — 건너뜀").first().waitFor({ timeout: 60_000 }); await settle(page); } },
  {
    name: "license-input",
    path: PATH("license-input"),
    run: async (page) => { await input(page).waitFor({ timeout: 60_000 }); await settle(page); },
    mark: (page) => [input(page), page.getByRole("button", { name: "라이선스 활성화" })]
  },
  { name: "expired", path: PATH("expired"), run: async (page) => { await input(page).waitFor({ timeout: 60_000 }); await settle(page); }, mark: (page) => [page.getByRole("button", { name: "기존 라이선스 재검증" })] },
  {
    name: "expired-recheck",
    path: PATH("expired"),
    run: async (page) => {
      await input(page).waitFor({ timeout: 60_000 });
      await page.getByRole("button", { name: "기존 라이선스 재검증" }).click();
      await settle(page, 2000);
    }
  },
  { name: "self-heal", path: PATH("self-heal"), run: async (page) => { await page.getByRole("heading", { name: "라이선스를 다시 검증하고 있어요" }).waitFor({ timeout: 60_000 }); await settle(page, 800); } },
  { name: "blocked", path: PATH("blocked"), run: async (page) => { await page.getByText("리소스 다운로드 실패").waitFor({ timeout: 60_000 }); await settle(page); }, mark: (page) => [page.getByRole("button", { name: "재시도" })] },
  { name: "agent-fail", path: PATH("agent-fail"), run: async (page) => { await page.getByText(/에이전트에 연결할 수 없습니다/).waitFor({ timeout: 90_000 }); await settle(page); } },
  { name: "sync-warning", path: PATH("sync-warning"), run: async (page) => { await page.getByText(/일부 실패/).waitFor({ timeout: 60_000 }); await settle(page); } },
  { name: "activate-invalid", path: PATH("activate-invalid"), run: activate },
  { name: "activate-other-device", path: PATH("activate-other-device"), run: activate },
  { name: "activate-expired", path: PATH("activate-expired"), run: activate },
  { name: "activate-timeout", path: PATH("activate-timeout"), run: activate }
];
