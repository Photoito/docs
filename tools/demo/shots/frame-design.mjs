// 프레임 제작하기 문서용 화면 — 네모가 아닌 모양으로 뚫은 프레임을 실제로 올린 결과.
import { join } from "node:path";
import { makeShapesPng } from "../sample-shapes.mjs";

export default [
  {
    name: "shapes-detected",
    path: "/dashboard/frame-upload",
    viewport: { width: 1200, height: 1150 },
    run: async (page, { here }) => {
      const file = join(here, ".tmp", "sample-shapes.png");
      await makeShapesPng(page.context(), file);
      await page.locator('input[type="file"][accept*="image"]').first().setInputFiles(file);
      await page.getByText(/투명 영역을 감지했어요/).first().waitFor({ timeout: 40_000 });
      await page.waitForTimeout(5000); // 알림 토스트가 사라진 뒤에 찍는다
    },
    // 오른쪽 미리보기 그림(자리 번호가 그려진 캔버스)만 찍는다.
    target: (page) => page.locator("canvas").first()
  }
];
