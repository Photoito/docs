// 내 라이선스 문서용 화면.
// ★ 결제·해지·변경을 실제로 일으키는 마지막 버튼은 누르지 않는다. 창을 여는 데까지만 한다.
const PATH = "/dashboard/subscription/license";

const card = (page, i = 0) => page.getByTestId("license-card").nth(i);

export default [
  { name: "overview", path: PATH },
  {
    name: "card-parts",
    path: PATH,
    mark: (page) => [
      card(page).getByTestId("license-badge"),
      card(page).getByText(/다음 결제/),
      card(page).locator("span.font-mono"),
      card(page).getByRole("button", { name: "복사" })
    ]
  },
  {
    name: "card-actions",
    path: PATH,
    mark: (page) => [
      card(page).getByRole("combobox"),
      card(page).getByRole("button", { name: "변경", exact: true }),
      card(page).getByRole("button", { name: "해지", exact: true })
    ]
  },
  {
    name: "cancel-dialog",
    path: PATH,
    run: async (page) => {
      await card(page).getByRole("button", { name: "해지", exact: true }).click();
      await page.getByRole("alertdialog").or(page.getByRole("dialog")).first().waitFor();
    },
    target: (page) => page.getByRole("alertdialog").or(page.getByRole("dialog")).first()
  },
  { name: "add-button", path: PATH, mark: (page) => [page.getByRole("button", { name: "라이선스 추가 구입" })] },
  {
    name: "add-sheet",
    path: PATH,
    run: async (page) => {
      await page.getByRole("button", { name: "라이선스 추가 구입" }).click();
      const sheet = page.getByRole("dialog");
      await sheet.waitFor();
      // 플랜을 고르는 것까지만. 「결제하기」는 누르지 않는다.
      await sheet.getByRole("button", { name: "베이직" }).click();
      await page.waitForTimeout(500);
    }
  },
  { name: "payment-panel", path: PATH, mark: (page) => [page.locator("aside").last().locator("[data-slot=card]").first()] }
];
