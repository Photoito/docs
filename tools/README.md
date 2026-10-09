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
- 부팅 화면은 `/?screen=boot&case=<이름>` 으로 상황별로 띄운다(`tools/kiosk/boot.ts`, 찍기는 `npm run shots -- kiosk-boot`).
  가짜 응답의 문구는 키오스크 메인 프로세스와 백엔드가 실제로 돌려주는 형태 그대로 적는다 — 문서가 그 문구를 찾아보게 돼 있다.
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

### 대시보드 개발 서버를 이미 띄워 두었다면

Next 는 한 폴더에서 개발 서버를 하나만 띄울 수 있다(`.next/dev/lock`). 대시보드 레포에서 `pnpm dev` 가
돌고 있으면 데모가 뜨지 않는다. 그때는 대시보드를 다른 폴더에 복사해 그쪽으로 띄운다.

```bash
git clone --local ../photoito-dashboard ../photoito-dashboard-docs-demo
(cd ../photoito-dashboard-docs-demo && pnpm install --frozen-lockfile)
bash tools/demo/run-dashboard.sh "$(cd ../photoito-dashboard-docs-demo && pwd)"
```

대시보드가 바뀌면 복사본에서 `git pull` 한 뒤 다시 띄운다.

### 밤에 찍을 때 — 시계 밀기

데이터는 "지금"까지만 채워진다. 새벽에 찍으면 홈의 「오늘 매출」이 0원이고 지난주 비교도 비어 나온다.
`DEMO_CLOCK_OFFSET_HOURS` 로 데모 서버·대시보드·캡처 브라우저의 시계를 같은 만큼 밀어 오후로 만든다
(`fake-clock.cjs`). 세 명령에 **같은 값**을 줘야 한다. 날짜가 넘어가지 않는 값으로 고른다.

```bash
DEMO_CLOCK_OFFSET_HOURS=13 npm run db
DEMO_CLOCK_OFFSET_HOURS=13 npm run dashboard
DEMO_CLOCK_OFFSET_HOURS=13 npm run shots
```

### 알아둘 것

- 날짜는 실행 시점 기준으로 만들어진다. 난수는 고정 시드라 분포는 매번 같다.
- 플랜·감자 팩·감자 단가는 2026-10-07 운영 값에 맞췄다. 가격이 바뀌면 `seed.mjs` 를 고친다.
- `push_device_tokens` 는 `photoito-ddl` 의 다른 브랜치에만 정의가 있어 `demo-server.mjs` 가 직접 만든다.
- 세션 쿠키 이름이 `__Secure-` 로 시작해 http 브라우저에 심을 수 없다. 그래서 중계 서버가 붙인다.
- 기기 CPU·메모리는 실시간 연결에서 오는 값이라 데모에서는 0% 로 나온다. 장치 관리 화면(`shots/devices.mjs`)만
  브라우저 안에서 그 연결을 흉내 내 지어낸 값을 채운다 — 안 그러면 「제어」 창이 키오스크를 오프라인으로 보고
  버튼을 막는다.
- 이용 내역의 재인쇄·재업로드·알림톡 버튼은 "촬영 후 24시간 안" 같은 시간 조건이 있다. 데모를 띄운 지 오래되면
  버튼이 비활성으로 찍히므로, 다시 찍기 전에 `npm run db` 를 껐다 켜서 날짜를 새로 채운다.
- 쿠폰 코드는 숫자 6자리만 가능하다(입력 칸과 키오스크 키패드 모두). 시드도 그렇게 넣는다.
- 여러 화면을 한꺼번에 찍을 때는 데모의 데이터를 바꾸지 않는다(저장·삭제·전송 버튼을 누르지 않는다).
  메모리 DB 하나를 모든 화면이 같이 쓴다.
- 공지사항 묶음은 공지를 하나 연다(읽음으로 바뀐다). 그 뒤에 찍는 화면의 「새 공지 n개」가 하나 줄어든다 — 전부 다시 찍을 때는 `npm run db` 를 새로 띄우고 한 번에 찍는다.
- 프레임 순서는 `sort_source='kiosk'` 로 채워 둔다. 비우면 프레임 관리에 「아직 키오스크에서 쓰던 순서를 받지 못했어요」 경고가 뜬다.
- 아직 데모에 없는 것: 프리셋(목록이 빈 채로 찍힌다), 세션 타임라인, 촬영 직후의 사진 미리보기.
