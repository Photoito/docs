// 이용 내역 문서용 화면.
// ★ 여기서는 아무것도 보내지 않는다 — 창을 열기만 하고 「발송」·「재인쇄 명령 보내기」·
//   「재업로드 시작」·「승인 취소 요청」은 누르지 않는다.
const LIST = "/dashboard/usage-history";
const WIDE = { width: 1700, height: 820 };
const PHONE = { width: 390, height: 844 };

const rows = (page) => page.locator("tbody tr");
const enabled = (page, name) => page.getByRole("button", { name, disabled: false });
// 작업 버튼 네 개가 모두 살아 있고(24시간 안) 연락처가 있는 줄.
const liveRows = (page) =>
  rows(page)
    .filter({ hasText: "010-" })
    .filter({ has: enabled(page, "재인쇄") })
    .filter({ has: enabled(page, "승인취소") });
const liveRow = (page) => liveRows(page).first();
const toolbarButton = (page, name) => page.getByRole("button", { name, exact: true }).first();
const popover = (page) => page.locator("[data-radix-popper-content-wrapper]").last();

async function ready(page) {
  await rows(page).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(600);
}

async function openAction(page, name) {
  await ready(page);
  await liveRow(page).getByRole("button", { name }).click();
  await page.getByRole("dialog").waitFor();
  await page.waitForTimeout(500);
}

// 줄을 눌러 「이용 상세」를 연다. 사진 미리보기가 "1시간까지" 안내로 나오는 줄을 고른다
// (데모의 가짜 서버에는 미리보기 주소가 없어서, 1시간 안의 줄은 오류 문구가 나온다).
async function openDetail(page) {
  await ready(page);
  await liveRows(page).nth(1).locator("td").nth(1).click();
  await page.getByRole("dialog").waitFor();
  await page.waitForTimeout(1500);
}

async function pickStatuses(page, names) {
  await ready(page);
  await toolbarButton(page, "진행 상태").click();
  for (const n of names) await popover(page).getByRole("option", { name: n }).click();
  await page.waitForTimeout(1500);
}

export default [
  { name: "list", path: LIST, run: ready, viewport: WIDE },
  {
    name: "toolbar",
    path: LIST,
    run: ready,
    viewport: { width: 1700, height: 430 },
    mark: (page) => [
      page.getByPlaceholder(/세션ID/),
      toolbarButton(page, "시작 시간"),
      toolbarButton(page, "디바이스"),
      toolbarButton(page, "진행 상태"),
      toolbarButton(page, "결제 수단"),
      toolbarButton(page, "결제 상태"),
      toolbarButton(page, "매장"),
      page.getByText("열 선택").first().locator("xpath=ancestor-or-self::button[1]")
    ]
  },
  {
    name: "search-phone",
    path: LIST,
    viewport: { width: 1700, height: 520 },
    run: async (page) => {
      await ready(page);
      // 연락처 뒷자리로 찾기 — 조회만 한다.
      const text = await liveRow(page).innerText();
      const last4 = text.match(/010-\*{4}-(\d{4})/)[1];
      await page.getByPlaceholder(/세션ID/).fill(last4);
      await page.waitForTimeout(2500);
    },
    mark: (page) => [page.getByPlaceholder(/세션ID/)]
  },
  {
    name: "filter-date",
    path: LIST,
    viewport: WIDE,
    run: async (page) => {
      await ready(page);
      await toolbarButton(page, "시작 시간").click();
      await page.waitForTimeout(600);
    }
  },
  {
    name: "filter-status",
    path: LIST,
    viewport: WIDE,
    run: async (page) => pickStatuses(page, ["인쇄 실패", "촬영 실패", "취소됨"])
  },
  {
    // 고른 뒤 목록을 닫은 모습 — 상태 배지가 가려지지 않게.
    name: "status-badges",
    path: LIST,
    viewport: WIDE,
    run: async (page) => {
      await pickStatuses(page, ["인쇄 실패", "촬영 실패", "취소됨"]);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(600);
    }
  },
  {
    name: "columns-menu",
    path: LIST,
    viewport: { width: 1700, height: 620 },
    run: async (page) => {
      await ready(page);
      await page.getByText("열 선택").first().click();
      await page.waitForTimeout(600);
    }
  },
  {
    name: "row-actions",
    path: LIST,
    viewport: { width: 1900, height: 520 },
    run: async (page) => {
      await ready(page);
      // 표가 옆으로 밀린 뒤에 표시를 그리도록 맨 끝 버튼부터 화면에 넣는다.
      await liveRow(page).getByRole("button", { name: "승인취소" }).scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    },
    mark: (page) =>
      ["카카오톡 전송", "재인쇄", "재업로드", "승인취소"].map((n) => liveRow(page).getByRole("button", { name: n }))
  },
  { name: "detail", path: LIST, viewport: { width: 1100, height: 1000 }, run: openDetail },
  { name: "kakao-dialog", path: LIST, viewport: WIDE, run: (page) => openAction(page, "카카오톡 전송"), target: (page) => page.getByRole("dialog") },
  { name: "reprint-dialog", path: LIST, viewport: WIDE, run: (page) => openAction(page, "재인쇄"), target: (page) => page.getByRole("dialog") },
  { name: "reupload-dialog", path: LIST, viewport: WIDE, run: (page) => openAction(page, "재업로드"), target: (page) => page.getByRole("dialog") },
  { name: "cancel-dialog", path: LIST, viewport: WIDE, run: (page) => openAction(page, "승인취소"), target: (page) => page.getByRole("dialog") },
  // 휴대폰 화면.
  {
    name: "mobile-list",
    path: LIST,
    viewport: PHONE,
    run: async (page) => {
      await page.getByText(/촬영 \d+장/).first().waitFor({ timeout: 30_000 });
      await page.waitForTimeout(600);
    }
  },
  {
    name: "mobile-filters",
    path: LIST,
    viewport: PHONE,
    run: async (page) => {
      await page.getByText(/촬영 \d+장/).first().waitFor({ timeout: 30_000 });
      await page.getByPlaceholder(/세션ID/).locator("xpath=following::button[1]").click();
      await page.waitForTimeout(1000);
    }
  },
  {
    name: "mobile-detail",
    path: LIST,
    viewport: PHONE,
    run: async (page) => {
      await page.getByText(/촬영 \d+장/).first().waitFor({ timeout: 30_000 });
      // 연락처는 휴대폰 목록에 안 보이므로 다섯 번째 줄(1시간이 지난 촬영)을 연다.
      await page.getByText(/촬영 \d+장/).nth(4).click();
      await page.getByRole("dialog").waitFor();
      await page.waitForTimeout(1500);
    },
    mark: (page) => {
      const d = page.getByRole("dialog");
      return [
        d.locator("section").filter({ hasText: "사진 미리보기" }).first(),
        d.getByRole("button", { name: "이용 흐름" }),
        d.locator("div.grid-cols-3")
      ];
    }
  }
];
