"use client";

import styled from "styled-components";
import { Card } from "antd";
import { Typography } from "antd";
import { adminColors as colors } from "./adminColors";

const { Text } = Typography;

export const MobileCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`;

export const MobileCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const MobileCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const MobileCardLabel = styled(Text)`
  font-size: 12px;
  color: ${colors.textSecondary};
  font-weight: 500;
`;

export const MobileCardFooter = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid ${colors.border};
`;
