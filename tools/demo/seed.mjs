// 데모 시드 — 전부 지어낸 값. 날짜는 실행 시점 기준이라 언제 띄워도 "오늘"이 채워진다.
// 난수는 고정 시드라 실행할 때마다 같은 분포가 나온다(스크린샷이 흔들리지 않게).

export const STORE_ID = "demo-store-1";
export const OWNER_ID = "demo-owner";

export const FRAMES = [
  { id: "demo-frame-01", name: "클래식 4컷 화이트", price: 4000, cat: "demo-cat-basic", color: "#f5f1ea" },
  { id: "demo-frame-02", name: "클래식 4컷 블랙", price: 4000, cat: "demo-cat-basic", color: "#1f1f24" },
  { id: "demo-frame-03", name: "하트 체크 핑크", price: 5000, cat: "demo-cat-season", color: "#f7c6d0" },
  { id: "demo-frame-04", name: "가을 단풍 2컷", price: 3000, cat: "demo-cat-season", color: "#d98b4a" },
  { id: "demo-frame-05", name: "스카이 블루 6컷", price: 6000, cat: "demo-cat-basic", color: "#9cc7ea" },
  { id: "demo-frame-06", name: "생일 축하 에디션", price: 5000, cat: "demo-cat-season", color: "#ffd86b" }
];
export const CATEGORIES = [
  { id: "demo-cat-basic", name: "기본 프레임", summary: "언제나 잘 어울리는 깔끔한 프레임" },
  { id: "demo-cat-season", name: "시즌 한정", summary: "계절과 기념일에 맞춘 한정 프레임" }
];
export const THEMES = [
  { id: "demo-theme-01", name: "가을 시즌 첫화면", color: "#c9743a" },
  { id: "demo-theme-02", name: "기본 첫화면", color: "#2d3a56" }
];
export const FILTERS = [
  { id: "demo-filter-01", name: "뽀샤시 화사하게" },
  { id: "demo-filter-02", name: "필름 감성" }
];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const q = (v) => (v === null || v === undefined ? "NULL" : typeof v === "number" ? String(v) : typeof v === "boolean" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const row = (...vals) => `(${vals.map(q).join(",")})`;
const iso = (d) => d.toISOString();
const DAY = 86_400_000;

export async function seed(db) {
  const now = new Date();
  const rand = rng(20261007);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const days = (n) => new Date(now.getTime() + n * DAY);

  // ── 사람 ──
  await db.exec(`
    INSERT INTO auth."user" (id, name, email, "emailVerified", role, banned, "phoneNumber", "phoneNumberVerified", approved, locale, "twoFactorRequired", "createdAt") VALUES
      ('demo-owner', '김포토', 'owner@demo.photoito.example', true, 'user', false, '+821000000001', true, true, 'ko', false, ${q(iso(days(-120)))}),
      ('demo-admin', '포토이토 운영팀', 'ops@demo.photoito.example', true, 'admin', false, NULL, false, true, 'ko', false, ${q(iso(days(-400)))}),
      ('demo-staff-1', '이매니저', 'manager@demo.photoito.example', true, 'user', false, '+821000000002', true, true, 'ko', false, ${q(iso(days(-60)))}),
      ('demo-staff-2', '박알바', 'parttime@demo.photoito.example', true, 'user', false, '+821000000003', true, true, 'ko', false, ${q(iso(days(-21)))});

    INSERT INTO stores (id, name, display_name, business_name, business_number, representative_name, address, contact_number, country, timezone, operates_24h, operating_open_time, operating_close_time, created_at)
    VALUES ('${STORE_ID}', '포토이토 데모점', '포토이토 데모점', '데모상사', '000-00-00000', '김포토', '서울특별시 데모구 예시로 123, 1층', '02-000-0000', 'KR', 'Asia/Seoul', false, '10:00', '23:00', ${q(iso(days(-120)))});

    INSERT INTO user_stores (user_id, store_id, role, created_at) VALUES
      ('demo-owner', '${STORE_ID}', 'owner', ${q(iso(days(-120)))}),
      ('demo-staff-1', '${STORE_ID}', 'staff', ${q(iso(days(-60)))}),
      ('demo-staff-2', '${STORE_ID}', 'staff', ${q(iso(days(-21)))});

    INSERT INTO store_member_permissions (store_id, user_id, permission_key, granted_by) VALUES
      ('${STORE_ID}', 'demo-staff-1', 'usage-history', 'demo-owner'),
      ('${STORE_ID}', 'demo-staff-1', 'device-management', 'demo-owner'),
      ('${STORE_ID}', 'demo-staff-1', 'coupon-management', 'demo-owner'),
      ('${STORE_ID}', 'demo-staff-1', 'frame-management', 'demo-owner'),
      ('${STORE_ID}', 'demo-staff-2', 'usage-history', 'demo-owner'),
      ('${STORE_ID}', 'demo-staff-2', 'device-management', 'demo-owner');
  `);

  // ── 라이선스 · 기기 ──
  await db.exec(`
    UPDATE commerce.plans SET is_published = false;
    UPDATE commerce.plans SET name = '베이직', price_krw = 39000, billing_cycle_days = 30, potato_grant = 39000, default_print_quota = -1, is_published = true, is_active = true, sort_order = 0 WHERE code = 'standard';

    INSERT INTO licenses (id, store_id, plan_id, expires_at, origin, print_quota, print_quota_used, offline_allowed, activation_key, is_active, can_update, can_use, activated_at, last_used_at, created_at)
    SELECT v.id::uuid, '${STORE_ID}', p.id, v.exp::timestamptz, 'subscription', -1, v.used, true, v.akey, true, true, true, v.act::timestamptz, now(), v.act::timestamptz
    FROM commerce.plans p,
      (VALUES ('00000000-0000-4000-8000-0000000000a1', ${q(iso(days(23)))}, 2184, 'DEMO-AAAA-1111-BOOTH', ${q(iso(days(-118)))}),
              ('00000000-0000-4000-8000-0000000000a2', ${q(iso(days(23)))}, 1367, 'DEMO-BBBB-2222-BOOTH', ${q(iso(days(-97)))})) AS v(id, exp, used, akey, act)
    WHERE p.code = 'standard';

    INSERT INTO devices (id, license_id, activation_key, fingerprint, device_name, os, arch, processor, processor_cores, total_ram_gb, windows_edition, windows_version, first_seen_at, last_seen_at) VALUES
      ('demo-device-1', '00000000-0000-4000-8000-0000000000a1', 'DEMO-AAAA-1111-BOOTH', 'demo-fp-1', '1번 부스', 'windows', 'x64', 'Intel(R) Core(TM) i5-12400', 12, 16, 'Windows 11 Pro', '10.0.26100', ${q(iso(days(-118)))}, now()),
      ('demo-device-2', '00000000-0000-4000-8000-0000000000a2', 'DEMO-BBBB-2222-BOOTH', 'demo-fp-2', '2번 부스', 'windows', 'x64', 'Intel(R) Core(TM) i5-12400', 12, 16, 'Windows 11 Pro', '10.0.26100', ${q(iso(days(-97)))}, now());

    INSERT INTO device_printers (device_id, printer_name, printer_config_name, printer_role, serial_number, firmware_version, status, remaining_prints, total_prints, last_status_at) VALUES
      ('demo-device-1', 'DNP DS-RX1HS', 'DS-RX1HS', '6x4-main', 'DEMO-PRN-0001', '2.06', 'ready', 412, 700, now()),
      ('demo-device-1', 'DNP DS620', 'DS620', '6x2-main', 'DEMO-PRN-0003', '1.61', 'ready', 268, 400, now()),
      ('demo-device-2', 'DNP DS-RX1HS', 'DS-RX1HS', '6x4-main', 'DEMO-PRN-0002', '2.06', 'ready', 38, 700, now());

    INSERT INTO device_cameras (device_id, camera_name, port, serial_number, firmware_version, camera_role, status, last_status_at) VALUES
      ('demo-device-1', 'Canon EOS R100', 'USB', 'DEMO-CAM-0001', '1.3.0', 'main', 'connected', now()),
      ('demo-device-2', 'Canon EOS R100', 'USB', 'DEMO-CAM-0002', '1.3.0', 'main', 'connected', now());
  `);

  // ── 콘텐츠 ──
  await db.exec(`
    INSERT INTO store_frame_categories (category_id, store_id, category_name, summary, description, cover_filename, sort_order, r2_bucket, r2_path, assigned_at) VALUES
      ${CATEGORIES.map((c, i) => row(c.id, STORE_ID, c.name, null, null, null, i, "store-datas", `${STORE_ID}/frame-categories/${c.id}/`, iso(days(-110)))).join(",")};

    INSERT INTO store_filters (filter_id, store_id, filter_name, spec, thumb_filename, r2_bucket, r2_path, assigned_at) VALUES
      ${FILTERS.map((f) => `(${q(f.id)}, '${STORE_ID}', ${q(f.name)}, '{}'::jsonb, 'thumb.png', 'store-datas', '${STORE_ID}/filters/${f.id}/', ${q(iso(days(-90)))})`).join(",")};

    INSERT INTO store_frames (frame_id, store_id, frame_name, r2_bucket, r2_path, price, currency, is_active, category_id, assigned_at, updated_at) VALUES
      ${FRAMES.map((f, i) => row(f.id, STORE_ID, f.name, "store-datas", `${STORE_ID}/frames/`, f.price, "KRW", i !== 5, f.cat, iso(days(-100 + i * 9)), iso(days(-40 + i * 6)))).join(",")};

    INSERT INTO store_frame_devices (frame_id, device_id)
      SELECT f.frame_id, d.id FROM store_frames f CROSS JOIN devices d WHERE f.is_active;

    INSERT INTO store_themes (theme_id, store_id, theme_name, r2_bucket, r2_path, file_extension, media_type, is_active, assigned_at, updated_at) VALUES
      ${THEMES.map((t, i) => row(t.id, STORE_ID, t.name, "store-datas", `${STORE_ID}/themes/`, "png", "image", true, iso(days(-80 + i * 30)), iso(days(-30 + i * 10)))).join(",")};

    INSERT INTO store_theme_devices (theme_id, device_id)
      SELECT 'demo-theme-01', id FROM devices;
  `).catch(async (e) => {
    // store_*_devices 의 컬럼 구성이 다르면 배정만 건너뛴다(목록 화면에는 지장 없음).
    console.log("[seed] 콘텐츠 일부 건너뜀:", e.message.slice(0, 160));
  });

  // ── 쿠폰 · 공지 · 감자 ──
  await db.exec(`
    INSERT INTO coupons (id, code, name, description, discount_type, discount_value, max_discount_amount, valid_from, valid_to, usage_limit, purpose, is_active, created_by, created_at) VALUES
      ('00000000-0000-4000-8000-0000000000c1', '104729', '첫 방문 1,000원 할인', '처음 오신 손님께 드리는 할인', 'fixed', 1000, NULL, ${q(iso(days(-60)))}, ${q(iso(days(120)))}, 500, 'welcome', true, 'demo-owner', ${q(iso(days(-60)))}),
      ('00000000-0000-4000-8000-0000000000c2', '582013', '가을 시즌 2,000원 할인', '시즌 프레임 출시 기념', 'fixed', 2000, NULL, ${q(iso(days(-14)))}, ${q(iso(days(30)))}, 300, 'event', true, 'demo-owner', ${q(iso(days(-14)))}),
      ('00000000-0000-4000-8000-0000000000c3', '730156', '생일 축하 무료 촬영', '생일 당일 1회 무료', 'percentage', 100, NULL, ${q(iso(days(-90)))}, ${q(iso(days(275)))}, NULL, 'birthday', true, 'demo-owner', ${q(iso(days(-90)))});
    INSERT INTO coupon_stores (coupon_id, store_id) SELECT id, '${STORE_ID}' FROM coupons;

    INSERT INTO notices (category, title, body_md, pinned, publish_at, created_by, created_at) VALUES
      ('update', '10월 업데이트 안내: 이용 내역에 촬영 타임라인이 추가됐어요', '손님이 어느 화면에서 얼마나 머물렀는지 **이용 내역**에서 확인할 수 있어요.\n\n- 화면 이동 기록\n- 촬영 컷별 시각\n- 결제·인쇄 결과', true, ${q(iso(days(-2)))}, 'demo-admin', ${q(iso(days(-2)))}),
      ('notice', '추석 연휴 고객센터 운영 안내', '연휴 기간에는 긴급 장애만 접수해요. 일반 문의는 연휴 뒤 순서대로 답변드릴게요.', false, ${q(iso(days(-9)))}, 'demo-admin', ${q(iso(days(-9)))}),
      ('maintenance', '정기 점검 안내 (새벽 3시~4시)', '점검 중에는 대시보드 접속이 잠시 끊길 수 있어요. 키오스크 촬영에는 영향이 없어요.', false, ${q(iso(days(-20)))}, 'demo-admin', ${q(iso(days(-20)))}),
      ('event', '가을 시즌 프레임 12종 무료 배포', '공유 저장소에서 내려받아 바로 쓸 수 있어요.', false, ${q(iso(days(-27)))}, 'demo-admin', ${q(iso(days(-27)))});

    INSERT INTO store_potato_allowances (id, store_id, quota, used, expires_at, is_active, notes, activated_at, last_used_at, created_at) VALUES
      ('00000000-0000-4000-8000-0000000000b1', '${STORE_ID}', 138000, 18100, ${q(iso(days(64)))}, true, '감자 50,000개 충전 + 플랜 지급', ${q(iso(days(-26)))}, now(), ${q(iso(days(-26)))});

    -- 감자 단가: 2026-10-07 운영 값. DDL 기본값(0.5 등)을 그대로 두면 화면의 차감 안내가 실제와 달라진다.
    INSERT INTO potato_unit_costs (action_code, unit_cost, description) VALUES
      ('frame_send', 500, '프레임 1개 기기 전송'),
      ('frame_metadata_update', 100, '프레임 메타데이터 수정 1회'),
      ('theme_send', 700, '첫화면 1개 기기 전송'),
      ('theme_metadata_update', 100, '첫화면 메타데이터 수정 1회'),
      ('kakao_send', 100, '카카오 알림톡 1건 발송'),
      ('share_link_create', 50, '공유 링크 신규 발급'),
      ('reprint', 500, '관리자 재인쇄 1회'),
      ('data_export', 10, '데이터 내보내기 파일 1건')
    ON CONFLICT (action_code) DO UPDATE SET unit_cost = EXCLUDED.unit_cost, description = EXCLUDED.description;

    INSERT INTO store_alert_rules (id, store_id, event_type, params, enabled, created_by, created_at) VALUES
      ('00000000-0000-4000-8000-0000000000d1', '${STORE_ID}', 'printer_paper_low', '{"threshold": 50}'::jsonb, true, 'demo-owner', ${q(iso(days(-50)))});
    INSERT INTO store_alert_channels (rule_id, channel, enabled) VALUES ('00000000-0000-4000-8000-0000000000d1', 'push', true);
    INSERT INTO store_alert_recipients (rule_id, user_id) VALUES
      ('00000000-0000-4000-8000-0000000000d1', 'demo-owner'),
      ('00000000-0000-4000-8000-0000000000d1', 'demo-staff-1');
  `);

  await db.exec(`
    INSERT INTO commerce.potato_packs (code, name, price_krw, potato_amount, is_published, is_active, sort_order) VALUES
      ('pack-1000', '감자 1,000개', 1000, 1000, true, true, 1),
      ('pack-5000', '감자 5,000개', 5000, 5500, true, true, 2),
      ('pack-50000', '감자 50,000개', 50000, 60000, true, true, 3),
      ('pack-100000', '감자 100,000개', 100000, 150000, true, true, 4);

    INSERT INTO push_device_tokens (user_id, store_id, fcm_token, platform, device_model, app_version) VALUES
      ('demo-owner', '${STORE_ID}', 'demo-fcm-token-owner', 'ios', 'iPhone 15', '1.2.0'),
      ('demo-staff-1', '${STORE_ID}', 'demo-fcm-token-staff-1', 'android', 'Galaxy S24', '1.2.0');
  `);

  // ── 공유 저장소 ──
  // 가게와 링크하지는 않는다 — 링크하면 가게 쪽 프레임 카드에 「공유 저장소」 표시가 붙어
  // 다른 문서의 화면이 달라진다. 저장소 화면 자체를 보여 주는 데는 이것으로 충분하다.
  const LIB = "demo-library-1";
  await db.exec(`
    INSERT INTO resource_libraries (library_id, created_by_user_id, library_name, created_at) VALUES ('${LIB}', 'demo-owner', '우리 가게 공통 자료', ${q(iso(days(-40)))});
    INSERT INTO resource_library_owner_stores (library_id, store_id) VALUES ('${LIB}', '${STORE_ID}');
    INSERT INTO library_frame_categories (category_id, library_id, category_name, sort_order, r2_bucket, r2_path) VALUES
      ('lib-demo-cat-basic', '${LIB}', '기본 프레임', 0, 'store-datas', 'libraries/${LIB}/frame-categories/lib-demo-cat-basic/');
    INSERT INTO library_filters (filter_id, library_id, filter_name, spec, thumb_filename, r2_bucket, r2_path) VALUES
      ('lib-demo-filter-01', '${LIB}', '뽀샤시 화사하게', '{}'::jsonb, 'thumb.png', 'store-datas', 'libraries/${LIB}/filters/lib-demo-filter-01/');
    INSERT INTO library_frames (frame_id, library_id, frame_name, r2_bucket, r2_path, price, currency, category_id, filter_id, assigned_at) VALUES
      ${FRAMES.slice(0, 3).map((f, i) => row("lib-" + f.id, LIB, f.name, "store-datas", `libraries/${LIB}/frames/`, f.price, "KRW", "lib-demo-cat-basic", i === 0 ? "lib-demo-filter-01" : null, iso(days(-38 + i)))).join(",")};
    INSERT INTO library_themes (theme_id, library_id, theme_name, r2_bucket, r2_path, file_extension, media_type, assigned_at) VALUES
      ('lib-demo-theme-01', '${LIB}', '가을 시즌 첫화면', 'store-datas', 'libraries/${LIB}/themes/', 'png', 'image', ${q(iso(days(-30)))});
  `);

  // ── 촬영 세션 · 결제 (최근 75일) ──
  // 시간대별 가중치(영업 10~23시, 저녁 피크) · 요일 가중치(주말 1.8배).
  const hourWeight = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 5, 6, 6, 7, 8, 9, 11, 13, 14, 12, 8, 3];
  const hourTotal = hourWeight.reduce((a, b) => a + b, 0);
  const kstHour = (d) => (d.getUTCHours() + 9) % 24;
  const activeFrames = FRAMES.slice(0, 5);
  const frameWeight = [30, 22, 24, 10, 14];
  const sessions = [];
  const payments = [];
  const files = [];
  let n = 0;

  for (let back = 74; back >= 0; back--) {
    // KST 자정 기준 그 날의 시작
    const kstNow = new Date(now.getTime() + 9 * 3_600_000);
    const dayStartUtc = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() - back) - 9 * 3_600_000;
    const dow = new Date(dayStartUtc + 9 * 3_600_000).getUTCDay();
    const weekend = dow === 0 || dow === 6;
    const growth = 1 + (74 - back) * 0.004; // 완만한 성장
    const count = Math.round((weekend ? 54 : 30) * growth * (0.8 + rand() * 0.4));

    for (let i = 0; i < count; i++) {
      let r = rand() * hourTotal;
      let hour = 0;
      while ((r -= hourWeight[hour]) > 0) hour++;
      const start = new Date(dayStartUtc + hour * 3_600_000 + Math.floor(rand() * 3_600_000));
      if (start > now) continue; // 오늘은 지금 시각까지만

      n++;
      const sid = `demo-session-${String(n).padStart(5, "0")}`;
      const device = rand() < 0.58 ? "demo-device-1" : "demo-device-2";
      let fr = rand() * 100;
      let fi = 0;
      while ((fr -= frameWeight[fi]) > 0) fi++;
      const frame = activeFrames[fi];
      const copies = rand() < 0.62 ? 2 : rand() < 0.5 ? 4 : 6;
      const roll = rand();
      const status = roll < 0.955 ? "completed" : roll < 0.975 ? "print_failed" : roll < 0.99 ? "cancelled" : "capture_failed";
      const done = new Date(start.getTime() + (150 + Math.floor(rand() * 170)) * 1000);
      const phone = rand() < 0.35 ? `010-0000-${String(Math.floor(rand() * 10000)).padStart(4, "0")}` : null;
      const total = frame.price + (copies - 2) * 1000;

      sessions.push(
        `(${q(STORE_ID)},${q(device)},${q(sid)},${q(frame.id)},${q(status)},4,${status === "completed" ? copies : 0},${q(phone)},${q(JSON.stringify({ frameName: frame.name, copies, locale: "ko" }))}::jsonb,${q(iso(start))},${status === "cancelled" ? "NULL" : q(iso(done))},${q(iso(start))})`
      );

      if (status !== "cancelled") {
        const tr = rand();
        const type = tr < 0.68 ? "card" : tr < 0.9 ? "cash" : "digital";
        const cr = rand();
        const coupon = cr < 0.06 ? ["00000000-0000-4000-8000-0000000000c1", 1000] : cr < 0.1 ? ["00000000-0000-4000-8000-0000000000c2", 2000] : null;
        const discount = coupon ? coupon[1] : 0;
        const paid = total - discount;
        const refunded = status !== "completed" && rand() < 0.7;
        const payAt = new Date(start.getTime() + 40_000 + Math.floor(rand() * 30_000));
        payments.push(
          `(${q(`demo-pay-${String(n).padStart(5, "0")}`)},${q(sid)},${q(STORE_ID)},${q(device)},${q(type)},${total},${discount},${type === "cash" ? Math.ceil(paid / 1000) * 1000 : paid},${coupon ? `${q(coupon[0])}::uuid` : "NULL"},${q(refunded ? "refunded" : "approved")},${q(type === "cash" ? null : String(30000000 + Math.floor(rand() * 60000000)))},${q(iso(payAt))},${refunded ? q(iso(new Date(done.getTime() + 600_000))) : "NULL"},${q(JSON.stringify({ method: type }))}::jsonb,${q(iso(payAt))})`
        );
      }

      if (status === "completed") {
        const base = `${device}/${start.getUTCFullYear()}/${start.getUTCMonth() + 1}/${start.getUTCDate()}/${sid}/`;
        files.push(`(${q(sid)},${q(base + "results/")},'kiosk-uploads','result.jpg','jpg','result_image',${q(iso(done))})`);
        for (let k = 1; k <= 4; k++) files.push(`(${q(sid)},${q(base + "photos/")},'kiosk-uploads','photo_${k}.jpg','jpg','original_image',${q(iso(done))})`);
      }
    }
  }

  const potato = [];
  let balance = 60000;
  const A = "00000000-0000-4000-8000-0000000000b1";
  potato.push(`(${q(STORE_ID)},${q(A)}::uuid,NULL,-60000,'addon_purchase','order','DEMO-ORD-1',60000,${q(iso(days(-26)))})`);
  const uses = [
    ...Array.from({ length: 97 }, () => ["kakao_send", 100, "session"]),
    ...Array.from({ length: 10 }, () => ["reprint", 500, "session"]),
    ...Array.from({ length: 4 }, () => ["frame_send", 500, "frame"]),
    ...Array.from({ length: 2 }, () => ["theme_send", 700, "theme"])
  ]
    .map((u) => ({ u, at: now.getTime() - rand() * 25.5 * DAY }))
    .concat([0, 1].map((k) => ({ u: ["plan_auto_grant", -39000, "license"], at: now.getTime() - 7 * DAY + k * 1000 })))
    .sort((a, b) => a.at - b.at);
  uses.forEach(({ u, at }, i) => {
    balance -= u[1];
    const device = u[2] === "session" ? (rand() < 0.6 ? "demo-device-1" : "demo-device-2") : null;
    potato.push(`(${q(STORE_ID)},${q(A)}::uuid,${q(device)},${u[1]},${q(u[0])},${q(u[2])},${q("demo-ref-" + i)},${balance},${q(iso(new Date(at)))})`);
  });

  const chunk = async (head, rows, size = 400) => {
    for (let i = 0; i < rows.length; i += size) await db.exec(`${head} VALUES ${rows.slice(i, i + size).join(",")};`);
  };
  await chunk(`INSERT INTO photo_sessions (store_id, device_id, session_id, frame_id, status, total_shots, printed_count, customer_phone, metadata, started_at, completed_at, created_at)`, sessions);
  await chunk(`INSERT INTO payments (payment_id, session_id, store_id, device_id, payment_type, total_amount, discount_amount, inserted_amount, coupon_id, status, approval_num, approved_at, refunded_at, metadata, created_at)`, payments);
  await chunk(`INSERT INTO session_files (session_id, r2_path, r2_bucket, filename, format, filetype, created_at)`, files);

  await chunk(`INSERT INTO potato_usage_logs (store_id, allowance_id, device_id, amount, reason, ref_type, ref_id, balance_after, created_at)`, potato);

  console.log(`[seed] 세션 ${sessions.length} · 결제 ${payments.length} · 파일 ${files.length}`);
}
