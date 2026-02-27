"use client";

import React from "react";
import styled from "styled-components";
import { LayoutDashboard } from "lucide-react";

const PageBreadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 13px;
  font-weight: 500;
  padding-bottom: 18px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 24px;
`;

const BreadcrumbSeparator = styled.span`
  color: #d1d5db;
`;

export default function DashboardBreadcrumb({ title }) {
  return (
    <PageBreadcrumb>
      <LayoutDashboard size={15} />
      <BreadcrumbSeparator>/</BreadcrumbSeparator>
      {title}
    </PageBreadcrumb>
  );
}
