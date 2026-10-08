// 공지사항 문서용 화면.
// ★ 공지를 눌러 열지 않는다 — 여는 순간 「읽음」으로 바뀐다(데이터가 바뀐다).
const PAGE = "/dashboard/notices";

export default [
  { name: "list", path: PAGE },
  {
    name: "filters",
    path: PAGE,
    mark: (page) => [page.getByRole("button", { name: "상태" }), page.getByRole("button", { name: "카테고리" })]
  },
  {
    name: "filter-category",
    path: PAGE,
    run: async (page) => {
      await page.getByRole("button", { name: "카테고리" }).click();
      await page.getByRole("option").first().waitFor();
      await page.waitForTimeout(300);
    }
  }
];
