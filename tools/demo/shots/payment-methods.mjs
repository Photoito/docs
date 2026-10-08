// 결제수단 관리 문서용 화면.
// ★ 카드 번호는 적지 않는다. 등록·삭제·저장 버튼도 누르지 않는다.
const PATH = "/dashboard/subscription/payment-methods";

export default [
  { name: "overview", path: PATH },
  {
    name: "card-buttons",
    path: PATH,
    mark: (page) => [
      page.getByRole("button", { name: "별칭 수정" }),
      page.getByRole("button", { name: "다른 카드로 변경" }),
      page.getByRole("button", { name: "삭제", exact: true })
    ]
  },
  {
    name: "register-dialog",
    path: PATH,
    run: async (page) => {
      await page.getByRole("button", { name: "다른 카드로 변경" }).click();
      await page.getByRole("dialog").waitFor();
      await page.waitForTimeout(500);
    },
    target: (page) => page.getByRole("dialog")
  },
  {
    name: "alias-edit",
    path: PATH,
    run: async (page) => {
      await page.getByRole("button", { name: "별칭 수정" }).click();
      await page.waitForTimeout(400);
    },
    target: (page) => page.getByTestId("payment-card-face")
  },
  {
    name: "delete-dialog",
    path: PATH,
    run: async (page) => {
      await page.getByRole("button", { name: "삭제", exact: true }).click();
      await page.getByRole("alertdialog").waitFor();
    },
    target: (page) => page.getByRole("alertdialog")
  }
];
