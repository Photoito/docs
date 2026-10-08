// 내 결제내역 문서용 화면.
// 데모에는 환불할 수 있는 결제가 없어 「환불」 버튼과 확인 창은 찍지 못한다.
const PATH = "/dashboard/subscription/payments";

const openOnetime = async (page) => {
  await page.getByRole("tab", { name: "일반결제" }).click();
  await page.waitForTimeout(500);
};
const firstRow = (page) => page.locator("tbody tr").first();

export default [
  {
    name: "tabs",
    path: PATH,
    mark: (page) => [page.getByRole("tab", { name: "정기결제" }), page.getByRole("tab", { name: "일반결제" })]
  },
  {
    name: "row",
    path: PATH,
    mark: (page) => [0, 1, 2, 3, 4].map((i) => firstRow(page).locator("td").nth(i))
  },
  {
    name: "blocked-reason",
    path: PATH,
    run: openOnetime,
    mark: (page) => [firstRow(page).locator("td").nth(4).locator("span")]
  }
];
