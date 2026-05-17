"use client";

import styled from "styled-components";
import { Button } from "antd";
import { adminColors as colors } from "./adminColors";

export const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }
`;

/** Same as ActionButtonsContainer but BookingsList uses 50% width on mobile */
export const ActionButtonsContainerWideMobile = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    width: 50%;
    flex-direction: row;
    justify-content: space-between;
  }
`;

export const RefreshButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 1px solid ${colors.border};
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

  &:hover {
    color: ${colors.primary};
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    flex: 1;
  }
`;

export const ExportButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;

  @media (max-width: 768px) {
    flex: 1;
  }
`;
