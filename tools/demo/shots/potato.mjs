// 내 감자 문서용 화면.
// ★ 충전 창 안의 결제 버튼은 누르지 않는다(누르는 즉시 결제된다).
const PATH = "/dashboard/subscription/potato";

const openTab = (name) => async (page) => {
  await page.getByRole("tab", { name }).click();
  await page.waitForTimeout(500);
};

export default [
  { name: "overview", path: PATH },
  {
    name: "balance",
    path: PATH,
    mark: (page) => [
      page.getByText("총 보유").locator("xpath=.."),
      page.getByText("만료 예정").locator("xpath=.."),
      page.getByText("소멸 예정").locator("xpath=..")
    ]
  },
  {
    name: "tabs",
    path: PATH,
    mark: (page) => [
      page.getByRole("tab", { name: "사용 내역" }),
      page.getByRole("tab", { name: "감자 충전" }),
      page.getByRole("tab", { name: "감자 단가" })
    ]
  },
  {
    name: "charge-button",
    path: PATH,
    run: openTab("감자 충전"),
    mark: (page) => [page.getByRole("button", { name: "충전하기" }).first()]
  },
  {
    name: "charge-dialog",
    path: PATH,
    run: async (page) => {
      await openTab("감자 충전")(page);
      await page.getByRole("button", { name: "충전하기" }).first().click();
      await page.getByRole("dialog").waitFor();
      await page.waitForTimeout(1500); // 결제수단 확인이 끝날 때까지
    },
    target: (page) => page.getByRole("dialog")
  }
];
