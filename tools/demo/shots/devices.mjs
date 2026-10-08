// 장치 관리 문서용 화면.
//
// 데모에는 실시간 연결(WebSocket)이 없어 CPU·메모리·디스크가 0% 로 나오고, 제어 창이
// 키오스크를 오프라인으로 본다. 그래서 이 묶음은 **브라우저 안에서만** 실시간 연결을
// 흉내 낸다(page.routeWebSocket) — 데모 서버는 건드리지 않는다. 값은 전부 지어낸 것이다.
const LIST = "/dashboard/device-management";
const BOOTH1 = "1번 부스";
const BOOTH2 = "2번 부스";

const report = (cpu, memory, disk, uptimeHours, step) => ({
  system: {
    cpu_usage_percent: cpu,
    memory_usage_percent: memory,
    disk_usage_percent: disk,
    uptime_seconds: uptimeHours * 3600
  },
  camera: { available: true, camera_name: "Canon EOS R100" },
  session: { current_step: step },
  maintenance: { enabled: false }
});

const liveStatuses = (overrides = {}) => [
  {
    device_id: "demo-device-1",
    is_online: true,
    last_status_at: new Date().toISOString(),
    last_device_status: report(18, 46, 37, 5, "capture"),
    ...overrides["demo-device-1"]
  },
  {
    device_id: "demo-device-2",
    is_online: true,
    last_status_at: new Date().toISOString(),
    last_device_status: report(7, 41, 52, 3, "idle"),
    ...overrides["demo-device-2"]
  }
];

/** 실시간 연결을 흉내 낸 뒤 화면을 다시 연다. */
const live = (overrides, ready = "CPU") => async (page) => {
  await page.routeWebSocket(/\/ws\/admin/, (ws) => {
    ws.onMessage((raw) => {
      const text = String(raw);
      if (text === '{"hb":1}') return ws.send('{"hb":1,"ack":1}');
      if (!text.includes("request_status")) return;
      ws.send(
        JSON.stringify({
          id: "demo-snapshot",
          type: "response",
          action: "status.bulk_snapshot",
          data: { statuses: liveStatuses(overrides) },
          timestamp: new Date().toISOString()
        })
      );
    });
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText(ready).first().waitFor();
  await page.waitForTimeout(1500);
};

const card = (page, name) => page.locator('[data-slot="card"]').filter({ hasText: name });
const openFromCard = async (page, name, button) => {
  await card(page, name).getByRole("button", { name: button, exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.waitForTimeout(800);
};

export default [
  { name: "list", path: LIST, run: live() },
  {
    // 표시가 다섯 개라 화면을 넉넉히 키워, 표시를 그리는 동안 화면이 밀리지 않게 한다.
    name: "card-parts",
    path: LIST,
    viewport: { width: 1200, height: 720 },
    run: live(),
    mark: (page) => {
      const c = card(page, BOOTH1);
      return [
        c.getByText("온라인").locator("xpath=../.."),
        c.locator("div.flex.items-center.gap-4").first(),
        c.locator("div.text-right").first(),
        c.locator("div.grid.border-t").first(),
        c.locator("div.grid.grid-cols-3").first()
      ];
    }
  },
  {
    name: "paper",
    path: LIST,
    run: live(),
    mark: (page) => [card(page, BOOTH2).getByText("38장")]
  },
  {
    name: "restart-alert",
    path: LIST,
    run: live({ "demo-device-2": { last_device_status: report(7, 41, 52, 31, "idle") } }),
    mark: (page) => [page.getByText(/하루 넘게 켜져 있어요/).locator("xpath=..")]
  },
  {
    name: "details-dialog",
    path: LIST,
    run: async (page) => {
      await live()(page);
      await openFromCard(page, BOOTH1, "상세");
      await page.getByText("기본 정보").waitFor();
      await page.waitForTimeout(1500);
    },
    target: (page) => page.getByRole("dialog")
  },
  {
    name: "control-dialog",
    path: LIST,
    run: async (page) => {
      await live()(page);
      await openFromCard(page, BOOTH1, "제어");
    },
    target: (page) => page.getByRole("dialog"),
    mark: (page) => {
      const d = page.getByRole("dialog");
      return [
        d.getByRole("button", { name: "점검모드 켜기" }),
        d.getByRole("button", { name: "프로그램 재시작" }),
        d.getByRole("button", { name: "PC 재부팅" })
      ];
    }
  },
  {
    name: "maintenance-form",
    path: LIST,
    run: async (page) => {
      await live()(page);
      await openFromCard(page, BOOTH1, "제어");
      const d = page.getByRole("dialog");
      await d.getByLabel("안내 제목").fill("프린터 용지를 교체하고 있어요");
      await d.getByLabel("안내 내용").fill("5분 뒤에 다시 이용해 주세요.");
    },
    target: (page) => page.getByRole("dialog"),
    mark: (page) => {
      const d = page.getByRole("dialog");
      return [d.getByLabel("안내 제목"), d.getByLabel("안내 내용"), d.getByRole("button", { name: "점검모드 켜기" })];
    }
  },
  {
    // 확인 단계까지만 연다 — 「재시작」은 누르지 않는다.
    name: "restart-confirm",
    path: LIST,
    run: async (page) => {
      await live()(page);
      await openFromCard(page, BOOTH1, "제어");
      await page.getByRole("dialog").getByRole("button", { name: "프로그램 재시작" }).click();
      await page.getByText("키오스크 프로그램을 재시작할까요?").waitFor();
    },
    target: (page) => page.getByRole("dialog"),
    mark: (page) => [page.getByRole("dialog").getByRole("button", { name: "재시작", exact: true })]
  },
  {
    name: "bulk-button",
    path: LIST,
    run: live(),
    mark: (page) => [page.getByRole("button", { name: /일괄작업/ })]
  },
  {
    name: "bulk-menu",
    path: LIST,
    run: async (page) => {
      await live()(page);
      await page.getByRole("button", { name: /일괄작업/ }).click();
      await page.getByRole("button", { name: "전체 점검 켜기" }).waitFor();
      await page.waitForTimeout(600);
    }
  },
  {
    // 확인 창까지만 연다 — 마지막 「전체 점검 켜기」는 누르지 않는다.
    name: "bulk-confirm",
    path: LIST,
    run: async (page) => {
      await live()(page);
      await page.getByRole("button", { name: /일괄작업/ }).click();
      await page.getByRole("button", { name: "전체 점검 켜기" }).click();
      await page.getByRole("alertdialog").waitFor();
      await page.waitForTimeout(600);
    },
    target: (page) => page.getByRole("alertdialog")
  },
  {
    // 프리셋 관리 문서가 쓴다 — 실시간 값이 채워진 화면이 이 묶음에만 있어서 여기서 찍는다.
    name: "settings-button",
    path: LIST,
    run: live(),
    mark: (page) => [card(page, BOOTH1).getByRole("button", { name: "설정", exact: true })]
  },
  {
    name: "mobile-list",
    path: LIST,
    viewport: { width: 390, height: 700 },
    run: live(undefined, "온라인")
  },
  {
    name: "mobile-sheet",
    path: LIST,
    viewport: { width: 390, height: 780 },
    run: async (page) => {
      await live(undefined, "온라인")(page);
      await page.getByRole("button", { name: `${BOOTH1} 작업 열기` }).click();
      await page.getByRole("tab", { name: "제어" }).waitFor();
      await page.waitForTimeout(800);
    }
  }
];
