// 프레임 관리 문서용 화면.
import { join } from "node:path";
import { makeFramePng } from "../sample-frame.mjs";

const LIST = "/dashboard/frame-management";
const UPLOAD = "/dashboard/frame-upload";
const FRAME = "클래식 4컷 화이트";

const card = (page) => page.locator("div").filter({ hasText: FRAME }).filter({ has: page.getByRole("button", { name: "할당" }) }).last();

async function uploadSample(page, { here }) {
  const file = join(here, ".tmp", "sample-frame.png");
  await makeFramePng(page.context(), file);
  await page.locator('input[type="file"][accept*="image"]').first().setInputFiles(file);
  // 투명 영역 자동 탐지가 끝나 레이아웃이 그려질 때까지.
  await page.getByText(/투명 영역을 감지했어요|레이아웃 영역/).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(5000); // 알림 토스트가 사라진 뒤에 찍는다
}

async function uploadAndName(page, ctx) {
  await uploadSample(page, ctx);
  await page.getByPlaceholder("프레임 이름을 입력하세요").fill("겨울 한정 4컷");
  await page.locator('input[type="number"]').first().fill("5000");
  await page.getByText("프레임 메타데이터 설정").evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(600);
}

// 카테고리 칸(0)과 필터 칸(1) 아래의 「추가」 버튼.
const addButton = (page, i) => page.getByRole("button", { name: "추가", exact: true }).nth(i);

// 프레임 순서 — 이름 왼쪽의 점 여섯 개 손잡이.
const handle = (page, name) => page.getByRole("button", { name: `${name} 순서 옮기기` });
// 키보드로 한 칸 옮긴다(스페이스로 집고 → 로 옮기고 스페이스로 놓는다). 「적용」은 누르지 않는다.
const moveRight = async (page, name) => {
  await handle(page, name).focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(300);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  await page.keyboard.press("Space");
  await page.getByText("순서를 바꿨어요. 아직 저장되지 않았어요.").waitFor();
  await page.waitForTimeout(500);
};

export default [
  { name: "list", path: LIST },
  { name: "add-button", path: LIST, mark: (page) => [page.getByRole("button", { name: "프레임 추가" })] },
  { name: "upload-empty", path: UPLOAD, mark: (page) => [page.getByText("프레임 이미지 업로드").locator("xpath=ancestor::div[contains(@class,'border')][1]")] },
  { name: "upload-filled", path: UPLOAD, run: uploadSample },
  {
    name: "upload-name-price",
    path: UPLOAD,
    run: uploadAndName,
    mark: (page) => [page.getByPlaceholder("프레임 이름을 입력하세요"), page.locator('input[type="number"]').first()]
  },
  {
    name: "upload-category-filter",
    path: UPLOAD,
    run: uploadAndName,
    mark: (page) => [page.getByRole("combobox").nth(0), page.getByRole("combobox").nth(1)]
  },
  // 프레임 화면 안에서 카테고리·필터를 바로 만드는 흐름.
  {
    name: "inline-add-buttons",
    path: UPLOAD,
    run: uploadAndName,
    mark: (page) => [addButton(page, 0), addButton(page, 1)]
  },
  {
    name: "inline-category-dialog",
    path: UPLOAD,
    run: async (page, ctx) => {
      await uploadAndName(page, ctx);
      await addButton(page, 0).click();
      await page.getByRole("dialog").waitFor();
      await page.getByPlaceholder("카테고리 이름을 입력하세요").fill("겨울 한정");
    }
  },
  {
    name: "inline-filter-dialog",
    path: UPLOAD,
    run: async (page, ctx) => {
      await uploadAndName(page, ctx);
      await addButton(page, 1).click();
      await page.getByRole("dialog").waitFor();
      await page.getByPlaceholder("필터 이름을 입력하세요").fill("화사한 피부");
      await page.waitForTimeout(4000); // 샘플 사진 미리보기가 그려질 때까지
    }
  },
  {
    name: "send-button",
    path: UPLOAD,
    run: async (page, ctx) => {
      await uploadSample(page, ctx);
      await page.getByPlaceholder("프레임 이름을 입력하세요").fill("겨울 한정 4컷");
    },
    mark: (page) => [page.getByRole("button", { name: "프레임 전송" })]
  },
  {
    name: "send-dialog",
    path: UPLOAD,
    run: async (page, ctx) => {
      await uploadSample(page, ctx);
      await page.getByPlaceholder("프레임 이름을 입력하세요").fill("겨울 한정 4컷");
      await page.getByRole("button", { name: "프레임 전송" }).click();
      await page.getByRole("dialog").waitFor();
      await page.getByRole("dialog").getByRole("checkbox").first().click();
      await page.getByRole("dialog").getByRole("checkbox").nth(1).click();
    },
    target: (page) => page.getByRole("dialog")
  },
  { name: "order-notice", path: LIST, mark: (page) => [page.getByText("프레임 순서는 이제 여기서 정해요").locator("xpath=../..")] },
  { name: "order-handle", path: LIST, viewport: { width: 1200, height: 1100 }, mark: (page) => [handle(page, FRAME)] },
  {
    name: "order-apply",
    path: LIST,
    viewport: { width: 1200, height: 1100 },
    run: (page) => moveRight(page, FRAME),
    mark: (page) => [page.getByRole("button", { name: "되돌리기" }), page.getByRole("button", { name: "적용", exact: true })]
  },
  { name: "card-buttons", path: LIST, mark: (page) => [card(page).getByRole("button", { name: "수정" }), card(page).getByRole("button", { name: "할당" }), page.getByRole("button", { name: `${FRAME} 조작` })] },
  {
    name: "assign-dialog",
    path: LIST,
    run: async (page) => {
      await card(page).getByRole("button", { name: "할당" }).click();
      await page.getByRole("dialog").waitFor();
    },
    target: (page) => page.getByRole("dialog")
  },
  {
    name: "card-menu",
    path: LIST,
    run: async (page) => {
      await page.getByRole("button", { name: `${FRAME} 조작` }).click();
      await page.getByRole("menuitem", { name: "복제" }).waitFor();
    }
  }
];
