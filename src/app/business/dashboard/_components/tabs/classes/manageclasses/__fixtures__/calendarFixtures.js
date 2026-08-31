import dayjs from "dayjs";

const SERVICES = [
  "60-minute Yoga",
  "Reformers Pilates",
  "Private Coaching",
  "Sound Bath",
  "Strength Circuit",
];

const FIRST = [
  "Jane", "Marcus", "Priya", "Elena", "Noah", "Amara", "Chris", "Sofia",
  "Liam", "Hana", "Diego", "Aisha", "Owen", "Mei", "Theo", "Lucia",
];
const LAST = [
  "Doe", "Chen", "Patel", "Rossi", "Kim", "Nwosu", "Park", "Alvarez",
  "Okafor", "Berg", "Sato", "Khan", "Walsh", "Nguyen", "Silva", "Moreau",
];

export const DEMO_STAFF = [
  { id: 701, user_name: "Alex Rivera", status: "accepted" },
  { id: 702, user_name: "Jordan Blake", status: "accepted" },
  { id: 703, user_name: "Sam Okonkwo", status: "accepted" },
];

export const DEMO_CLASSES = SERVICES.map((title, i) => {
  const option = {
    optionId: 1001 + i,
    booking_type: i === 2 ? "Single Session" : i === 1 ? "Full Course" : "Single Session",
    title: i === 1 ? "8-week series" : "Standard",
  };
  return {
    classId: 100 + i,
    title,
    status: "active",
    options: [option],
    option,
  };
});

export const DEMO_BUSINESS_HOURS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
].map((day, i) => ({
  day,
  isOpen: i < 6,
  open: "08:00",
  close: "21:00",
  time: ["08:00", "21:00"],
}));

const TIMES = ["09:30:00", "12:00:00", "17:30:00", "19:00:00"];
const GROUPS = ["Morning block", "Peak evening", "Weekend intensive", ""];

function buildAll() {
  const instances = [];
  const roster = {};
  let id = 91000;
  const start = dayjs().subtract(21, "day");
  for (let d = 0; d < 50; d += 1) {
    const date = start.add(d, "day");
    const dow = date.day(); // 0 Sun
    if (dow === 0) continue;
    const slots = dow === 6 ? [0, 2] : dow === 3 ? [0, 1, 2] : [0, 2];
    slots.forEach((slot, si) => {
      const cls = DEMO_CLASSES[(d + si) % DEMO_CLASSES.length];
      const cap = [8, 12, 6, 10, 14][(d + si) % 5];
      const booked = Math.min(cap, 2 + ((d * 3 + si * 4) % cap));
      const staff = DEMO_STAFF[(d + si) % DEMO_STAFF.length];
      const group = GROUPS[(d + si) % GROUPS.length];
      const inst = {
        id,
        schedule: 8000 + cls.classId,
        date: date.format("YYYY-MM-DD"),
        time: TIMES[slot],
        duration: slot === 1 ? 45 : 60,
        price: [28, 45, 72, 95][(d + si) % 4],
        max_participants: cap,
        schedule_name: group,
        name: group,
        class_id: cls.classId,
        class_name: cls.title,
        assigned_staff_id: staff.id,
        recurrence_rule_id: group === "Peak evening" ? 501 : null,
        current_bookings_count: booked,
        status: "active",
      };
      instances.push(inst);
      roster[id] = Array.from({ length: booked }, (_, p) => {
        const fi = (d + si + p) % FIRST.length;
        return {
          id: 92000 + id * 10 + p,
          user_facing_reference: `CE-CAL${id}-${p + 1}`,
          user_name: `${FIRST[fi]} ${LAST[fi]}`,
          user_email: `${FIRST[fi].toLowerCase()}.${LAST[fi].toLowerCase()}@example.com`,
          class_name: cls.title,
          participants: 1,
          status: date.isBefore(dayjs(), "day") ? "completed" : "confirmed",
          attendance: date.isBefore(dayjs(), "day")
            ? (p % 7 === 0 ? "no_show" : "attended")
            : "pending",
        };
      });
      id += 1;
    });
  }
  return { instances, roster };
}

const BUILT = buildAll();

export function fetchFixtureClasses() {
  return { success: true, data: DEMO_CLASSES };
}

export function fetchFixtureStaff() {
  return { success: true, data: DEMO_STAFF };
}

export function fetchFixtureInstances({ classId, start_date, end_date, assigned_staff_id } = {}) {
  let rows = BUILT.instances.filter((s) => !classId || s.class_id === classId);
  if (start_date) rows = rows.filter((s) => s.date >= start_date);
  if (end_date) rows = rows.filter((s) => s.date <= end_date);
  if (assigned_staff_id && assigned_staff_id !== "all") {
    rows = rows.filter((s) => String(s.assigned_staff_id) === String(assigned_staff_id));
  }
  return { success: true, data: rows };
}

export function getFixtureRoster(instanceId) {
  return BUILT.roster[Number(instanceId)] || [];
}

export function fetchFixtureRoster(instanceId) {
  const rows = getFixtureRoster(instanceId);
  return { success: true, data: { results: rows, count: rows.length } };
}

export function fetchFixtureInstance(id) {
  const row = BUILT.instances.find((s) => s.id === Number(id));
  if (!row) return { success: false, error: "Session not found" };
  return {
    success: true,
    data: { ...row, booking_type: "Single Session" },
  };
}

export function patchFixtureRosterAttendance(instanceId, bookingId, attendance) {
  const rows = BUILT.roster[Number(instanceId)];
  if (!rows) return null;
  const row = rows.find((r) => r.id === Number(bookingId));
  if (row) row.attendance = attendance;
  return row;
}
