"use client";

import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

import BusinessInfoStep from "./steps/BusinessInfoStep";
import ContactDetailsStep from "./steps/ContactDetailsStep";
import LocationStep from "./steps/LocationStep";
import ClassTypesStep from "./steps/ClassTypesStep";

// --- Styled Components ---
const ContentWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 0.5rem; /* Minimized padding on mobile */
  }
`;

const FormContainer = styled(motion.div)`
  width: 100%;
  max-width: 800px;
  background: ${(props) => props.theme.token.colorBgContainer};
  padding: 2rem 3rem;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem; /* Tighter padding on mobile */
    max-width: 100%;
    background: transparent; /* Remove card background on mobile for cleaner look */
  }
`;
// --- End Styled Components ---

const RegistrationSteps = ({
  currentStep,
  initialDataForStep,
  onFormSubmit,
  onFormSubmitFailed,
}) => {
  const renderStep = () => {
    const commonProps = {
      onSubmit: onFormSubmit,
      initialData: initialDataForStep,
      onFormSubmitFailed: (errorInfo) =>
        onFormSubmitFailed(errorInfo, currentStep),
    };

    switch (currentStep) {
      case 0:
        return <BusinessInfoStep {...commonProps} />;
      case 1:
        return <ContactDetailsStep {...commonProps} />;
      case 2:
        return <LocationStep {...commonProps} />;
      case 3:
        return <ClassTypesStep {...commonProps} />;
      default:
        console.warn(
          `renderStep called with invalid step index: ${currentStep}`
        );
        return null;
    }
  };

  return (
    <ContentWrapper>
      <FormContainer
        key={currentStep}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {renderStep()}
      </FormContainer>
    </ContentWrapper>
  );
};

export default RegistrationSteps;