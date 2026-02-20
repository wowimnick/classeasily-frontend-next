"use client";

import React, { useState, useMemo } from "react";
import { Tabs } from "antd";
import ActiveBookings from "./ActiveBookings";
import BookingHistory from "./BookingHistory";

const TAB_ACTIVE = "active";
const TAB_HISTORY = "history";

/**
 * Combined Bookings view: one tab for Active, one for History.
 * Use defaultActiveKey to open a specific tab (e.g. from URL).
 */
export default function BookingsCombined({ defaultActiveKey = TAB_ACTIVE }) {
  const [activeKey, setActiveKey] = useState(defaultActiveKey);

  const items = useMemo(
    () => [
      {
        key: TAB_ACTIVE,
        label: "Active Bookings",
        children: <ActiveBookings />,
      },
      {
        key: TAB_HISTORY,
        label: "Booking History",
        children: <BookingHistory />,
      },
    ],
    []
  );

  return (
    <Tabs
      activeKey={activeKey}
      onChange={setActiveKey}
      items={items}
      size="large"
      style={{ marginTop: -8 }}
    />
  );
}
