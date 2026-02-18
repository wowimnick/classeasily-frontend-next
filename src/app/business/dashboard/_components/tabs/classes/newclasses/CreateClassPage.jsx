"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { ConfigProvider } from "antd";
import ClassSteps from "./ClassSteps";
import BasicInfoStep from "./steps/BasicInfoStep";
import ClassOptionsStep from "./steps/ClassOptionsStep";
import LocationContactStep from "./steps/LocationContactStep";
import { useClass } from "./ClassContext";

// Theme configuration - matches booking flow (MobileReserveReviewDrawer, ClassCheckoutClient)
const theme = {
  token: {
    colorPrimary: "#222222",
    colorLink: "#222222",
    colorSuccess: "#00A699",
    colorWarning: "#FFB400",
    colorError: "#FF5A5F",
    colorInfo: "#007A87",
    borderRadius: 16,
    colorText: "#1f2937",
    colorTextSecondary: "#64748b",
    colorBorder: "#e2e8f0",
  },
  components: {
    Button: { borderRadius: 12, controlHeight: 44 },
    Select: { borderRadius: 12, controlHeight: 44 },
    Input: { borderRadius: 12, controlHeight: 44 },
    InputNumber: { borderRadius: 12, controlHeight: 44 },
    DatePicker: { borderRadius: 12, controlHeight: 44 },
    TimePicker: { borderRadius: 12, controlHeight: 44 },
  },
};

const FullScreenContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #fff;
`;

const StepsNav = styled.div`
  background: white;
  padding: 12px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const ProgressBar = styled.div`
  display: flex;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressSegment = styled.div`
  flex: 1;
  background: ${(props) => (props.$filled ? "#222222" : "transparent")};
  transition: background 0.2s ease;
`;

const StepsContainer = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
`;

export const steps = [
  {
    title: "The Experience",
    description: "Basics & Photos",
    component: BasicInfoStep,
  },
  {
    title: "Meeting Point",
    description: "Location & Contact",
    component: LocationContactStep,
  },
  {
    title: "Details",
    description: "Structure & Policies",
    component: ClassOptionsStep,
  },
];

const CreateClassPage = ({ onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);

  const { state } = useClass();
  const isStructureSelected = !!state.options?.[0]?.booking_type;

  const handleCreationSuccess = (newClass) => {
    if (onSuccess) {
      onSuccess(newClass);
    }
  };

  return (
    <ConfigProvider theme={theme}>
      <FullScreenContainer>
        <StepsNav>
          <ProgressBar>
            <ProgressSegment $filled={currentStep >= 0} />
            <ProgressSegment $filled={currentStep >= 1} />
            <ProgressSegment $filled={currentStep >= 2} />
          </ProgressBar>
        </StepsNav>

        <StepsContainer>
          <ClassSteps
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            direction={direction}
            setDirection={setDirection}
            loading={loading}
            setLoading={setLoading}
            steps={steps}
            isStructureSelected={isStructureSelected}
            onCreationSuccess={handleCreationSuccess}
          />
        </StepsContainer>
      </FullScreenContainer>
    </ConfigProvider>
  );
};

export default CreateClassPage;
