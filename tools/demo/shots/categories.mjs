// 카테고리 관리 문서용 화면.
const LIST = "/dashboard/frame-categories";

const openAdd = async (page) => {
  await page.getByRole("button", { name: "카테고리 추가" }).click();
  await page.getByRole("dialog").waitFor();
};

export default [
  { name: "list", path: LIST },
  { name: "add-button", path: LIST, mark: (page) => [page.getByRole("button", { name: "카테고리 추가" })] },
  {
    name: "add-dialog",
    path: LIST,
    run: async (page) => {
      await openAdd(page);
      await page.getByPlaceholder("카테고리 이름을 입력하세요").fill("겨울 한정");
    },
    target: (page) => page.getByRole("dialog")
  },
  {
    name: "card-controls",
    path: LIST,
    mark: (page) => [
      page.getByRole("button", { name: "수정" }).first(),
      page.getByRole("button", { name: "기본 프레임 조작" }),
      page.getByRole("switch").first()
    ]
  },
  {
    name: "card-menu",
    path: LIST,
    run: async (page) => {
      await page.getByRole("button", { name: "기본 프레임 조작" }).click();
      await page.getByRole("menu").waitFor();
    }
  }
];
