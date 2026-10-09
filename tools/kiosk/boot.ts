// 부팅 화면(BootPage)의 상황별 가짜 응답.
//   /?screen=boot&case=<이름>
//
// 응답 문구는 지어내지 않았다 — 키오스크 메인 프로세스(electron/license/license-manager.ts)와
// 백엔드(photoito-be identity/src/routes/kiosk/license.ts)가 실제로 돌려주는 형태 그대로다.
const api = (window as unknown as { agentAPI: Record<string, (...args: unknown[]) => unknown> }).agentAPI;

const never = () => new Promise(() => {});
const VALID = {
  data: { is_valid: true, valid: true, id: "demo-license-1", expires_at: "2027-10-08T00:00:00.000Z", can_update: true, can_use: true }
};
const invalid = (error_message: string, can_update: boolean) => ({ data: { is_valid: false, valid: false, can_update, error_message } });

// 백엔드 errorResponse() 의 본문. 키오스크는 이 본문을 통째로 오류 문구에 붙여서 보여 준다
// (electron/utils/fetch-error-format.ts → `HTTP <상태> <상태문구>: <본문>`).
const beFail = (status: number, statusText: string, code: string, message: string) =>
  `Activate failed: ${status} HTTP ${status} ${statusText}: ${JSON.stringify({ status: "fail", message, data: {}, error: { code, message } })}`;

// 어느 상황에서든 필요한 기본값 — 정상 부팅이 끝까지 가는 응답.
Object.assign(api, {
  getAppVersion: () => Promise.resolve("1.19.0"),
  licenseCheck: () => Promise.resolve(VALID),
  isNetworkOnline: () => Promise.resolve(true),
  checkUpdate: () => Promise.resolve({ data: { available: false } }),
  getUpdateCredentials: () => Promise.resolve(null),
  syncResources: () => Promise.resolve({ success: true, downloaded: [], failed: [] }),
  downloadStoreResources: () => Promise.resolve({ status: "success", data: { downloaded: 0, failed: 0, total: 0 } }),
  listStoreBundles: () => Promise.resolve([]),
  verifyBundleIntegrity: () => Promise.resolve({ ok: true }),
  checkRequiredBinaries: () => Promise.resolve({ allPresent: true, missing: [] }),
  startAllAgents: () => Promise.resolve(),
  getAgentStatus: () => Promise.resolve({ camera: { status: "ok" }, printer: { status: "ok" }, payment: { status: "ok" } }),
  initLicenseRuntime: () => Promise.resolve(),
  printerSpoolerPurge: () => Promise.resolve()
});

const manual = () => Promise.resolve({ recovered: false, action: "manual", nextRetryMs: null });

const CASES: Record<string, () => void> = {
  // 정상 진행 중 — 리소스 동기화에서 멈춰 둔다.
  progress: () => {
    api.syncResources = never;
  },
  // 인터넷이 없을 때 — 업데이트와 동기화를 건너뛰고, 그다음 단계에서 멈춰 둔다.
  offline: () => {
    api.isNetworkOnline = () => Promise.resolve(false);
    api.getAgentStatus = never;
  },
  // 라이선스가 한 번도 등록되지 않은 키오스크.
  "license-input": () => {
    api.licenseCheck = () => Promise.resolve(invalid("License file not found or corrupted", false));
    api.licenseAttemptSelfHeal = manual;
  },
  // 저장된 라이선스의 기간이 지났다. 파일 자체는 멀쩡해서 자동 복구는 "이미 있음"으로 판정한다.
  expired: () => {
    api.licenseCheck = () => Promise.resolve(invalid("License expired", true));
    api.licenseAttemptSelfHeal = () => Promise.resolve({ recovered: true, action: "use-current", nextRetryMs: null });
    api.licenseRefresh = () => Promise.resolve({ success: false, message: "Refresh failed" });
  },
  // 자동으로 다시 확인하는 중(인터넷이 끊겨 있을 때).
  "self-heal": () => {
    api.licenseCheck = () => Promise.resolve(invalid("License file not found or corrupted", false));
    api.licenseAttemptSelfHeal = () => Promise.resolve({ recovered: false, action: "wait-network", nextRetryMs: 32000 });
  },
  // 자동으로 다시 확인하는 중(인터넷은 되는데 서버가 라이선스를 받아 주지 않을 때).
  "self-heal-server": () => {
    api.licenseCheck = () => Promise.resolve(invalid("License file not found or corrupted", false));
    api.licenseAttemptSelfHeal = () => Promise.resolve({ recovered: false, action: "reactivate", nextRetryMs: 60000 });
  },
  // 필수 프로그램 파일이 없다.
  blocked: () => {
    api.checkRequiredBinaries = () => Promise.resolve({ allPresent: false, missing: ["camera-agent.exe"] });
  },
  // 카메라 프로그램이 30초 안에 준비되지 않는다.
  // ★ 이 실패는 부팅을 막지 않는다 — 빨간 문구는 다음 단계(리소스 로딩) 동안만 보이고 부팅은 끝까지 간다.
  //   문구가 보이는 순간을 찍으려고 다음 단계를 멈춰 둔다.
  "agent-fail": () => {
    api.scanFrameDirectory = never;
    api.getAgentStatus = () => Promise.resolve({ camera: { status: "bad" }, printer: { status: "ok" }, payment: { status: "ok" } });
  },
  // 일부 리소스를 받지 못했다(부팅은 계속된다) — 그다음 단계에서 멈춰 둔다.
  "sync-warning": () => {
    api.downloadStoreResources = (kind: unknown) =>
      kind === "frames"
        ? Promise.resolve({ status: "fail", message: "다운로드 실패", data: { downloaded: 3, failed: 1, total: 4 } })
        : Promise.resolve({ status: "success", data: { downloaded: 0, failed: 0, total: 0 } });
    api.getAgentStatus = never;
  }
};

// 활성화 키를 넣었을 때 서버가 거절하는 경우들. 화면은 「license-input」과 같고, 키를 넣고 누르면 문구가 뜬다.
const ACTIVATE: Record<string, string> = {
  "activate-invalid": beFail(404, "Not Found", "NOT_FOUND", "유효하지 않은 Activation key예요."),
  "activate-other-device": beFail(409, "Conflict", "CONFLICT", "라이선스가 다른 디바이스에서 이미 활성화되어 있어요."),
  "activate-expired": beFail(403, "Forbidden", "FORBIDDEN", "라이선스가 만료되었어요."),
  "activate-disabled": beFail(403, "Forbidden", "FORBIDDEN", "라이선스 사용이 비활성화되어 있어요."),
  "activate-rate-limit": beFail(429, "Too Many Requests", "RATE_LIMIT_EXCEEDED", "요청이 너무 많아요. 잠시 후 다시 시도해 주세요."),
  "activate-timeout": "Activate failed: 0 Request timeout after 8000ms",
  "activate-no-network": "Activate failed: 0 fetch failed"
};

export function applyBootCase(name: string) {
  if (name in ACTIVATE) {
    CASES["license-input"]();
    api.licenseActivate = () => Promise.resolve({ status: "error", success: false, message: ACTIVATE[name] });
    return;
  }
  (CASES[name] ?? CASES.progress)();
}
