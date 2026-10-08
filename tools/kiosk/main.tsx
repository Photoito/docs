// 키오스크 화면 하니스 진입점.
//   /?screen=admin                 관리자 설정 화면(로그인부터)
//   /?screen=idle&theme=<themeId>  손님이 보는 대기 화면(그 첫화면을 고른 상태)
//
// ★ import 순서가 중요하다: stubs 가 window.agentAPI / window.kiosk 를 만든 뒤에
//   화면 모듈을 불러야 한다. 그래서 화면은 동적 import 로 가져온다.
import "./stubs";
import "./app.css";
import "react-toastify/dist/ReactToastify.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";

await import("@kiosk/i18n");
const { useAppStore } = await import("@kiosk/store");
const AdminPage = (await import("@kiosk/pages/AdminPage")).default;
const IdlePage = (await import("@kiosk/pages/IdlePage")).default;
const { state, NEW_THEME, defaultConfig } = await import("./fixtures");

const params = new URLSearchParams(location.search);
const screen = params.get("screen") ?? "admin";

// 대기 화면은 "어떤 첫화면이 골라져 있는가"를 설정에서 읽는다. 관리자 화면을 거치지 않고
// 바로 그 상태를 만들어 준다(관리자 화면에서 활성화를 누른 것과 같은 결과).
if (screen === "idle") {
  const themeId = params.get("theme");
  if (themeId === NEW_THEME.id) state.themes.push(NEW_THEME);
  const config = defaultConfig();
  config.themes = {
    activeThemeId: themeId,
    items: state.themes.map((t) => ({ themeId: t.id, name: t.name, mediaType: "image", fileExtension: "png", isActive: t.id === themeId }))
  };
  state.config = config;
  useAppStore.getState().setSystemConfig(config as never);
}
useAppStore.setState({ currentStep: screen });

// App.tsx 의 래퍼를 그대로 옮겼다(관리자 화면은 글자 크기 배율을 적용하지 않는다).
function Shell() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-white">
      <div className="w-full h-full">
        <div className="kiosk-scale w-full h-full">
          <div className="font-sans text-maclike text-thicker text-stroked w-full h-full">
            {screen === "idle" ? <IdlePage /> : <AdminPage />}
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Shell />);
