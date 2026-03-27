"use client";

import styled from "styled-components";
import { motion } from "framer-motion";
import { Button, Input, Select } from "antd";

/** Aligns membership tabs with Guests / Staff dashboard patterns */
export const membershipColors = {
  primary: "#ff385c",
  textSecondary: "#64748b",
  border: "#f1f5f9",
  theadBg: "#f8fafc",
};

export const MembershipDashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
  min-height: 100%;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const MembershipPageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

export const MembershipTitleBlock = styled.div`
  flex: 1;
  min-width: 0;
`;

export const MembershipPageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0 0 6px 0;
  line-height: 1.2;
  @media (max-width: 768px) {
    font-size: 22px;
  }
  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

export const MembershipPageSubtitle = styled.p`
  margin: 0;
  font-size: 15px;
  color: ${membershipColors.textSecondary};
  line-height: 1.45;
  max-width: 560px;
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

export const MembershipToolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
`;

export const MembershipTableSection = styled(motion.div)`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  @media (max-width: 768px) {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
`;

export const MembershipTableViewWrapper = styled.div`
  .ant-table {
    border-radius: 0;
    overflow: hidden;
    box-shadow: none;
  }

  .ant-table-thead > tr > th {
    background-color: ${membershipColors.theadBg} !important;
    color: #64748b;
    font-weight: 600;
    font-size: 11px;
    padding: 10px 14px;
    border-bottom: 1px solid #e2e8f0;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    &::before {
      display: none;
    }
  }

  .ant-table-tbody > tr > td {
    vertical-align: middle;
    padding: 12px 14px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
    color: #1e293b;
  }

  @media (max-width: 768px) {
    .ant-table-thead > tr > th {
      padding: 8px 12px;
      font-size: 10px;
    }
    .ant-table-tbody > tr > td {
      padding: 10px 12px;
      font-size: 12px;
    }
  }

  .ant-table-tbody > tr:last-child > td {
    border-bottom: none;
  }

  .ant-table-tbody > tr:hover > td {
    background-color: #f8fafc;
  }

  .ant-table-tbody > tr.ant-table-placeholder:hover > td {
    background: #fff;
  }

  .ant-pagination {
    margin: 20px 16px 16px;
  }

  .ant-table-column-sorter {
    color: #94a3b8;
  }
`;

export const MembershipFiltersBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 16px 16px 20px;
  margin-bottom: 4px;
  border-bottom: 1px solid ${membershipColors.border};
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    padding: 12px 12px 18px;
  }
`;

/** Space between filter bar and table / card list */
export const MembershipTableContentArea = styled.div`
  margin-top: 12px;
  padding-top: 4px;
`;

export const MembershipSearchInput = styled(Input)`
  width: 260px;
  &.ant-input-affix-wrapper {
    height: 40px !important;
    border-radius: 12px !important;
    padding: 0 12px !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    align-items: center;
  }
  &.ant-input-affix-wrapper .ant-input {
    height: auto !important;
    min-height: 0 !important;
    line-height: 1.4 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  .ant-input-prefix {
    color: #9ca3af;
    margin-right: 8px;
  }
  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const MembershipFilterSelect = styled(Select)`
  min-width: 160px !important;
  .ant-select-selector {
    height: 40px !important;
    border-radius: 12px !important;
    border: 1px solid #e5e7eb !important;
    padding: 0 12px !important;
    display: flex;
    align-items: center;
    background: white !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    .ant-select-selection-item {
      line-height: 38px !important;
    }
  }
  &:hover .ant-select-selector {
    border-color: ${membershipColors.primary} !important;
  }
  &.ant-select-focused .ant-select-selector {
    border-color: ${membershipColors.primary} !important;
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1) !important;
  }
  @media (max-width: 768px) {
    width: 100% !important;
    min-width: 0 !important;
  }
`;

export const MembershipToolbarButton = styled(Button)`
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px !important;
  border-radius: 12px !important;
  border: 1px solid #e5e7eb !important;
  background: white !important;
  font-weight: 500;
  color: #334155 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  &:hover {
    color: ${membershipColors.primary} !important;
    border-color: ${membershipColors.primary} !important;
  }
`;

export const MembershipPrimaryButton = styled(Button)`
  height: 40px !important;
  padding: 0 16px !important;
  border-radius: 12px !important;
  font-weight: 600;
  display: inline-flex !important;
  align-items: center;
  gap: 8px;
`;
