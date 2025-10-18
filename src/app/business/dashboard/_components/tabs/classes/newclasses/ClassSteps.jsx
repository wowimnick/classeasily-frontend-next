"use client";

import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { message, Button } from "antd";
import { ArrowLeft, ArrowRight, Loader } from "lucide-react";
import { useClass } from "./ClassContext";
import { businessClassService, uploadService } from "@/services/apiService";

const StepsLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const ContentContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const ScrollContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
  @media (max-width: 480px) {
    padding: 1rem 1rem;
  }
`;

const FormContainer = styled(motion.div)`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const NavigationFooter = styled.footer`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid #ebebeb;
  background: white;
  z-index: 2;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
  }
`;

const FooterButton = styled(Button)`
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.5rem !important;
  font-weight: 500 !important;
  min-width: 120px;

  @media (max-width: 480px) {
    min-width: 100px;
    font-size: 14px !important;
  }
`;

const LoadingSpinner = styled(Loader)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const getErrorMessage = (error) => {
  if (error?.response?.data) {
    const data = error.response.data;
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    if (typeof data === "object" && data !== null) {
      const messages = Object.entries(data).map(([key, value]) => {
        const formattedKey = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        return `${formattedKey}: ${
          Array.isArray(value) ? value.join(", ") : value
        }`;
      });
      if (messages.length > 0) return messages.join("; ");
    }
  }
  if (typeof error?.error === "string") return error.error;
  if (typeof error?.detail === "string") return error.detail;
  if (error?.message) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred. Please try again.";
};

const ClassSteps = ({
  currentStep,
  setCurrentStep,
  direction,
  setDirection,
  loading,
  setLoading,
  steps,
  onCreationSuccess,
}) => {
  const { state, resetForm } = useClass();

  const handleNextStep = async () => {
    if (currentStep === steps.length - 1) {
      setLoading(true);
      const uploadKey = "imageUpload";
      message.loading({
        content: "Uploading images...",
        key: uploadKey,
        duration: 0,
      });

      try {
        const imageFiles = state.basicInfo.images
          .map((img) => img.file)
          .filter(Boolean);
        const uploadPromises = imageFiles.map((file) =>
          uploadService.uploadFile(file, "class_image")
        );
        const uploadResults = await Promise.all(uploadPromises);

        const failedUploads = uploadResults.filter((res) => !res.success);
        if (failedUploads.length > 0) {
          throw new Error(
            `Failed to upload ${failedUploads.length} image(s). ${failedUploads[0].error}`
          );
        }

        const imageS3Keys = uploadResults.map((res) => res.s3_key);
        const coverImage =
          state.basicInfo.images.find((img) => img.isCover) ||
          state.basicInfo.images[0];
        const coverImageIndex = state.basicInfo.images.findIndex(
          (img) => img.id === coverImage.id
        );
        const coverImageS3Key = imageS3Keys[coverImageIndex];

        message.loading({
          content: "Finalizing class creation...",
          key: uploadKey,
          duration: 2,
        });

        const currentOptionState = state.options?.[0] || {};

        console.log("--- DEBUG: PREPARING FINAL PAYLOAD ---");
        console.log(
          "Full state from context at time of submission:",
          JSON.stringify(state, null, 2)
        );
        console.log(
          "Extracted currentOptionState:",
          JSON.stringify(currentOptionState, null, 2)
        );

        const finalPayload = {
          // Basic Info
          title: state.basicInfo.title,
          description: state.basicInfo.description,
          category_key: state.basicInfo.category,
          subcategory_key: state.basicInfo.subcategory,
          features: state.basicInfo.features || [],

          // Location & Contact
          location: state.locationContact.location,
          unit_number: state.locationContact.unit_number,
          coordinates: state.locationContact.coordinates,
          saltLocation: state.locationContact.saltLocation,
          studentContactEmail: state.locationContact.studentContactEmail,
          studentContactPhone: state.locationContact.studentContactPhone,
          city: state.locationContact.city,
          state: state.locationContact.state,
          zipCode: state.locationContact.zipCode,
          country: state.locationContact.country,

          // Images
          image_s3_keys: imageS3Keys,
          cover_image_s3_key: coverImageS3Key,

          // Options (JSON stringified) with original logic
          options: JSON.stringify([
            {
              booking_type: currentOptionState.booking_type || "Single Session",
              level: currentOptionState.level || "all",
              equipment: currentOptionState.equipment || [],
              tags: currentOptionState.tags || [],
              cancellationPolicy:
                currentOptionState.cancellationPolicy || "flexible",
              cancellationCustomHours:
                currentOptionState.cancellationCustomHours,
              cancellationRefundPercentage:
                currentOptionState.cancellationRefundPercentage ?? 100,
              price_type: currentOptionState.price_type || "per_session",
            },
          ]),
        };

        console.log(
          "Final payload being sent to backend:",
          JSON.stringify(finalPayload, null, 2)
        );
        console.log("--------------------------------------");

        const response = await businessClassService.createClass(finalPayload);

        if (response?.success) {
          onCreationSuccess(response.data);
          resetForm();
        } else {
          throw new Error(
            getErrorMessage(response) || "Failed to create class."
          );
        }
      } catch (error) {
        console.error("Error creating class:", error);
        message.error({
          content: getErrorMessage(error),
          key: uploadKey,
          duration: 5,
        });
      } finally {
        setLoading(false);
      }
    } else {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    const StepComponent = steps[currentStep].component;
    return <StepComponent onValidatedNext={handleNextStep} />;
  };

  return (
    <StepsLayout>
      <ContentContainer>
        <ScrollContainer>
          <FormContainer
            key={currentStep}
            initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderStep()}
          </FormContainer>
        </ScrollContainer>
      </ContentContainer>

      <NavigationFooter>
        <FooterButton
          type="default"
          size="middle"
          onClick={handleBack}
          disabled={loading || currentStep === 0}
          icon={<ArrowLeft size={16} />}
        >
          Previous
        </FooterButton>

        <FooterButton
          type="primary"
          size="middle"
          form={`step-${currentStep}-form`}
          htmlType="submit"
          disabled={loading}
        >
          {currentStep === steps.length - 1
            ? loading
              ? "Creating..."
              : "Create Class"
            : "Next"}
          {loading ? (
            <LoadingSpinner size={16} />
          ) : (
            currentStep < steps.length - 1 && <ArrowRight size={16} />
          )}
        </FooterButton>
      </NavigationFooter>
    </StepsLayout>
  );
};

export default ClassSteps;
