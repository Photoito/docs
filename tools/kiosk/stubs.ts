// 키오스크 화면이 부르는 Electron 다리(window.agentAPI / window.kiosk)의 가짜 구현.
// ★ 화면 모듈보다 먼저 평가돼야 한다 — 화면들이 모듈 최상단에서 SDK 를 잡는다.
import { createFakeSDK } from "@kiosk/sdk/fake";
import { state, frameJson, frameThumb, categoryEntities, FILTERS, defaultConfig, NEW_FRAME, NEW_THEME, themeMedia } from "./fixtures";

const ok = <T,>(data: T, message?: string) => Promise.resolve({ status: "success" as const, data, message });

const agentAPI: Record<string, (...args: unknown[]) => unknown> = {
  authenticateAdmin: () => ok({ role: "basic" }, "관리자 인증에 성공했습니다."),
  loadConfig: () => ok(state.config ?? (state.config = defaultConfig())),
  saveConfig: (config: unknown) => {
    state.config = config as typeof state.config;
    return ok({});
  },

  // ── 프레임 ──
  scanFrameDirectory: () =>
    ok({
      frames: state.installed.map((f) => ({ frameId: f.id, paperSize: f.paperSize, category: f.category, mtime: 0, price: f.price, currency: "KRW" }))
    }),
  readResourceFile: (path: unknown) => {
    const id = String(path).replace(/^frames\//, "").replace(/\.json$/, "");
    const f = state.installed.find((x) => x.id === id);
    return f ? ok(JSON.stringify(frameJson(f))) : Promise.resolve({ status: "fail", message: "not found" });
  },
  readFrameThumbnail: (id: unknown) => {
    const f = state.installed.find((x) => x.id === id);
    return f ? ok({ url: frameThumb(f) }) : Promise.resolve({ status: "fail" });
  },
  // 「새로고침」 = 서버에서 내려받기. 대시보드에서 방금 보낸 프레임이 이때 들어온다.
  downloadStoreResources: async (kind: unknown) => {
    await new Promise((r) => setTimeout(r, 900));
    if (kind === "frames" && !state.installed.some((f) => f.id === NEW_FRAME.id)) state.installed.push(NEW_FRAME);
    if (kind === "themes" && !state.themes.some((t) => t.id === NEW_THEME.id)) state.themes.push(NEW_THEME);
    return { status: "success", data: { downloaded: kind === "frames" || kind === "themes" ? 1 : 0 } };
  },

  // ── 첫화면(테마) ──
  scanThemeDirectory: () => ok({ themes: state.themes.map((t) => ({ themeId: t.id, mediaType: "image", fileExtension: "png" })) }),
  readThemeJson: (id: unknown) => {
    const t = state.themes.find((x) => x.id === id);
    return t ? ok({ themeId: t.id, name: t.name, targetResolution: "1080x1920" }) : Promise.resolve({ status: "fail" });
  },
  // base64 는 주지 않는다 — 주면 화면이 IndexedDB 에 저장해, 그림을 바꿔도 옛 것이 남는다.
  readThemeMedia: (id: unknown) => {
    const t = state.themes.find((x) => x.id === id);
    return t ? ok({ url: themeMedia(t) }) : Promise.resolve({ status: "fail" });
  },
  deleteThemeFile: () => ok({}),
  scanFilterDirectory: () => ok({ filters: FILTERS.map((f) => ({ filterId: f.id, filterName: f.name })) }),
  deleteFrameFiles: () => ok({}),

  cameraList: () => ok({ cameras: [{}] })
};

// 그 밖의 호출은 전부 "성공, 빈 데이터". on* 구독은 해제 함수를 돌려준다.
// ★ 로그인 직후의 「시스템 정보」 화면은 이 가짜 응답으로는 제대로 채워지지 않는다
//   (에이전트 상태가 "확인 중"에 머물고, `agentAPI.outbox.*` 같은 중첩 호출은 오류 문구를 낸다).
//   중첩 호출까지 성공으로 답하게 했더니 형태가 안 맞아 화면이 통째로 죽었다.
//   그 화면은 문서에 쓰지 않으니 그대로 둔다 — 스크린샷은 다른 메뉴를 연 뒤에 찍는다.
(window as unknown as { agentAPI: unknown }).agentAPI = new Proxy(agentAPI, {
  get(target, prop: string) {
    if (prop in target) return target[prop];
    if (/^on[A-Z]/.test(prop)) return () => () => {};
    return () => ok({});
  }
});

const fake = createFakeSDK();
(window as unknown as { kiosk: unknown }).kiosk = {
  ...fake,
  resources: {
    ...(fake as { resources?: object }).resources,
    scanFrameCategories: () => ok({ categories: categoryEntities() })
  },
  assets: {
    ...(fake as { assets?: object }).assets,
    readThemeJson: agentAPI.readThemeJson,
    readThemeMedia: agentAPI.readThemeMedia
  }
};
