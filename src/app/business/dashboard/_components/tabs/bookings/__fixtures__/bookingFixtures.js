import dayjs from "dayjs";

const SERVICES = [
  "60-minute Yoga",
  "Reformers Pilates",
  "Private Coaching",
  "Sound Bath",
  "Strength Circuit",
  "Alexander Maximilian Bartholomew III's Masterclass in Classical Portraiture",
];

const FIRST = [
  "Jane", "Marcus", "Priya", "Elena", "Noah", "Amara", "Chris", "Sofia",
  "Liam", "Hana", "Diego", "Aisha", "Owen", "Mei", "Theo", "Lucia",
  "Kai", "Nora", "Sam", "Ivy",
];
const LAST = [
  "Doe", "Chen", "Patel", "Rossi", "Kim", "Nwosu", "Park", "Alvarez",
  "Okafor", "Berg", "Sato", "Khan", "Walsh", "Nguyen", "Silva", "Moreau",
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function buildRow(i) {
  const statusCycle = ["confirmed", "confirmed", "completed", "cancelled", "forfeited", "completed"];
  const attendanceCycle = ["pending", "attended", "no_show", "attended", "pending", "attended"];
  const status = statusCycle[i % statusCycle.length];
  const attendance = attendanceCycle[i % attendanceCycle.length];
  const isCourse = i % 7 === 0;
  const participants = i % 5 === 0 ? 4 : i % 3 === 0 ? 2 : 1;
  const sessionOffset = status === "confirmed" ? (i % 10) + 1 : -((i % 12) + 1);
  const sessionDate = dayjs().add(sessionOffset, "day");
  const bookedOn = dayjs().subtract((i % 40) + 1, "day").hour(10 + (i % 8)).minute(15);
  const hour = 9 + (i % 10);
  const first = FIRST[i % FIRST.length];
  const last = LAST[i % LAST.length];
  const longName = i === 1;
  const user_name = longName
    ? "Alexandria Catherine Montgomery-Whitfield"
    : `${first} ${last}`;
  const class_name = SERVICES[i % SERVICES.length];
  const id = 90000 + i;
  const amount = [45, 72, 120, 28, 95, 60][i % 6];
  const refunded = status === "cancelled";

  const list = {
    id,
    user_facing_reference: `CE-DEMO${pad(i + 1)}`,
    user_name,
    user_email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    class_name,
    option_name: isCourse ? "8-week series" : "Standard",
    enrollment_type: isCourse ? "Full Course" : "Single Session",
    session_info: isCourse ? { current_session: (i % 8) + 1, total_sessions: 8 } : null,
    date: sessionDate.format("YYYY-MM-DD"),
    time: `${pad(hour)}:30:00`,
    participants,
    status,
    attendance,
    booking_date: bookedOn.toISOString(),
    cancellation_reason: status === "cancelled" ? "Client requested" : null,
    is_rescheduled: i % 9 === 0,
  };

  const detail = {
    ...list,
    payment_status: refunded ? "refunded" : "paid",
    amount_paid: amount,
    allocated_net_payout: Math.round(amount * 0.88 * 100) / 100,
    payout_status: status === "confirmed" ? "pending" : "settled",
    payout_eta: status === "confirmed" ? sessionDate.add(1, "day").toISOString() : null,
    has_multiple_options: isCourse,
    duration: 60,
    participant_details: Array.from({ length: participants }, (_, p) => ({
      name: p === 0 ? user_name : `${FIRST[(i + p) % FIRST.length]} ${LAST[(i + p) % LAST.length]}`,
      email: p === 0 ? list.user_email : `guest${p}@example.com`,
    })),
    course_schedule: isCourse
      ? Array.from({ length: 8 }, (_, s) => ({
          date: sessionDate.add(s, "week").format("YYYY-MM-DD"),
          time: list.time,
        }))
      : [],
    booker_details: { full_name: user_name },
    user_timezone: "America/New_York",
    notes: i % 4 === 0 ? "Prefers a quieter corner of the studio." : "",
    original_session_details: list.is_rescheduled
      ? { date: sessionDate.subtract(2, "day").format("YYYY-MM-DD"), time: "11:00:00" }
      : null,
    cancelled_at: status === "cancelled" ? bookedOn.add(1, "day").toISOString() : null,
    payment_info: {
      status: refunded ? "refunded" : "succeeded",
      amount,
      currency: "CAD",
      card_brand: ["visa", "mastercard", "amex"][i % 3],
      card_last4: String(1000 + (i % 9000)).slice(-4),
      payment_method_type: "card",
      receipt_url: "https://example.com/receipt",
      refunded_amount: refunded ? amount : 0,
    },
  };

  return { list, detail };
}

const BUILT = Array.from({ length: 40 }, (_, i) => buildRow(i));

export const BOOKING_LIST = BUILT.map((b) => b.list);
export const BOOKING_DETAILS = Object.fromEntries(BUILT.map((b) => [b.list.id, b.detail]));

function sortRows(rows, ordering) {
  if (!ordering) return rows;
  const desc = String(ordering).startsWith("-");
  const field = desc ? String(ordering).slice(1) : String(ordering);
  const mapped = {
    user_facing_reference: "user_facing_reference",
    user_name: "user_name",
    enrollment_type: "enrollment_type",
    participants: "participants",
    status: "status",
    booking_date: "booking_date",
    schedule_instance__date: "date",
    "schedule_instance__schedule__option__classId__title": "class_name",
  };
  const key = mapped[field] || field;
  const copy = [...rows];
  copy.sort((a, b) => {
    const av = a[key] ?? "";
    const bv = b[key] ?? "";
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
  return copy;
}

export function queryBookingFixtures({
  status,
  search,
  start_date,
  end_date,
  ordering,
  page = 1,
  page_size = 10,
} = {}) {
  let allowed = String(status || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.includes("cancelled") && !allowed.includes("forfeited")) {
    allowed = [...allowed, "forfeited"];
  }
  let rows = BOOKING_LIST.filter((r) => (allowed.length ? allowed.includes(r.status) : true));
  if (search) {
    const q = String(search).toLowerCase();
    rows = rows.filter((r) =>
      [r.user_name, r.user_email, r.class_name, r.user_facing_reference]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  if (start_date) rows = rows.filter((r) => r.date >= start_date);
  if (end_date) rows = rows.filter((r) => r.date <= end_date);
  rows = sortRows(rows, ordering);

  const spots = (list) => list.reduce((n, r) => n + (Number(r.participants) || 0), 0);
  const summary = {
    total_participant_spots_in_filter: spots(rows.filter((r) => r.status === "confirmed")),
    completed_participant_spots_in_filter: spots(rows.filter((r) => r.status === "completed")),
    cancelled_participant_spots_in_filter: spots(rows.filter((r) => r.status === "cancelled" || r.status === "forfeited")),
  };

  const start = (Math.max(1, page) - 1) * page_size;
  const results = rows.slice(start, start + page_size);
  return {
    count: rows.length,
    next: start + page_size < rows.length ? "next" : null,
    previous: start > 0 ? "prev" : null,
    results,
    summary,
  };
}

export function getFixtureBookingDetail(id) {
  return BOOKING_DETAILS[Number(id)] || null;
}

export function patchFixtureBooking(id, patch) {
  const n = Number(id);
  const list = BOOKING_LIST.find((r) => r.id === n);
  if (list) Object.assign(list, patch);
  const detail = BOOKING_DETAILS[n];
  if (detail) Object.assign(detail, patch);
  return detail || list || null;
}

export function fetchFixtureBookings(params) {
  return { success: true, data: queryBookingFixtures(params) };
}

export function loadFixtureBookingDetails(id) {
  const data = getFixtureBookingDetail(id);
  if (!data) return { success: false, error: "Booking not found" };
  return { success: true, data };
}
