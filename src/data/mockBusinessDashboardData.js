/**
 * Mock data for business dashboard when logged in as npopelnukh@gmail.com.
 * Represents a realistic activity/experience business with classes, bookings, and revenue.
 */

import dayjs from "dayjs";

const MOCK_EMAIL = "npopelnukh@gmail.com";

export const isMockDashboardUser = (user) =>
  user?.email?.toLowerCase() === MOCK_EMAIL;

// --- Overview ---
export function getMockOverviewData() {
  const now = dayjs();
  const revenueTrend = [];
  // Fairly flat trend: same base with small random variation (~±8%)
  const baseRevenue = 4700;
  for (let i = 11; i >= 0; i--) {
    const d = now.subtract(i, "month");
    const variation = (Math.random() - 0.5) * 2 * 400;
    const gross = Math.round(baseRevenue + variation);
    revenueTrend.push({
      date: d.format("YYYY-MM-DD"),
      gross_revenue: Math.max(0, gross),
      revenue: Math.max(0, gross),
    });
  }

  return {
    metrics: {
      total_students: { value: 247, label: "Total Students", change: 2.4 },
      active_classes: { value: 12, label: "Active Experiences" },
      monthly_revenue: { value: 18420, label: "Gross Revenue (Month)", change: 1.8 },
      average_rating: { value: 4.8, label: "Average Rating" },
    },
    revenue_trend: revenueTrend,
    today_snapshot: {
      today_classes_running: 4,
      today_total_bookings: 9,
      today_total_participants: 23,
    },
    actionable_prompts: {
      classes_needing_schedules_count: 0,
    },
    upcoming_instances: [
      {
        schedule_instance_id: "mock-1",
        name: "Morning Yoga — 9:00 AM",
        date: now.add(1, "day").format("YYYY-MM-DD"),
        time: "09:00",
        option: "mock-opt-1",
        option_title: "Drop-in Session",
        booking_type: "Single Session",
        total_spots: 20,
        booked_spots: 14,
      },
      {
        schedule_instance_id: "mock-2",
        name: "Pottery Workshop — 2:00 PM",
        date: now.add(1, "day").format("YYYY-MM-DD"),
        time: "14:00",
        option: "mock-opt-2",
        option_title: "Single Session",
        booking_type: "Single Session",
        total_spots: 10,
        booked_spots: 8,
      },
      {
        schedule_instance_id: "mock-3",
        name: "Cooking Class — 6:00 PM",
        date: now.add(2, "day").format("YYYY-MM-DD"),
        time: "18:00",
        option: "mock-opt-3",
        option_title: "Evening Class",
        booking_type: "Single Session",
        total_spots: 12,
        booked_spots: 11,
      },
    ],
    setup_progress: { completed: true },
  };
}

// --- Bookings (active + history) ---
const MOCK_GUESTS = [
  { name: "Sarah Mitchell", email: "sarah.m@example.com" },
  { name: "James Chen", email: "james.chen@example.com" },
  { name: "Emma Wilson", email: "emma.w@example.com" },
  { name: "Michael Brown", email: "mbrown@example.com" },
  { name: "Olivia Davis", email: "olivia.d@example.com" },
  { name: "Daniel Martinez", email: "dan.martinez@example.com" },
  { name: "Sophie Anderson", email: "sophie.a@example.com" },
  { name: "Ryan Taylor", email: "rtaylor@example.com" },
  { name: "Isabella Lee", email: "isabella.lee@example.com" },
  { name: "William Clark", email: "wclark@example.com" },
];

const MOCK_EXPERIENCES = [
  { title: "Morning Yoga", option: "Drop-in Session" },
  { title: "Pottery Workshop", option: "Single Session" },
  { title: "Cooking Class", option: "Evening Class" },
  { title: "Photography Walk", option: "2-Hour Tour" },
  { title: "Wine Tasting", option: "Standard Tasting" },
];

function buildMockBooking(overrides = {}) {
  const guest = MOCK_GUESTS[Math.floor(Math.random() * MOCK_GUESTS.length)];
  const exp = MOCK_EXPERIENCES[Math.floor(Math.random() * MOCK_EXPERIENCES.length)];
  const id = overrides.id ?? `mock-b-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const ref = `CE-${String(Math.floor(100000 + Math.random() * 900000))}`;
  const date = overrides.date ?? dayjs().add(Math.floor(Math.random() * 14), "day").format("YYYY-MM-DD");
  const participants = overrides.participants ?? 1 + Math.floor(Math.random() * 3);
  return {
    id,
    user_facing_reference: ref,
    user_name: guest.name,
    user_email: guest.email,
    class_name: exp.title,
    schedule_instance__schedule__option__classId__title: exp.title,
    option_name: exp.option,
    enrollment_type: Math.random() > 0.3 ? "Single Session" : "Full Course",
    session_info: Math.random() > 0.3 ? null : { current_session: 2, total_sessions: 6 },
    date,
    schedule_instance__date: date,
    time: ["09:00", "10:30", "14:00", "18:00"][Math.floor(Math.random() * 4)],
    participants,
    status: overrides.status ?? "confirmed",
    booking_date: dayjs().subtract(Math.floor(Math.random() * 5), "day").format("YYYY-MM-DD"),
    ...overrides,
  };
}

export function getMockBookingsResponse(params = {}) {
  const { status, page = 1, page_size = 10 } = params;
  const statuses = status === "confirmed" ? ["confirmed"] : ["completed", "cancelled"];
  const count = status === "confirmed" ? 24 : 156;
  const results = [];
  const start = (page - 1) * page_size;
  const pageCount = Math.min(page_size, Math.max(0, count - start));
  for (let i = 0; i < pageCount; i++) {
    const s = statuses[(start + i) % statuses.length];
    results.push(
      buildMockBooking({
        status: s,
        date: s === "confirmed"
          ? dayjs().add(1 + ((start + i) % 14), "day").format("YYYY-MM-DD")
          : dayjs().subtract(1 + ((start + i) % 30), "day").format("YYYY-MM-DD"),
        id: `mock-${String(status).slice(0, 8)}-${page}-${i}`,
      })
    );
  }
  const totalParticipantSpots = results.reduce((acc, b) => acc + (b.participants || 0), 0);
  return {
    count,
    results,
    summary: {
      total_participant_spots_in_filter: status === "confirmed" ? totalParticipantSpots : undefined,
    },
  };
}

// --- Revenue analytics ---
export function getMockRevenueAnalytics(params = {}) {
  const { startDate, endDate } = params;
  const start = dayjs(startDate || dayjs().subtract(29, "days"));
  const end = dayjs(endDate || dayjs());
  const days = Math.max(1, end.diff(start, "day") + 1);
  const revenue_trends = [];
  for (let i = 0; i < Math.min(days, 31); i++) {
    const d = start.add(i, "day");
    const gross = 400 + Math.floor(Math.random() * 800) + (i % 7 === 0 ? 200 : 0);
    const fees = Math.round(gross * 0.08);
    revenue_trends.push({
      date: d.format("YYYY-MM-DD"),
      gross_revenue: gross,
      net_revenue: gross - fees,
      platform_fees: fees,
    });
  }

  const classRevenue = [
    { name: "Morning Yoga", widget_revenue: 4200, platform_revenue: 336 },
    { name: "Pottery Workshop", widget_revenue: 3800, platform_revenue: 304 },
    { name: "Cooking Class", widget_revenue: 3100, platform_revenue: 248 },
    { name: "Photography Walk", widget_revenue: 2800, platform_revenue: 224 },
    { name: "Wine Tasting", widget_revenue: 2500, platform_revenue: 200 },
  ];

  const totalGross = revenue_trends.reduce((a, d) => a + d.gross_revenue, 0);
  const totalFees = revenue_trends.reduce((a, d) => a + d.platform_fees, 0);
  const prevPeriodGross = totalGross * 0.92;
  const revenueGrowth = ((totalGross - prevPeriodGross) / prevPeriodGross) * 100;
  const bookerCount = 48;
  const spotCount = 120;

  return {
    metrics: {
      total_gross_revenue: Math.round(totalGross),
      estimated_platform_fees: Math.round(totalFees),
      estimated_net_revenue: Math.round(totalGross - totalFees),
      average_order_value: totalGross / Math.max(1, revenue_trends.length),
      revenue_per_booker: totalGross / Math.max(1, bookerCount),
      revenue_growth: Math.round(revenueGrowth * 10) / 10,
      revenue_per_spot: totalGross / Math.max(1, spotCount),
      recurring_revenue: 0,
    },
    revenue_trends,
    class_revenue: classRevenue,
    revenue_by_booking_type: [
      { name: "Single Session", value: 11200 },
      { name: "Full Course", value: 5200 },
    ],
  };
}
