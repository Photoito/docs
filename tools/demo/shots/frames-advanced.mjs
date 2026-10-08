// 프레임 고급 설정 문서용 화면 — 날짜 표시, QR 코드, 함께찍기 모드.
import { join } from "node:path";
import { makeFramePng } from "../sample-frame.mjs";

const UPLOAD = "/dashboard/frame-upload";

async function prepare(page, { here }) {
  const file = join(here, ".tmp", "sample-frame.png");
  await makeFramePng(page.context(), file);
  await page.locator('input[type="file"][accept*="image"]').first().setInputFiles(file);
  await page.getByText(/투명 영역을 감지했어요|레이아웃 영역/).first().waitFor({ timeout: 30_000 });
  await page.getByPlaceholder("프레임 이름을 입력하세요").fill("겨울 한정 4컷");
  await page.waitForTimeout(5000); // 알림 토스트가 사라진 뒤에 찍는다
}

// 설정 칸과 오른쪽 미리보기가 한 화면에 들어오도록 세로로 긴 화면에서 찍는다.
const TALL = { width: 1200, height: 1750 };

// 숫자 칸은 포커스를 잃을 때 값이 적용된다.
async function setNumber(page, id, value) {
  const input = page.locator("#" + id);
  await input.fill(String(value));
  await input.press("Tab");
}

// 샘플 프레임(2400×3600) 아래쪽 글자 영역에 맞춘 값.
async function placeDate(page) {
  await toggle(page, "날짜 표시").click();
  await setNumber(page, "dateX", 1480);
  await setNumber(page, "dateY", 3470);
  await setNumber(page, "dateWidth", 800);
  await setNumber(page, "dateHeight", 90);
  await setNumber(page, "dateFontSize", 60);
  await page.locator("#dateTextAlign").click();
  await page.getByRole("option", { name: "우측 중앙" }).click();
  await page.locator("#dateTextColor").fill("#ffffff");
}

async function placeQr(page) {
  await toggle(page, "QR 코드").click();
  await setNumber(page, "qrX", 130);
  await setNumber(page, "qrY", 3180);
  await setNumber(page, "qrSize", 320);
}

const toggle = (page, label) => page.getByText(label, { exact: true });
const scrollTo = async (page, text) => {
  await page.getByText(text, { exact: true }).first().evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(700);
};

export default [
  {
    name: "toggles",
    path: UPLOAD,
    run: async (page, ctx) => {
      await prepare(page, ctx);
      await scrollTo(page, "가격");
    },
    mark: (page) => [toggle(page, "날짜 표시"), toggle(page, "QR 코드"), toggle(page, "함께찍기 모드")]
  },
  {
    name: "date",
    path: UPLOAD,
    viewport: TALL,
    run: async (page, ctx) => {
      await prepare(page, ctx);
      await placeDate(page);
      await page.waitForTimeout(800);
    },
    mark: (page) => [page.getByText("날짜 표시 세부 설정").locator("xpath=..")]
  },
  {
    name: "qr",
    path: UPLOAD,
    viewport: TALL,
    run: async (page, ctx) => {
      await prepare(page, ctx);
      await placeQr(page);
      await page.waitForTimeout(800);
    },
    mark: (page) => [page.getByText("QR 코드 세부 설정").locator("xpath=..")]
  },
  {
    name: "date-and-qr",
    path: UPLOAD,
    viewport: TALL,
    run: async (page, ctx) => {
      await prepare(page, ctx);
      await placeDate(page);
      await placeQr(page);
      await page.waitForTimeout(800);
    }
  },
  {
    name: "group-shoot",
    path: UPLOAD,
    viewport: TALL,
    run: async (page, ctx) => {
      await prepare(page, ctx);
      await toggle(page, "함께찍기 모드").click();
      await page.waitForTimeout(800);
    },
    mark: (page) => [page.getByText("함께찍기 설정").locator("xpath=..")]
  },
  {
    name: "group-shoot-target",
    path: UPLOAD,
    run: async (page, ctx) => {
      await prepare(page, ctx);
      await toggle(page, "함께찍기 모드").click();
      await scrollTo(page, "함께찍기 설정");
      await page.getByRole("button", { name: "대상 추가" }).click();
      await page.getByRole("dialog").waitFor();
      await page.getByPlaceholder("대상 이름").fill("포토이토 캐릭터");
    },
    target: (page) => page.getByRole("dialog")
  }
];
