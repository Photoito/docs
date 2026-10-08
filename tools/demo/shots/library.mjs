// 공유 저장소 문서용 화면.
const LIST = "/dashboard/library";
const DETAIL = "/dashboard/library/demo-library-1";

export default [
  { name: "list", path: LIST },
  { name: "create-button", path: LIST, mark: (page) => [page.getByRole("button", { name: "저장소 만들기" })] },
  {
    name: "create-dialog",
    path: LIST,
    run: async (page) => {
      await page.getByRole("button", { name: "저장소 만들기" }).click();
      await page.getByRole("dialog").waitFor();
      await page.getByPlaceholder(/저장소 이름/).fill("겨울 시즌 자료");
    },
    target: (page) => page.getByRole("dialog")
  },
  { name: "detail", path: DETAIL },
  {
    name: "detail-actions",
    path: DETAIL,
    mark: (page) => [page.getByRole("button", { name: "가게에서 가져오기" }), page.getByRole("button", { name: "가게 링크" })]
  },
  {
    name: "import-dialog",
    path: DETAIL,
    run: async (page) => {
      await page.getByRole("button", { name: "가게에서 가져오기" }).click();
      await page.getByRole("dialog").waitFor();
      await page.waitForTimeout(800);
    },
    target: (page) => page.getByRole("dialog")
  },
  {
    name: "link-dialog",
    path: DETAIL,
    run: async (page) => {
      await page.getByRole("button", { name: "가게 링크" }).click();
      await page.getByRole("dialog").waitFor();
      await page.waitForTimeout(800);
    },
    target: (page) => page.getByRole("dialog")
  },
  {
    name: "move-menu",
    path: "/dashboard/frame-management",
    run: async (page) => {
      await page.getByRole("button", { name: "클래식 4컷 화이트 조작" }).click();
      await page.getByRole("menuitem", { name: "저장소로 이동" }).waitFor();
    },
    mark: (page) => [page.getByRole("menuitem", { name: "저장소로 이동" })]
  }
];
