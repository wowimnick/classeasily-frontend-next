"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import { Tabs } from "antd";
import ActiveBookings from "./ActiveBookings";
import BookingHistory from "./BookingHistory";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";

const TAB_ACTIVE = "active";
const TAB_HISTORY = "history";

const TabWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
  min-height: 100vh;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

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
        children: <ActiveBookings noWrapperPadding />,
      },
      {
        key: TAB_HISTORY,
        label: "Booking History",
        children: <BookingHistory noWrapperPadding />,
      },
    ],
    []
  );

  return (
    <TabWrapper>
      <DashboardBreadcrumb title="Bookings" />
      <Tabs
        activeKey={defaultActiveKey}
        items={items}
        tabBarStyle={{ display: "none" }}
        style={{ marginTop: 0 }}
      />
    </TabWrapper>
  );
}
