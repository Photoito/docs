// 시계를 앞당긴다 — 새벽에 찍어도 "오후의 가게"가 나오게.
//   DEMO_CLOCK_OFFSET_HOURS=13 npm run db   (dashboard, shots 도 같은 값으로)
// 데모 서버·대시보드·캡처 브라우저가 모두 같은 만큼 밀려야 한다. 값이 없으면 아무것도 하지 않는다.
const hours = Number(process.env.DEMO_CLOCK_OFFSET_HOURS || 0);
if (hours) {
  const offset = hours * 3_600_000;
  const RealDate = Date;
  const realNow = RealDate.now.bind(RealDate);
  class ShiftedDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(realNow() + offset);
      else super(...args);
    }
    static now() {
      return realNow() + offset;
    }
  }
  // 상속만으로는 Date 를 감싸는 쪽(Next)이 정적 함수를 못 찾는다 — 직접 달아 둔다.
  ShiftedDate.UTC = RealDate.UTC;
  ShiftedDate.parse = RealDate.parse;
  globalThis.Date = ShiftedDate;
}
