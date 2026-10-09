// 홈(대시보드) 문서용 화면.
//
// 달력은 화면 폭에 따라 모양이 바뀐다(넓으면 달력, 좁으면 목록). 달력 모양을 찍으려고
// 기본 화면보다 넓게 잡는다.
const HOME = "/dashboard/overview";
const WIDE = { width: 1560, height: 740 };
// 달력 카드 전체가 한 화면에 들어오도록 — 표시(mark)를 그릴 때 화면이 밀리지 않게.
const TALL = { width: 1560, height: 1500 };

const card = (page, text) => page.locator('[data-slot="card"]').filter({ hasText: text }).first();
const statCards = (page) => page.getByText("오늘 매출").locator("xpath=ancestor::div[contains(@class,'lg:grid-cols-12')][1]");
const calendar = (page) => card(page, "일별 매출 및 인쇄 리포트");
const dayCell = (page, day) => calendar(page).locator("div.min-h-28.cursor-pointer").nth(day - 1);

const renewalPill = (page) => calendar(page).getByText(/^갱신 [0-9]+개$/).locator("visible=true").first();
// 갱신 표시가 보일 때까지 다음 달로 넘긴다(최대 두 번).
const toRenewalMonth = async (page) => {
  for (let i = 0; i < 2 && (await renewalPill(page).count()) === 0; i++) {
    await calendar(page).getByRole("button").nth(1).click();
    await page.waitForTimeout(3000);
  }
  await renewalPill(page).waitFor({ timeout: 15_000 });
};

export default [
  {
    name: "home",
    path: HOME,
    viewport: WIDE,
    mark: (page) => [
      page.locator("span.flex.min-w-0:visible").filter({ hasText: /조회 기준/ }).first(),
      statCards(page),
      page.getByText("일별 매출 및 인쇄 리포트").locator("xpath=.."),
      page.getByText("포토이토 안내").locator("xpath=.."),
      page.getByRole("button", { name: "새로고침" })
    ]
  },
  { name: "stat-cards", path: HOME, viewport: WIDE, target: statCards },
  {
    name: "compare-tooltip",
    path: HOME,
    viewport: { width: 1560, height: 640 },
    run: async (page) => {
      await page.getByText(/지난주 .요일 이 시간보다/).first().hover();
      await page.getByText("같은 시각까지 쌓인 값끼리 비교해요.").first().waitFor();
      await page.waitForTimeout(400);
    }
  },
  {
    name: "calendar",
    path: HOME,
    viewport: TALL,
    target: calendar,
    mark: (page) => [calendar(page).getByRole("button").first().locator("xpath=.."), dayCell(page, 3)]
  },
  {
    name: "day-detail",
    path: HOME,
    viewport: TALL,
    run: async (page) => {
      await dayCell(page, 3).click();
      await page.getByRole("dialog").waitFor();
      await page.getByRole("dialog").getByText("기기별").waitFor({ timeout: 15_000 });
      await page.waitForTimeout(500);
    },
    target: (page) => page.getByRole("dialog")
  },
  // 라이선스 일정 — 다음 구독 갱신일이 있는 달로 넘겨서 찍는다(데모의 갱신일은 23일 뒤).
  {
    name: "calendar-license",
    path: HOME,
    viewport: TALL,
    run: toRenewalMonth,
    target: calendar,
    mark: (page) => [renewalPill(page)]
  },
  {
    name: "day-license",
    path: HOME,
    viewport: TALL,
    run: async (page) => {
      await toRenewalMonth(page);
      await renewalPill(page).click();
      await page.getByRole("dialog").getByText("라이선스 일정").waitFor({ timeout: 15_000 });
      await page.waitForTimeout(500);
    },
    target: (page) => page.getByRole("dialog")
  },
  {
    name: "calendar-list",
    path: HOME,
    target: calendar,
    viewport: { width: 1200, height: 1500 },
    mark: (page) => [page.getByRole("button", { name: "활동 있는 날만" })]
  }
];
