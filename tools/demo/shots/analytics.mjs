// 통계 문서용 화면.
//
// 기간·제외 옵션은 주소(쿼리)에 담기는 보기 설정이라, 눌러도 데이터는 바뀌지 않는다.
const STATS = "/dashboard/analytics";
// 카드 하나가 한 화면에 다 들어오도록 세로를 넉넉히 잡는다.
const TALL = { width: 1200, height: 1600 };

const card = (page, text) => page.locator('[data-slot="card"]').filter({ hasText: text }).first();
const loaded = (page) => page.getByText("직전 기간 대비").first().waitFor({ timeout: 30_000 });

export default [
  {
    name: "top",
    path: STATS,
    run: loaded,
    mark: (page) => [
      page.locator('[data-slot="analytics-range-presets"]'),
      page.getByText("쿠폰 결제 제외").locator("xpath=ancestor::div[label][1]"),
      page.getByRole("button", { name: "새로고침" })
    ]
  },
  {
    name: "kpi",
    path: STATS,
    run: loaded,
    target: (page) => page.locator('[data-slot="analytics-secondary-kpis"]').locator("xpath=..")
  },
  {
    name: "business-day",
    path: STATS,
    run: async (page) => {
      await loaded(page);
      const button = page.getByRole("button", { name: "우리 가게 영업시간" });
      if (await button.isDisabled()) {
        await button.locator("xpath=..").hover();
        await page.getByText("내 가게 설정하러 가기").first().waitFor();
      } else {
        await button.click();
        await page.getByText("조회 범위").waitFor({ timeout: 30_000 });
      }
      await page.waitForTimeout(800);
    },
    viewport: { width: 1200, height: 560 }
  },
  {
    name: "custom-range",
    path: STATS,
    run: async (page) => {
      await loaded(page);
      await page.getByRole("button", { name: "직접 선택" }).click();
      await page.getByLabel("조회 기간").click();
      await page.waitForTimeout(800);
    }
  },
  {
    name: "trend-mix",
    path: STATS,
    viewport: TALL,
    run: async (page) => {
      await loaded(page);
      await card(page, "추이").getByRole("button", { name: "결제 수단" }).click();
      await page.waitForTimeout(1500);
    },
    target: (page) => card(page, "추이")
  },
  {
    name: "heatmap",
    path: STATS,
    viewport: TALL,
    run: async (page) => {
      await loaded(page);
      // 토요일 15시 칸을 눌러 아래에 값이 나오게 한다.
      await card(page, "요일 × 시간").getByRole("button", { name: /^토 15시/ }).click();
      await page.waitForTimeout(400);
    },
    target: (page) => card(page, "요일 × 시간")
  },
  { name: "frames", path: STATS, viewport: TALL, run: loaded, target: (page) => card(page, "상위 프레임 사용 추이") },
  { name: "sessions", path: STATS, viewport: TALL, run: loaded, target: (page) => card(page, "회전 시간 · 세션") },
  { name: "devices", path: STATS, viewport: TALL, run: loaded, target: (page) => card(page, "기기·매장 비교") }
];
