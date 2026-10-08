// 알림 설정 문서용 화면.
// ★ 「저장」·「테스트」·스위치는 누르지 않는다. 종 아이콘도 누르지 않는다(읽음 처리가 된다).
const PAGE = "/dashboard/alerts";

const dialog = (page) => page.getByRole("dialog");

async function openCreate(page) {
  await page.getByRole("button", { name: "알림 추가" }).click();
  await dialog(page).waitFor();
  await page.waitForTimeout(600);
}

export default [
  { name: "list", path: PAGE },
  { name: "add-button", path: PAGE, mark: (page) => [page.getByRole("button", { name: "알림 추가" })] },
  { name: "add-dialog", path: PAGE, run: openCreate, target: dialog },
  {
    name: "rule-controls",
    path: PAGE,
    mark: (page) => [
      page.getByRole("switch").first(),
      page.getByRole("button", { name: "알림 수정" }).first(),
      page.getByRole("button", { name: "알림 삭제" }).first()
    ]
  },
  { name: "bell", path: PAGE, mark: (page) => [page.getByRole("button", { name: "알림", exact: true }).first()] }
];
