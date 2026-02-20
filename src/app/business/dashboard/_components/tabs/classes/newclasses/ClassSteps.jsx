"use client";

import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Button, Tooltip } from "antd";
import message from "@/lib/message";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
  border-top: 1px solid #e5e7eb;
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
  isStructureSelected,
  onCreationSuccess,
}) => {
  const { state, resetForm } = useClass();
  const isFinalStep = currentStep === steps.length - 1;

  const handleNextStep = async () => {
    if (isFinalStep) {
      setLoading(true);
      const uploadKey = "imageUpload";
      message.loading({
        content: "Uploading photos...",
        key: uploadKey,
        duration: 0,
      });

      try {
        const imageFiles = state.basicInfo.images
          .map((img) => img.file)
          .filter(Boolean);
        const uploadPromises = imageFiles.map((file) =>
          uploadService.uploadFile(file, "class_image"),
        );
        const uploadResults = await Promise.all(uploadPromises);

        const failedUploads = uploadResults.filter((res) => !res.success);
        if (failedUploads.length > 0) {
          throw new Error(
            `Failed to upload ${failedUploads.length} image(s). ${failedUploads[0].error}`,
          );
        }

        const imageS3Keys = uploadResults.map((res) => res.s3_key);
        const coverImage =
          state.basicInfo.images.find((img) => img.isCover) ||
          state.basicInfo.images[0];
        const coverImageIndex = state.basicInfo.images.findIndex(
          (img) => img.id === coverImage.id,
        );
        const coverImageS3Key = imageS3Keys[coverImageIndex];

        message.loading({
          content: "Creating experience...",
          key: uploadKey,
          duration: 2,
        });

        // MULTI-TIER UPDATE: Map all options in state
        const optionsPayload = state.options.map((opt, index) => {
          const isCourse = opt.booking_type === "Full Course";
          const isPrimary = index === 0;

          return {
            // Identity (null for creation)
            optionId: null,

            // Metadata
            title:
              opt.title ||
              (isPrimary ? "General Admission" : "Option " + (index + 1)),
            description: opt.description || "",

            // Tier Logic
            schedule_mode: isPrimary
              ? "primary"
              : opt.schedule_mode || "synced",

            // Config
            booking_type: opt.booking_type || "Single Session",
            level: opt.level || "all",
            equipment:
              typeof opt.equipment === "string"
                ? opt.equipment
                : Array.isArray(opt.equipment)
                  ? opt.equipment.join("\n")
                  : "",
            tags: opt.tags || [],
            price_type: isCourse ? "full_course" : "per_session",

            // Cancellation
            cancellationPolicy: opt.cancellationPolicy || "flexible",
            cancellationCustomHours: opt.cancellationCustomHours,
            cancellationRefundPercentage:
              opt.cancellationRefundPercentage ?? 100,

            // Mid-Course Logic (only send if course)
            allowMidCourseDrops: isCourse
              ? (opt.allowMidCourseDrops ?? false)
              : false,
            midCourseCancellationPolicy: isCourse
              ? opt.midCourseCancellationPolicy
              : null,
            midCourseCancellationCustomHours: isCourse
              ? opt.midCourseCancellationCustomHours
              : null,
            midCourseCancellationRefundPercentage: isCourse
              ? opt.midCourseCancellationRefundPercentage
              : null,
          };
        });

        const finalPayload = {
          // Basic Info
          title: state.basicInfo.title,
          description: state.basicInfo.description,
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

          // Options (JSON stringified ARRAY)
          options: JSON.stringify(optionsPayload),
        };

        const response = await businessClassService.createClass(finalPayload);

        if (response?.success) {
          onCreationSuccess(response.data);
          resetForm();
        } else {
          throw new Error(
            getErrorMessage(response) || "Failed to create experience.",
          );
        }
      } catch (error) {
        console.error("Error creating experience:", error);
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

  const finalButtonIsDisabled =
    loading || (isFinalStep && !isStructureSelected);

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

        <Tooltip
          title={
            isFinalStep && !isStructureSelected
              ? "Please select an experience structure (One-Time or Series)."
              : ""
          }
        >
          <span>
            <FooterButton
              type="primary"
              size="middle"
              form={`step-${currentStep}-form`}
              htmlType="submit"
              disabled={finalButtonIsDisabled}
              loading={loading}
              key={`btn-${loading}`}
            >
              {isFinalStep ? "Create Experience" : "Next"}
              {!isFinalStep && !loading && <ArrowRight size={16} />}
            </FooterButton>
          </span>
        </Tooltip>
      </NavigationFooter>
    </StepsLayout>
  );
};

export default ClassSteps;
