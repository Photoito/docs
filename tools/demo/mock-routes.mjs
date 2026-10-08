// 가짜 BE API — 대시보드가 워커에 묻는 경로들. 가능한 한 데모 DB 를 읽어 답한다.
// 반환: { status?, body } 또는 undefined(모르는 경로).
const DAY = 86_400_000;
const iso = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString();

const BILLING_KEY = {
  id: "00000000-0000-4000-8000-0000000000e1",
  card_brand: "신한카드",
  card_number_masked: null,
  label: "가게 결제 카드",
  status: "active",
  issued_at: iso(-118)
};

async function standardPlan(db) {
  const r = await db.query(
    `SELECT id, code, name, price_krw, currency, billing_cycle_days, is_active, is_published,
            default_print_quota, potato_grant::text AS potato_grant, sort_order
       FROM commerce.plans WHERE code = 'standard'`
  );
  return r.rows[0];
}

async function licenses(db, storeId) {
  const r = await db.query(
    `SELECT l.*, s.name AS store_name, s.display_name AS store_display_name,
            p.code AS plan_code, p.name AS plan_name,
            p.default_offline_allowed AS plan_default_offline_allowed,
            COALESCE(l.print_quota, p.default_print_quota) AS effective_print_quota,
            COALESCE(l.offline_allowed, p.default_offline_allowed) AS effective_offline_allowed,
            d.id AS kiosk_device_id, d.fingerprint AS kiosk_device_fingerprint, d.device_name AS kiosk_device_name,
            true AS has_active_subscription
       FROM licenses l
       JOIN commerce.plans p ON l.plan_id = p.id
       LEFT JOIN stores s ON l.store_id = s.id
       LEFT JOIN devices d ON d.license_id = l.id
      WHERE l.store_id = $1 AND l.is_deleted = FALSE
      ORDER BY l.created_at`,
    [storeId]
  );
  return r.rows;
}

const subId = (i) => `00000000-0000-4000-8000-0000000000f${i + 1}`;

export async function handleBe(method, path, params, db) {
  if (method !== "GET") return undefined;
  const storeId = params.get("storeId") ?? "demo-store-1";

  if (path === "/v1/commerce/storefront") {
    const plans = await db.query(
      `SELECT id, code, name, price_krw, billing_cycle_days, potato_grant::text AS potato_grant, sort_order
         FROM commerce.plans WHERE is_published AND is_active AND NOT is_deleted ORDER BY sort_order, price_krw`
    );
    const packs = await db.query(
      `SELECT id, code, name, description, price_krw, potato_amount::text AS potato_amount, validity_days, image_url, sort_order
         FROM commerce.potato_packs WHERE is_published AND is_active AND NOT is_deleted ORDER BY sort_order`
    );
    return { body: { plans: plans.rows, potatoPacks: packs.rows } };
  }

  if (path === "/v1/identity/licenses/mine") return { body: await licenses(db, storeId) };

  if (path === "/v1/commerce/subscriptions/mine") {
    const plan = await standardPlan(db);
    const ls = await licenses(db, storeId);
    return {
      body: ls.map((l, i) => ({
        subscription: {
          id: subId(i),
          user_id: "demo-owner",
          store_id: storeId,
          plan_id: plan.id,
          billing_key_id: BILLING_KEY.id,
          license_id: l.id,
          status: "active",
          current_period_start: iso(-7),
          current_period_end: iso(23),
          next_billing_at: iso(23),
          canceled_at: null,
          cancel_at_period_end: false,
          cancel_requested_at: null,
          end_plan_id: null,
          end_expires_at: null,
          end_plan_name: null,
          charge_attempt_count: 0,
          last_charge_attempt_at: iso(-7),
          last_charge_error: null,
          created_at: l.created_at,
          updated_at: iso(-7)
        },
        plan,
        billingKey: BILLING_KEY
      }))
    };
  }

  if (path === "/v1/commerce/subscriptions/succession/mine") return { body: [] };
  if (path === "/v1/commerce/billing-keys/mine") return { body: BILLING_KEY };

  if (path === "/v1/commerce/payments") {
    const plan = await standardPlan(db);
    const rows = [];
    for (let cycle = 0; cycle < 4; cycle++) {
      for (let i = 0; i < 2; i++) {
        if (i === 1 && cycle === 3) continue; // 2번 부스는 한 달 늦게 시작
        const at = iso(-7 - cycle * 30);
        rows.push({
          id: `00000000-0000-4000-8000-00000000${String(cycle).padStart(2, "0")}${i}0`,
          subscription_id: subId(i),
          order_id: `DEMO-SUB-${at.slice(0, 10).replace(/-/g, "")}-${i + 1}`,
          nicepay_tid: `demo${at.slice(0, 10).replace(/-/g, "")}0000${i + 1}`,
          order_name: `${plan.name} 정기결제 (${i + 1}번 부스)`,
          amount: plan.price_krw,
          currency: "KRW",
          status: "paid",
          approved_at: at,
          failure_reason: null,
          raw_response: null,
          created_at: at,
          updated_at: at,
          selfRefundable: false,
          selfRefundBlockedReason: "키오스크에서 활성화한 라이선스는 환불되지 않아요."
        });
      }
    }
    return { body: { rows, total: rows.length, page: 1, pageSize: 20 } };
  }

  if (path === "/v1/commerce/orders/mine") {
    const rows = [
      {
        id: "00000000-0000-4000-8000-000000000a90",
        order_id: `DEMO-ORD-${iso(-26).slice(0, 10).replace(/-/g, "")}-1`,
        nicepay_tid: "demo-order-tid-0001",
        order_name: "감자 50,000개",
        total_amount_krw: 50000,
        currency: "KRW",
        status: "paid",
        approved_at: iso(-26),
        cancelled_at: null,
        failure_reason: null,
        created_at: iso(-26),
        selfRefundable: false,
        selfRefundBlockedReason: "이미 사용한 감자가 있어 환불되지 않아요."
      }
    ];
    return { body: { rows, total: rows.length, page: 1, pageSize: 20 } };
  }

  let m = path.match(/^\/v1\/media\/store-resources\/([^/]+)\/(frame-categories|filters)$/);
  if (m) {
    const table = m[2] === "filters" ? "store_filters" : "store_frame_categories";
    const order = m[2] === "filters" ? "assigned_at" : "sort_order";
    const r = await db.query(`SELECT * FROM ${table} WHERE store_id = $1 AND is_deleted = false ORDER BY ${order}`, [decodeURIComponent(m[1])]);
    return { body: { status: "success", data: { [m[2] === "filters" ? "filters" : "frame_categories"]: r.rows } } };
  }

  m = path.match(/^\/v1\/identity\/store-ops\/([^/]+)\/staff$/);
  if (m) {
    const sid = decodeURIComponent(m[1]);
    const members = await db.query(
      `SELECT us.user_id, u.email, u.name, u."phoneNumber" AS phone, us.role,
              COALESCE((SELECT array_agg(permission_key ORDER BY permission_key) FROM store_member_permissions p
                         WHERE p.store_id = us.store_id AND p.user_id = us.user_id), ARRAY[]::varchar[]) AS permissions
         FROM user_stores us JOIN auth."user" u ON u.id = us.user_id
        WHERE us.store_id = $1 ORDER BY (us.role = 'owner') DESC, us.created_at`,
      [sid]
    );
    return {
      body: {
        status: "success",
        data: {
          members: members.rows,
          pendingInvitations: [{ id: "00000000-0000-4000-8000-0000000000aa", email: "newstaff@demo.photoito.example", name: "최신입", expires_at: iso(5) }],
          platformAdmins: []
        }
      }
    };
  }

  return undefined;
}
