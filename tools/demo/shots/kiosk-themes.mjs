// 키오스크 관리자 화면 — 대시보드에서 보낸 첫화면을 키오스크에서 고르는 과정.
export const base = "http://127.0.0.1:5320";
export const viewport = { width: 1280, height: 800 };
export const waitUntil = "load";

const PATH = "/?screen=admin";
const NEW = "겨울 시즌 첫화면";

async function openThemes(page) {
  await page.getByText("관리자 로그인").waitFor({ timeout: 60_000 });
  await page.getByPlaceholder("패스워드를 입력하세요").fill("demo-password");
  await page.getByRole("button", { name: "로그인" }).click();
  await page.getByRole("button", { name: "첫 화면 설정" }).click();
  await page.getByRole("heading", { name: "첫 화면 설정" }).waitFor();
  await page.waitForTimeout(5000);
}

async function refresh(page) {
  await openThemes(page);
  await page.getByRole("button", { name: "새로고침" }).click();
  await page.getByText(NEW).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(5000);
  await page.getByText(NEW).scrollIntoViewIfNeeded();
}

const newCard = (page) => page.locator("div.rounded-xl").filter({ hasText: NEW }).last();

export default [
  { name: "menu", path: PATH, run: openThemes, mark: (page) => [page.getByRole("button", { name: "첫 화면 설정" })] },
  { name: "before-refresh", path: PATH, run: openThemes, mark: (page) => [page.getByRole("button", { name: "새로고침" })] },
  { name: "inactive", path: PATH, run: refresh, mark: (page) => [newCard(page).getByRole("button", { name: "활성화", exact: true })] },
  {
    name: "active",
    path: PATH,
    run: async (page) => {
      await refresh(page);
      await newCard(page).getByRole("button", { name: "활성화", exact: true }).click();
      await page.waitForTimeout(600);
    },
    mark: (page) => [newCard(page).getByText("활성화됨")]
  },
  // 손님이 보는 대기 화면 — 새 첫화면을 고른 뒤의 모습. 세로형 키오스크 화면 크기로 찍는다.
  { name: "customer-idle", path: "/?screen=idle&theme=demo-theme-winter", viewport: { width: 540, height: 960 }, run: async (page) => page.waitForTimeout(5000) }
];
