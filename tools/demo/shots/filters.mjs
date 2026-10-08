// 필터 관리 문서용 화면.
const LIST = "/dashboard/filter-management";
const CREATE = "/dashboard/filter-create";

const ready = async (page) => {
  await page.getByRole("dialog").waitFor();
  await page.waitForTimeout(4000); // 샘플 사진 미리보기가 그려질 때까지
};

// 슬라이더는 이름 옆의 range 입력이다. 이름으로 찾아 값을 넣는다.
const slider = (page, name) => page.getByRole("dialog").locator("div").filter({ hasText: new RegExp(`^${name}`) }).locator('input[type="range"]').first();

async function tune(page) {
  await ready(page);
  await page.getByPlaceholder("필터 이름을 입력하세요").fill("화사한 피부");
  await slider(page, "skin_smoothing").fill("0.6");
  await slider(page, "whitening").fill("0.4");
  await slider(page, "brightness").fill("0.08");
  await page.waitForTimeout(2500);
}

export default [
  { name: "list", path: LIST },
  { name: "add-button", path: LIST, mark: (page) => [page.getByRole("button", { name: "필터 추가" })] },
  { name: "create-name", path: CREATE, run: ready, mark: (page) => [page.getByPlaceholder("필터 이름을 입력하세요")] },
  { name: "create-sliders", path: CREATE, run: tune },
  {
    name: "create-compare",
    path: CREATE,
    run: async (page) => {
      await tune(page);
      await page.getByRole("button", { name: /나란히 비교/ }).click();
      await page.waitForTimeout(2500);
    }
  },
  {
    name: "create-samples",
    path: CREATE,
    run: async (page) => {
      await tune(page);
      await page.getByRole("button", { name: "샘플1" }).scrollIntoViewIfNeeded();
    },
    mark: (page) => [page.getByRole("button", { name: "샘플1" }).locator("xpath=.."), page.getByRole("button", { name: /레퍼런스로 자동 생성/ })]
  },
  {
    name: "create-save",
    path: CREATE,
    run: async (page) => {
      await tune(page);
      await page.getByRole("button", { name: "필터 저장" }).scrollIntoViewIfNeeded();
    },
    mark: (page) => [page.getByRole("button", { name: "필터 저장" })]
  },
  {
    name: "card-controls",
    path: LIST,
    mark: (page) => [page.getByRole("button", { name: "수정" }).first(), page.getByRole("switch").first()]
  }
];
