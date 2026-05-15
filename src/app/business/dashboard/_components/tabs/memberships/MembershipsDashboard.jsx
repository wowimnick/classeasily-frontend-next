"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import { Tabs } from "antd";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";
import MembershipProducts from "./MembershipProducts";
import MembersTable from "./MembersTable";

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

const TAB_PRODUCTS = "products";
const TAB_MEMBERS = "members";

export default function MembershipsDashboard({ defaultActiveKey = TAB_PRODUCTS, initialMembershipProductId }) {
  const items = useMemo(
    () => [
      {
        key: TAB_PRODUCTS,
        label: "My Plans",
        children: <MembershipProducts noWrapperPadding />,
      },
      {
        key: TAB_MEMBERS,
        label: "Members",
        children: <MembersTable noWrapperPadding productId={initialMembershipProductId} />,
      },
    ],
    [initialMembershipProductId]
  );

  return (
    <TabWrapper>
      <DashboardBreadcrumb title="Memberships" />
      <Tabs
        activeKey={defaultActiveKey === "members" ? TAB_MEMBERS : TAB_PRODUCTS}
        items={items}
        tabBarStyle={{ display: "none" }}
        style={{ marginTop: 0 }}
      />
    </TabWrapper>
  );
}
