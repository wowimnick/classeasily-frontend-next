"use client";

import React, { useMemo } from "react";
import { Tabs } from "antd";
import ActiveBookings from "./ActiveBookings";
import BookingHistory from "./BookingHistory";

const TAB_ACTIVE = "active";
const TAB_HISTORY = "history";

/**
 * Combined Bookings view: Active and History selected via sidebar (Bookings → Active Bookings / Booking History).
 * defaultActiveKey comes from URL (e.g. bookings/active, bookings/history).
 */
export default function BookingsCombined({ defaultActiveKey = TAB_ACTIVE }) {
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
      activeKey={defaultActiveKey}
      items={items}
      tabBarStyle={{ display: "none" }}
      style={{ marginTop: 0 }}
    />
  );
}
