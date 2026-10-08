// 프리셋 관리 문서용 화면.
// 데모에는 저장된 프리셋이 없다(만들려면 키오스크에 명령을 보내야 해서 만들지 않는다).
// 그래서 빈 목록과, 프리셋을 만드는 곳인 장치 관리의 「설정」 창만 찍는다.
const LIST = "/dashboard/config-presets";
const DEVICES = "/dashboard/device-management";

const openSettings = async (page) => {
  await page
    .locator('[data-slot="card"]')
    .filter({ hasText: "1번 부스" })
    .getByRole("button", { name: "설정", exact: true })
    .click();
  await page.getByRole("dialog").waitFor();
  await page.waitForTimeout(2500); // 프리셋 목록·백업 조회가 끝나고 알림이 사라질 때까지
};

const tab = (name) => async (page) => {
  await openSettings(page);
  await page.getByRole("tab", { name }).click();
  await page.waitForTimeout(600);
};

export default [
  { name: "list-empty", path: LIST },
  { name: "settings-current", path: DEVICES, run: openSettings, target: (page) => page.getByRole("dialog") },
  { name: "settings-boot", path: DEVICES, run: tab("부팅"), target: (page) => page.getByRole("dialog") },
  { name: "settings-backup", path: DEVICES, run: tab("백업/복원"), target: (page) => page.getByRole("dialog") }
];
