// 직원 관리 문서용 화면.
// ★ 「초대 보내기」·「저장」·「제거」 확인·「초대 취소」는 누르지 않는다.
const PAGE = "/dashboard/staff-management";

const dialog = (page) => page.getByRole("dialog");
const row = (page, name) =>
  page
    .locator("div.rounded-md.border")
    .filter({ hasText: name })
    .filter({ has: page.getByRole("button", { name: "권한 수정" }) });

async function openInvite(page) {
  await page.getByRole("button", { name: "직원 초대" }).click();
  await dialog(page).waitFor();
  await page.waitForTimeout(600);
}

async function fillInvite(page) {
  await openInvite(page);
  await page.getByPlaceholder("이메일").fill("staff@example.com");
  await page.getByPlaceholder("이름(선택)").fill("최직원");
}

const TALL = { width: 1200, height: 1500 };

export default [
  { name: "list", path: PAGE },
  { name: "invite-button", path: PAGE, mark: (page) => [page.getByRole("button", { name: "직원 초대" })] },
  {
    name: "invite-basic",
    path: PAGE,
    run: fillInvite,
    mark: (page) => [page.getByPlaceholder("이메일"), page.getByPlaceholder("이름(선택)")]
  },
  {
    name: "invite-2fa",
    path: PAGE,
    viewport: TALL,
    run: fillInvite,
    mark: (page) => [page.locator("#invite-two-factor").locator("xpath=.."), page.getByRole("button", { name: "초대 보내기" })]
  },
  {
    name: "member-buttons",
    path: PAGE,
    mark: (page) => [
      row(page, "이매니저").getByRole("button", { name: "정보 수정" }),
      row(page, "이매니저").getByRole("button", { name: "권한 수정" }),
      row(page, "이매니저").getByRole("button", { name: "제거" })
    ]
  },
  {
    name: "permissions-dialog",
    path: PAGE,
    viewport: TALL,
    run: async (page) => {
      await row(page, "이매니저").getByRole("button", { name: "권한 수정" }).click();
      await dialog(page).waitFor();
      await page.waitForTimeout(600);
    },
    target: dialog
  },
  {
    name: "profile-dialog",
    path: PAGE,
    run: async (page) => {
      await row(page, "이매니저").getByRole("button", { name: "정보 수정" }).click();
      await dialog(page).waitFor();
      await page.waitForTimeout(600);
    },
    target: dialog
  },
  {
    name: "remove-dialog",
    path: PAGE,
    run: async (page) => {
      await row(page, "박알바").getByRole("button", { name: "제거" }).click();
      await page.getByText("직원을 제거할까요?").waitFor();
      await page.waitForTimeout(400);
    }
  },
  { name: "pending-invite", path: PAGE, mark: (page) => [page.getByRole("button", { name: "초대 취소" })] }
];
