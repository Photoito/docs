// 공지사항 문서용 화면.
// ★ 공지를 여는 화면은 맨 뒤에 둔다 — 여는 순간 「읽음」으로 바뀐다(데이터가 바뀐다).
//   다시 찍기 전에 `npm run db` 를 껐다 켜면 전부 안 읽음으로 돌아온다.
const PAGE = "/dashboard/notices";
const FIRST = "10월 업데이트 안내";

export default [
  { name: "list", path: PAGE },
  {
    name: "filters",
    path: PAGE,
    mark: (page) => [page.getByRole("button", { name: /^전체/ }), page.getByRole("button", { name: /^안 읽음/ })]
  },
  {
    name: "sidebar-badge",
    path: "/dashboard/overview",
    mark: (page) => [page.getByText(/새 공지 [0-9]+개/).locator("visible=true").first()]
  },
  {
    name: "mobile-open",
    path: PAGE,
    viewport: { width: 390, height: 780 },
    run: async (page) => {
      await page.getByRole("link", { name: new RegExp(FIRST) }).click();
      await page.getByRole("dialog").waitFor();
      await page.waitForTimeout(600);
    }
  },
  {
    name: "open",
    path: PAGE,
    viewport: { width: 1440, height: 780 },
    run: async (page) => {
      await page.getByRole("link", { name: new RegExp(FIRST) }).click();
      await page.getByRole("complementary").waitFor();
      await page.waitForTimeout(600);
    }
  }
];
