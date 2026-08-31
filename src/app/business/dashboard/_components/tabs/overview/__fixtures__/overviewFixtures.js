import dayjs from "dayjs";
import { BOOKING_LIST, BOOKING_DETAILS } from "../../bookings/__fixtures__/bookingFixtures";
import { fetchFixtureInstances } from "../../classes/manageclasses/__fixtures__/calendarFixtures";

const SERVICES = [
  "60-minute Yoga",
  "Reformers Pilates",
  "Private Coaching",
  "Sound Bath",
  "Strength Circuit",
];

function round(n, d = 2) {
  const m = 10 ** d;
  return Math.round(n * m) / m;
}

function dailyPoints(days, seedFn) {
  return Array.from({ length: days }, (_, i) => {
    const date = dayjs().subtract(days - 1 - i, "day");
    return { date: date.format("YYYY-MM-DD"), value: seedFn(i, date) };
  });
}

function weeklyPoints(weeks, seedFn) {
  return Array.from({ length: weeks }, (_, i) => {
    const date = dayjs().subtract(weeks - 1 - i, "week").startOf("week");
    return { date: date.format("YYYY-MM-DD"), value: seedFn(i, date) };
  });
}

export function getOverviewFixtures() {
  const bookingsDaily = dailyPoints(30, (i) => 3 + ((i * 7) % 9) + (i > 20 ? 2 : 0));
  const newClientsWeekly = weeklyPoints(12, (i) => 4 + ((i * 3) % 6));
  const noShowWeekly = weeklyPoints(12, (i) => round(4 + ((i * 5) % 7) * 0.6, 1));
  const occupancyWeekly = weeklyPoints(12, (i) => round(58 + ((i * 11) % 18), 1));

  const heat = [];
  for (let weekday = 0; weekday < 7; weekday += 1) {
    for (const hour of [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) {
      const weekend = weekday >= 5;
      const peak = (hour >= 9 && hour <= 11) || (hour >= 17 && hour <= 19);
      let count = 0;
      if (peak) count = weekend ? 2 + (hour % 3) : 6 + ((weekday + hour) % 5);
      else if (hour >= 12 && hour <= 16) count = weekend ? 1 : 2 + (weekday % 3);
      else if (!weekend) count = hour === 8 || hour === 20 ? 1 : 0;
      if (count > 0) heat.push({ weekday, hour, count });
    }
  }

  const revenueTrend = dailyPoints(30, (i) => 80 + ((i * 37) % 140) + (i % 6 === 0 ? 90 : 0)).map((p, i) => {
    const gross = p.value + (i > 22 ? 40 : 0);
    const fees = round(gross * 0.12, 2);
    return {
      date: p.date,
      gross_revenue: round(gross, 2),
      platform_fees: fees,
      net_revenue: round(gross - fees, 2),
    };
  });

  const monthGross = revenueTrend.reduce((n, r) => n + r.gross_revenue, 0);
  const bookings30 = bookingsDaily.reduce((n, p) => n + p.value, 0);

  const upcoming_classes = fetchFixtureInstances({
    start_date: dayjs().format("YYYY-MM-DD"),
    end_date: dayjs().add(6, "day").format("YYYY-MM-DD"),
  }).data.map((s) => ({
    schedule_instance_id: s.id,
    class_id: s.class_id,
    name: s.class_name,
    time: s.time,
    date: s.date,
    current_occupancy: s.current_bookings_count,
    max_occupancy: s.max_participants,
    booking_type: "Single Session",
  }));

  const popular_classes = SERVICES.map((name, i) => ({
    name,
    class_id: 100 + i,
    enrollment: 42 - i * 6 - (i === 4 ? 4 : 0),
  }));

  const paidBookings = BOOKING_LIST.filter((b) => b.status !== "forfeited").slice(0, 12);
  const recent_transactions = paidBookings.map((b, i) => {
    const detail = BOOKING_DETAILS[b.id];
    const refund = b.status === "cancelled";
    const amount = Number(detail?.amount_paid) || 60;
    return {
      id: 80000 + i,
      booking_id: b.id,
      user_facing_reference: b.user_facing_reference,
      client_name: b.user_name,
      service_name: b.class_name,
      amount,
      net_payout_amount: round(amount * 0.88, 2),
      currency: "CAD",
      card_brand: detail?.payment_info?.card_brand || "visa",
      card_last4: detail?.payment_info?.card_last4 || "4242",
      status: refund ? "refunded" : "succeeded",
      kind: refund ? "refund" : "payment",
      created_at: dayjs().subtract(i * 7 + 3, "hour").toISOString(),
    };
  });

  return {
    metrics: {
      total_students: { value: 186, change: 8.4 },
      active_classes: { value: 5, change: 1 },
      monthly_revenue: { value: round(monthGross, 2), change: 12.6 },
      gross_total_revenue: { value: round(monthGross * 4.2, 2), change: 9.1 },
      repeat_client_rate: { value: 46.2, change: 3.1 },
      no_show_rate: { value: 6.8, change: -1.4 },
      upcoming_capacity_fill: { value: 71.5, change: 4.8 },
    },
    revenue_trend: revenueTrend,
    upcoming_classes,
    popular_classes,
    recent_activity: recent_transactions.slice(0, 5).map((tx) => ({
      message: tx.kind === "refund" ? `Refund issued: $${tx.amount.toFixed(2)}` : `Payment received: $${tx.amount.toFixed(2)}`,
      icon: tx.kind === "refund" ? "undo" : "dollar",
      color: tx.kind === "refund" ? "#ef4444" : "#10b981",
      timestamp: tx.created_at,
    })),
    today_snapshot: {
      sessions: upcoming_classes.filter((c) => c.date === dayjs().format("YYYY-MM-DD")).length,
      booked: 11,
      capacity: 16,
    },
    actionable_prompts: { classes_needing_schedules_count: 0 },
    setup_progress: {
      is_stripe_connected: true,
      is_profile_complete: true,
      has_created_class: true,
      has_class_options: true,
      has_schedules: true,
      widget_setup: { has_widget_domains: true, has_widget_embed_verified: true },
    },
    series: {
      bookings_daily: bookingsDaily,
      new_clients_weekly: newClientsWeekly,
      no_show_weekly: noShowWeekly,
      occupancy_weekly: occupancyWeekly,
      bookings_by_weekday_hour: heat,
    },
    recent_transactions,
  };
}

export function fetchOverviewFixtures() {
  return { success: true, data: getOverviewFixtures() };
}
