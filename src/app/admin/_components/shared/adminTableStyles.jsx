"use client";

import styled from "styled-components";
import { Typography } from "antd";
import { adminColors as colors } from "./adminColors";

const { Title, Paragraph } = Typography;

export const DashboardWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 12px;
  min-height: 100%;
  @media (max-width: 768px) {
    padding: 8px;
  }
`;

export const TableSection = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
  border: 1px solid ${colors.border};
`;

export const TableHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${colors.border};
  background: white;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const TableTitle = styled(Title).attrs({ level: 4 })`
  margin: 0 0 4px 0 !important;
  color: ${colors.textPrimary};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: ${colors.primary};
    width: 18px;
    height: 18px;
  }

  @media (max-width: 768px) {
    font-size: 16px !important;
  }
`;

export const TableDescription = styled(Paragraph)`
  margin: 0 !important;
  color: ${colors.textSecondary};
  font-size: 14px;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

export const FilterBar = styled.div`
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  border-bottom: 1px solid ${colors.border};

  @media (max-width: 768px) {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
  }
`;

export const SearchFilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }
`;

/** PaymentManagement-style filter row (inputs flow left, no space-between) */
export const FilterBarFlexStart = styled.div`
  padding: 20px 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid ${colors.border};

  @media (max-width: 768px) {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
  }
`;

export const TableScrollContainer = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
`;
