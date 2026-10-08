// 쿠폰 관리 문서용 화면.
// ★ 여기서는 아무것도 저장하지 않는다 — 창을 열고 칸을 채우는 데까지만 한다.
const LIST = "/dashboard/coupon-management";
// 데모 쿠폰 코드가 길어서 기본 폭(1200)에서는 목록의 글자가 겹친다.
const WIDE = { width: 1500, height: 820 };

const dialog = (page) => page.getByRole("dialog");

async function openCreate(page) {
  await page.getByRole("button", { name: "쿠폰 추가" }).click();
  await dialog(page).waitFor();
  await page.waitForTimeout(600);
}

async function openRule(page) {
  await page.getByRole("button", { name: "규칙 추가" }).click();
  await dialog(page).waitFor();
  await page.waitForTimeout(600);
}

export default [
  { name: "list", path: LIST, viewport: WIDE },
  {
    name: "list-parts",
    path: LIST,
    viewport: WIDE,
    mark: (page) => [
      page.locator('[data-slot="coupon-stats"]'),
      page.locator('[data-slot="coupon-quick-issue"]'),
      page.locator('[data-slot="coupon-facet"]')
    ]
  },
  { name: "add-button", path: LIST, viewport: WIDE, mark: (page) => [page.getByRole("button", { name: "쿠폰 추가" })] },
  {
    name: "create-dialog",
    path: LIST,
    viewport: WIDE,
    run: async (page) => {
      await openCreate(page);
      await page.locator("#name").fill("첫 방문 1,000원 할인");
      await page.locator("#discount_type").click();
      await page.getByRole("option", { name: /고정 금액/ }).click();
      await page.locator("#discount_value").fill("1000");
    },
    target: dialog
  },
  {
    name: "create-code",
    path: LIST,
    viewport: WIDE,
    run: async (page) => {
      await openCreate(page);
      await page.locator("#name").fill("첫 방문 1,000원 할인");
      await page.locator("#auto-code").click();
      await page.locator("#code").fill("202610");
    },
    mark: (page) => [page.locator("#auto-code"), page.locator("#code")]
  },
  {
    name: "create-advanced",
    path: LIST,
    viewport: { width: 1500, height: 1000 },
    run: async (page) => {
      await openCreate(page);
      await page.locator("#name").fill("첫 방문 1,000원 할인");
      await page.getByText("고급 설정 펼치기").click();
      await page.locator("#min_purchase_amount").waitFor();
      await page.waitForTimeout(400);
    },
    target: dialog
  },
  {
    name: "row-controls",
    path: LIST,
    viewport: WIDE,
    mark: (page) => [
      page.getByRole("switch", { name: "활성 토글" }).first(),
      page.getByRole("button", { name: "수정", exact: true }).first(),
      page.getByRole("button", { name: "삭제", exact: true }).first()
    ]
  },
  {
    name: "edit-dialog",
    path: LIST,
    viewport: WIDE,
    run: async (page) => {
      await page.getByRole("button", { name: "수정", exact: true }).first().click();
      await dialog(page).waitFor();
      await page.locator("#name").waitFor();
      await page.waitForTimeout(500);
    },
    target: dialog
  },
  {
    name: "delete-dialog",
    path: LIST,
    viewport: WIDE,
    run: async (page) => {
      await page.getByRole("button", { name: "삭제", exact: true }).first().click();
      await page.getByRole("alertdialog").waitFor();
      await page.waitForTimeout(400);
    },
    target: (page) => page.getByRole("alertdialog")
  },
  {
    name: "bulk-bar",
    path: LIST,
    viewport: WIDE,
    run: async (page) => {
      await page.getByRole("checkbox", { name: /선택$/ }).nth(1).click();
      await page.getByRole("checkbox", { name: /선택$/ }).nth(2).click();
      await page.getByText("2개 선택됨").waitFor();
    },
    mark: (page) => [page.getByText("2개 선택됨").locator("xpath=..")]
  },
  { name: "rule-add-button", path: LIST, viewport: WIDE, mark: (page) => [page.getByRole("button", { name: "규칙 추가" })] },
  {
    name: "rule-dialog",
    path: LIST,
    viewport: WIDE,
    run: async (page) => {
      await openRule(page);
      await page.locator("#rule-label").fill("단골 무료 1회");
      await page.locator("#rule-name").fill("단골 무료 쿠폰");
    },
    target: dialog
  }
];
