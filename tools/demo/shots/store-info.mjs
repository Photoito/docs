// 내 가게 정보 문서용 화면.
// ★ 체크(저장) 버튼·「저장」·「설정 해제」는 누르지 않는다.
const PAGE = "/dashboard/store-info";
const TALL = { width: 1200, height: 1250 };

const pencil = (page, i) => page.locator("button:has(svg.lucide-pencil)").nth(i);

export default [
  { name: "page", path: PAGE, viewport: TALL, fullPage: true },
  {
    name: "editable",
    path: PAGE,
    mark: (page) => [pencil(page, 0), pencil(page, 1), page.getByRole("button", { name: "변경" })]
  },
  {
    name: "edit-name",
    path: PAGE,
    run: async (page) => {
      await pencil(page, 0).click();
      await page.getByPlaceholder("표시 이름을 입력하세요").waitFor();
    },
    mark: (page) => [
      page.getByPlaceholder("표시 이름을 입력하세요"),
      page.locator("button:has(svg.lucide-check)"),
      page.locator("button:has(svg.lucide-x)")
    ]
  },
  {
    name: "edit-hours",
    path: PAGE,
    run: async (page) => {
      await page.getByRole("button", { name: "변경" }).click();
      await page.getByLabel("영업 시작").waitFor();
      await page.getByLabel("영업 시작").fill("10:00");
      await page.getByLabel("영업 종료").fill("03:00");
      await page.waitForTimeout(300);
    },
    target: (page) => page.locator('[data-slot="card"]').filter({ hasText: "기본 정보" }).first()
  }
];
