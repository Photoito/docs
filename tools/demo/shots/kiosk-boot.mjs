// 키오스크 부팅 화면 — 켜질 때 마주칠 수 있는 상황들.
// 서버는 tools/kiosk/serve.mjs, 상황별 가짜 응답은 tools/kiosk/boot.ts.
export const base = "http://127.0.0.1:5320";
export const viewport = { width: 1280, height: 800 };
export const waitUntil = "load";

const PATH = (name) => `/?screen=boot&case=${name}`;
const settle = (page, ms = 1500) => page.waitForTimeout(ms);
const input = (page) => page.getByPlaceholder("XXXX-XXXX-XXXX-XXXX");

// 활성화 키를 넣고 「활성화하기」를 누른 뒤의 화면.
const activate = async (page) => {
  await input(page).waitFor({ timeout: 60_000 });
  await input(page).fill("DEMO1234ABCD5678");
  await page.getByRole("button", { name: "활성화하기" }).click();
  await page.locator(".bg-red-50").first().waitFor();
  await settle(page, 600);
};

export default [
  { name: "progress", path: PATH("progress"), run: async (page) => { await page.getByText("프레임·첫화면 받기").first().waitFor({ timeout: 60_000 }); await settle(page, 3500); } },
  { name: "offline", path: PATH("offline"), run: async (page) => { await page.getByText("인터넷에 연결되지 않아 건너뛰었어요").first().waitFor({ timeout: 60_000 }); await settle(page); } },
  {
    name: "license-input",
    path: PATH("license-input"),
    run: async (page) => { await input(page).waitFor({ timeout: 60_000 }); await settle(page); },
    mark: (page) => [input(page), page.getByRole("button", { name: "활성화하기" })]
  },
  { name: "expired", path: PATH("expired"), run: async (page) => { await input(page).waitFor({ timeout: 60_000 }); await settle(page); }, mark: (page) => [page.getByRole("button", { name: "다시 확인" })] },
  {
    name: "expired-recheck",
    path: PATH("expired"),
    run: async (page) => {
      await input(page).waitFor({ timeout: 60_000 });
      await page.getByRole("button", { name: "다시 확인" }).click();
      await settle(page, 2000);
    }
  },
  { name: "self-heal", path: PATH("self-heal"), run: async (page) => { await page.getByRole("heading", { name: "라이선스를 다시 확인하고 있어요" }).waitFor({ timeout: 60_000 }); await settle(page, 800); } },
  { name: "self-heal-server", path: PATH("self-heal-server"), run: async (page) => { await page.getByRole("heading", { name: "라이선스를 다시 확인하고 있어요" }).waitFor({ timeout: 60_000 }); await settle(page, 800); }, mark: (page) => [page.getByRole("button", { name: "활성화 키 직접 입력하기" })] },
  { name: "blocked", path: PATH("blocked"), run: async (page) => { await page.getByText("필요한 파일을 받지 못했어요").waitFor({ timeout: 60_000 }); await settle(page); }, mark: (page) => [page.getByRole("button", { name: "다시 시도" })] },
  { name: "agent-fail", path: PATH("agent-fail"), run: async (page) => { await page.getByText(/프로그램이 켜지지 않았어요. 촬영/).waitFor({ timeout: 90_000 }); await settle(page); } },
  { name: "sync-warning", path: PATH("sync-warning"), run: async (page) => { await page.getByText(/받지 못한 것이 있어요/).waitFor({ timeout: 60_000 }); await settle(page); } },
  { name: "activate-invalid", path: PATH("activate-invalid"), run: activate },
  { name: "activate-other-device", path: PATH("activate-other-device"), run: activate },
  { name: "activate-expired", path: PATH("activate-expired"), run: activate },
  { name: "activate-timeout", path: PATH("activate-timeout"), run: activate }
];
