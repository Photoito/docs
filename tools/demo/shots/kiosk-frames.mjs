// 키오스크 관리자 화면 — 대시보드에서 보낸 프레임을 키오스크에서 켜는 과정.
// 서버는 tools/kiosk/serve.mjs (키오스크 레포의 실제 화면 + 가짜 데이터).
export const base = "http://127.0.0.1:5320";
export const viewport = { width: 1280, height: 800 };
export const waitUntil = "load";

const PATH = "/?screen=admin";
const NEW = "겨울 한정 4컷";

const ready = (page) => page.getByText("관리자 로그인").waitFor({ timeout: 60_000 });

async function login(page) {
  await ready(page);
  await page.getByPlaceholder("패스워드를 입력하세요").fill("demo-password");
  await page.getByRole("button", { name: "로그인" }).click();
  await page.getByRole("button", { name: "프레임 관리" }).waitFor();
  await page.waitForTimeout(4000); // 로그인 알림이 사라질 때까지
}

async function openFrames(page) {
  await login(page);
  await page.getByRole("button", { name: "프레임 관리" }).click();
  await page.getByRole("heading", { name: "프레임 관리" }).waitFor();
  await page.waitForTimeout(4500);
}

async function refresh(page) {
  await openFrames(page);
  await page.getByRole("button", { name: "새로고침" }).click();
  await page.getByRole("button", { name: /시즌 한정 \(3\)/ }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(4500);
}

async function openNewFrame(page) {
  await refresh(page);
  await page.getByRole("button", { name: /시즌 한정/ }).click();
  await page.getByText(NEW).scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
}

// 새 프레임 카드 안의 「활성화」 체크박스.
const newCheckbox = (page) => page.locator("div.rounded-xl").filter({ hasText: NEW }).getByRole("checkbox");

export default [
  { name: "login", path: PATH, run: ready, mark: (page) => [page.getByPlaceholder("패스워드를 입력하세요"), page.getByRole("button", { name: "로그인" })] },
  // 로그인 직후의 시스템 정보 화면은 가짜 데이터로 채워지지 않아, 프레임 관리를 연 상태에서 메뉴를 짚는다.
  { name: "menu", path: PATH, run: openFrames, mark: (page) => [page.getByRole("button", { name: "프레임 관리" })] },
  { name: "before-refresh", path: PATH, run: openFrames, mark: (page) => [page.getByRole("button", { name: "새로고침" })] },
  { name: "after-refresh", path: PATH, run: refresh, mark: (page) => [page.getByRole("button", { name: /시즌 한정/ })] },
  { name: "inactive", path: PATH, run: openNewFrame, mark: (page) => [newCheckbox(page).locator("xpath=..")] },
  {
    name: "active",
    path: PATH,
    run: async (page) => {
      await openNewFrame(page);
      await newCheckbox(page).check();
      await page.waitForTimeout(600);
    },
    mark: (page) => [newCheckbox(page).locator("xpath=..")]
  }
];
