// 첫화면 관리 문서용 화면.
import { join } from "node:path";
import { makeThemePng } from "../sample-theme.mjs";

const LIST = "/dashboard/theme-management";
const UPLOAD = "/dashboard/theme-upload";
const NAME = "겨울 시즌 첫화면";
const EXISTING = "가을 시즌 첫화면";

async function uploadSample(page, { here }) {
  const file = join(here, ".tmp", "sample-theme.png");
  await makeThemePng(page.context(), file);
  await page.locator('input[type="file"]').first().setInputFiles(file);
  await page.waitForTimeout(5000); // 알림 토스트가 사라진 뒤에 찍는다
}

// 세로형 키오스크 기준으로 채운다 — 이름, 미리보기 비율(세로), 목표 해상도(세로).
async function fill(page, ctx) {
  await uploadSample(page, ctx);
  await page.getByPlaceholder("테마 이름을 입력하세요").fill(NAME);
  await page.getByRole("combobox").nth(0).click();
  await page.getByRole("option", { name: "9:16 (세로)" }).click();
  await page.getByRole("combobox").nth(1).click();
  await page.getByRole("option", { name: "1080x1920 (Full HD 세로)" }).click();
  await page.waitForTimeout(800);
}

const card = (page) => page.locator("div").filter({ hasText: EXISTING }).filter({ has: page.getByRole("button", { name: "할당" }) }).last();

export default [
  { name: "list", path: LIST },
  { name: "add-button", path: LIST, mark: (page) => [page.getByRole("button", { name: "첫화면 추가" })] },
  { name: "upload-empty", path: UPLOAD, mark: (page) => [page.getByText("테마 파일 업로드").locator("xpath=ancestor::div[contains(@class,'border')][1]")] },
  {
    name: "upload-settings",
    path: UPLOAD,
    run: fill,
    mark: (page) => [page.getByPlaceholder("테마 이름을 입력하세요"), page.getByRole("combobox").nth(0), page.getByRole("combobox").nth(1)]
  },
  { name: "send-button", path: UPLOAD, run: fill, mark: (page) => [page.getByRole("button", { name: "테마 전송" })] },
  {
    name: "send-dialog",
    path: UPLOAD,
    run: async (page, ctx) => {
      await fill(page, ctx);
      await page.getByRole("button", { name: "테마 전송" }).click();
      await page.getByRole("dialog").waitFor();
      for (const box of await page.getByRole("dialog").getByRole("checkbox").all()) await box.click();
    },
    target: (page) => page.getByRole("dialog")
  },
  {
    name: "card-buttons",
    path: LIST,
    mark: (page) => [card(page).getByRole("button", { name: "수정" }), card(page).getByRole("button", { name: "할당" }), page.getByRole("button", { name: `${EXISTING} 조작` })]
  }
];
