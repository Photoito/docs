// DGit UI 의 문서 틀(@dgit/docs: Markdown·Mintlify 컴포넌트 렌더러, 문서 레이아웃, 스타일)을 src/lib 에 복사한다.
// `shadcn add @dgit/docs` 와 같은 일이다. 파일은 받은 그대로 두고, 포토이토만의 것은 build.ts 에 둔다.
//
//   bun scripts/docs-kit.ts                                   # https://ui.dgit.co/r/docs.json 에서
//   bun scripts/docs-kit.ts ~/dev/dgitco/ui/public/r/docs.json  # 로컬 dgitco/ui 빌드에서
import { readFileSync, writeFileSync } from "node:fs";

const from = process.argv[2] ?? "https://ui.dgit.co/r/docs.json";
const item: { files: { path: string; content: string }[] } = from.startsWith("http") ? await (await fetch(from)).json() : JSON.parse(readFileSync(from, "utf8"));
for (const f of item.files) {
  if (!f.path.endsWith(".ts")) continue; // docs.css 는 lib/docs-css.ts 와 같은 규칙이다
  const name = f.path.split("/").pop()!;
  writeFileSync(new URL(`../src/lib/${name}`, import.meta.url), f.content);
  console.log(`${f.path} → src/lib/${name}`);
}
