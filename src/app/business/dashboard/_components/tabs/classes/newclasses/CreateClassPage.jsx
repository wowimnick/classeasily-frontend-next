"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { ConfigProvider, Steps, Typography } from "antd";
import { Sparkles, MapPin, Sliders } from "lucide-react"; // Changed icon
import ClassSteps from "./ClassSteps";
import BasicInfoStep from "./steps/BasicInfoStep";
import ClassOptionsStep from "./steps/ClassOptionsStep";
import LocationContactStep from "./steps/LocationContactStep";
import { useClass } from "./ClassContext";

// Theme configuration
const theme = {
  token: {
    colorPrimary: "#ff385c",
    colorLink: "#ff385c",
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
  padding: 16px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const MobileStepsIndicator = styled.div`
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: ${theme.token.colorTextSecondary};

  strong {
    color: ${theme.token.colorText};
  }
`;

const StepsContainer = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
`;

export const steps = [
  {
    icon: <Sparkles size={18} />,
    title: "The Experience",
    description: "Basics & Photos",
    component: BasicInfoStep,
  },
  {
    icon: <MapPin size={18} />,
    title: "Meeting Point",
    description: "Location & Contact",
    component: LocationContactStep,
  },
  {
    icon: <Sliders size={18} />,
    title: "Details",
    description: "Structure & Policies",
    component: ClassOptionsStep,
  },
];

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

const CreateClassPage = ({ onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

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
          {isMobile ? (
            <MobileStepsIndicator>
              Step {currentStep + 1} of {steps.length}:{" "}
              <strong>{steps[currentStep].title}</strong>
            </MobileStepsIndicator>
          ) : (
            <Steps
              current={currentStep}
              direction="horizontal"
              size="small"
              items={steps.map((step) => ({
                title: step.title,
                icon: step.icon,
              }))}
            />
          )}
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
