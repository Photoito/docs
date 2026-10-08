# 포토이토 사용자 가이드

포토이토 키오스크와 대시보드의 사용 안내서. [Mintlify](https://mintlify.com) 로 만들고, `main` 에 올라가면 자동으로 배포된다.

## 폴더

```
docs.json          사이트 설정과 목차
index.mdx          가이드 홈
install/           설치 및 수리
dashboard/         대시보드 화면별 안내
troubleshooting/   오류 해결하기
drafts/            아직 쓰지 않은 쪽 (사이트에 올라가지 않는다)
images/ko/         스크린샷과 설명 그림
tools/             스크린샷 생성 도구 (사이트에 올라가지 않는다)
```

## 미리보기

```bash
npx mint@latest dev
```

`docs.json` 의 목차를 바꾼 뒤에는 미리보기를 껐다 켜야 반영된다.

## 새 쪽 추가하기

1. 맞는 폴더에 `.mdx` 파일을 만든다. 파일 이름이 곧 주소다(`dashboard/frames.mdx` → `/dashboard/frames`).
2. `docs.json` 의 목차에 그 경로를 넣는다. 넣지 않으면 사이드바에 나오지 않는다.
3. 쓰다 만 쪽은 `drafts/` 에 둔다. 거기 있는 파일은 배포되지 않는다.

`drafts/` 에는 처음에 잡아 둔 목차(키오스크 설정, 결제 설정, 기기별 오류 등)가 제목과 소제목만 있는 상태로 들어 있다. 내용을 채우면 맞는 폴더로 옮기고 목차에 넣는다.

## 스크린샷

대시보드와 키오스크 화면 사진은 손으로 찍지 않고 `tools/` 의 도구로 만든다. 실제 화면을 지어낸 데이터로 띄워서 찍기 때문에 가게 매출이나 손님 연락처가 섞이지 않고, 화면이 바뀌면 다시 찍을 수 있다. 방법은 [tools/README.md](tools/README.md).

## 글쓰기 규칙

[AGENTS.md](AGENTS.md) 에 정리했다. 사람이 쓸 때도 같은 규칙을 따른다.
