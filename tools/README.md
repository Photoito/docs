# 스크린샷 도구

문서의 스크린샷은 손으로 찍지 않고 이 폴더의 도구로 만든다. 화면이 바뀌면 명령 하나로 다시 찍는다.
이 폴더는 `.mintignore` 에 들어 있어 문서 사이트에는 올라가지 않는다.

```
tools/demo/      데모 대시보드(가짜 데이터) + 캡처 스크립트
tools/kiosk/     키오스크 화면 하니스
images/ko/       결과물 — 문서가 /images/ko/... 로 참조한다
```

## 스크린샷 다시 찍기

스크린샷은 실제 대시보드를 **지어낸 데이터**로 띄워서 찍는다. 운영 DB·운영 API 에는
닿지 않는다.

- DB: 프로세스 안에서 도는 Postgres(PGlite)에 `photoito-ddl` 기본 파일을 올리고 `seed.mjs` 를 넣는다.
- BE API·저장소: `demo-server.mjs` 가 가짜 응답과 가짜 이미지를 내준다.
- 로그인: 세션 확인 요청에 데모 사장님 계정을 돌려준다.

이 레포 옆에 `photoito-ddl`, `photoito-dashboard` 가 있어야 한다. 터미널 세 개에서:

```bash
cd tools/demo && npm install
npm run db          # 메모리 DB(:54329) + 가짜 BE(:54330)
npm run dashboard   # 대시보드(:3411) — .env 의 모든 변수를 가짜 값으로 덮어쓴다
npm run proxy       # 세션 쿠키를 붙여 주는 중계(:3412)
```

그다음:

```bash
npm run shots            # 전부
npm run shots -- frames  # shots/frames.mjs 만
```

데모 대시보드는 <http://127.0.0.1:3412/dashboard/overview> 에서 직접 둘러볼 수 있다.

## 키오스크 화면 찍기

키오스크 관리자 화면(설정 → 프레임 관리 등)도 실제 화면 그대로 찍는다. 이 레포 옆에
`photo-booth-kiosk` 가 있어야 하고, 그 레포에서 `pnpm install` 이 돼 있어야 한다.

```bash
node tools/kiosk/serve.mjs              # :5320
cd tools/demo && npm run shots -- kiosk-frames
```

- 키오스크 레포의 화면 컴포넌트(`src/pages/AdminPage` 등)를 그대로 불러와 브라우저에서 띄운다.
  키오스크 레포는 읽기만 한다 — 수정하지 않고, 캐시도 `tools/kiosk/.tmp` 에 둔다.
- Electron 다리(`window.agentAPI`, `window.kiosk`)는 `tools/kiosk/stubs.ts` 가 가짜로 채운다.
  「새로고침」을 누르면 프레임이 하나 새로 들어오도록 해 두었다(대시보드에서 방금 보낸 프레임 역할).
- 프레임 데이터는 대시보드 데모와 같은 것을 쓴다(`tools/demo/seed.mjs`).
- 로그인 직후의 「시스템 정보」 화면은 가짜 데이터로 채워지지 않는다. 문서에 쓰지 않는다.
- Vite·React 는 키오스크 레포의 `node_modules` 것을 빌려 쓴다. 여기에 따로 설치하면 React 가
  두 벌이 되어 화면이 깨진다.

## 문서 검증

미리보기를 띄운 채로 깨진 그림과 죽은 링크·앵커를 찾는다.

```bash
npx mint@latest dev --port 3345          # 레포 루트에서
cd tools/demo && npm run verify -- http://localhost:3345 dashboard/frames dashboard/themes
```

### 알아둘 것

- 날짜는 실행 시점 기준으로 만들어진다. 난수는 고정 시드라 분포는 매번 같다.
- 플랜·감자 팩·감자 단가는 2026-10-07 운영 값에 맞췄다. 가격이 바뀌면 `seed.mjs` 를 고친다.
- `push_device_tokens` 는 `photoito-ddl` 의 다른 브랜치에만 정의가 있어 `demo-server.mjs` 가 직접 만든다.
- 세션 쿠키 이름이 `__Secure-` 로 시작해 http 브라우저에 심을 수 없다. 그래서 중계 서버가 붙인다.
- 기기 CPU·메모리는 실시간 연결에서 오는 값이라 데모에서는 0% 로 나온다.
