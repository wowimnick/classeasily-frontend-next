"use client";

import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { Star, Camera, X, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Form, Input, ConfigProvider, Upload, Button } from 'antd';
import message from '@/lib/message';
import dayjs from "dayjs";
import { reviewService, uploadService } from "@/services/apiService";

const { TextArea } = Input;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_FORMATS_STRING = ALLOWED_IMAGE_TYPES.join(",");

const theme = {
  token: {
    colorPrimary: "#ff385c",
    borderRadius: 12,
    colorBgContainer: "#ffffff",
    colorBorder: "#e0e0e0",
    fontSize: 14,
    controlHeight: 48,
  },
};

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #222;
`;

const CloseButton = styled.button`
  background: #f0f0f0;
  border: none;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background: #e0e0e0;
    transform: scale(1.1);
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
`;

const ClassInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 24px;
`;

const ClassImage = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
`;

const ClassDetails = styled.div``;

const ClassName = styled.h4`
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #222;
`;

const ClassDate = styled.p`
  margin: 0;
  font-size: 14px;
  color: #717171;
`;

const RatingSection = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const RatingLabel = styled.p`
  font-size: 16px;
  font-weight: 600;
  color: #222;
  margin: 0 0 16px 0;
  min-height: 24px;
  transition: color 0.2s ease;
`;

const StarRatingContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
`;

const StarButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #e0e0e0;
  transition: transform 0.2s ease, color 0.2s ease;

  &:hover {
    transform: scale(1.15);
  }

  &.active {
    color: ${theme.token.colorPrimary};
  }
`;

const ImageUploadContainer = styled.div`
  margin-top: 24px;
`;

const StyledDragger = styled(Upload.Dragger)`
  &.ant-upload.ant-upload-drag {
    border: 2px dashed #e0e0e0;
    border-radius: 12px;
    background: #fafafa;
    padding: 24px;
    transition: all 0.3s ease;

    &:hover {
      border-color: ${theme.token.colorPrimary};
      background: #fff8f9;
    }
  }

  .ant-upload-btn {
    padding: 0;
  }
`;

const UploadPlaceholderContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #717171;
`;

const HelpText = styled.div`
  font-size: 13px;
  color: #717171;
  margin-top: 12px;
  text-align: center;
`;

const PreviewContainer = styled(motion.div)`
  margin-top: 16px;
  position: relative;
  width: 120px;
  height: 120px;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  background: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  color: #717171;

  &:hover {
    transform: scale(1.1);
    color: #222;
  }
`;

const StyledSubmitButton = styled(Button)`
  width: 100%;
  height: 48px;
  font-weight: 700;
  font-size: 16px;
  border-radius: 12px !important;
`;

const ErrorMessage = styled.p`
  color: ${theme.token.colorPrimary};
  font-size: 14px;
  text-align: center;
  margin-bottom: 12px;
  min-height: 20px;
`;

const ReviewModal = ({ booking, isOpen, onClose, onSubmit }) => {
  const [form] = Form.useForm();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const commentValue = Form.useWatch("comment", form);

  const ratingLabels = useMemo(
    () => ({
      1: "Terrible",
      2: "Not good",
      3: "Okay",
      4: "Good",
      5: "Excellent",
    }),
    []
  );

  // (handleSubmit and other logic functions remain unchanged)
  const validateFile = (file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      message.error(`Invalid file type. Please upload JPEG, PNG, or WEBP.`);
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      message.error(`File is too large. Max size is ${MAX_IMAGE_SIZE_MB}MB.`);
      return false;
    }
    return true;
  };

  const handleBeforeUpload = (file) => {
    if (validateFile(file)) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError("");
    }
    return false;
  };

  const removeImage = () => {
    setImage(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async () => {
    if (!booking || !booking.booking_id) {
      setError("Cannot submit review. Booking information is missing.");
      return;
    }

    try {
      const values = await form.validateFields();

      if (rating === 0) {
        setError("Please select a rating.");
        return;
      }

      setSubmitting(true);
      setError("");

      let imageS3Key = null;

      if (image) {
        message.loading({
          content: "Uploading image...",
          key: "reviewImageUpload",
          duration: 0,
        });
        const uploadResult = await uploadService.uploadFile(
          image,
          "review_image"
        );

        if (uploadResult.success && uploadResult.s3_key) {
          imageS3Key = uploadResult.s3_key;
          message.success({
            content: "Image uploaded!",
            key: "reviewImageUpload",
            duration: 1.5,
          });
        } else {
          setError(
            uploadResult.error || "Image upload failed. Please try again."
          );
          message.error({
            content: "Image upload failed.",
            key: "reviewImageUpload",
            duration: 3,
          });
          setSubmitting(false);
          return;
        }
      }

      const reviewPayload = {
        booking_id: booking.booking_id,
        rating: rating,
        comment: values.comment.trim(),
      };

      if (imageS3Key) {
        reviewPayload.image_s3_key = imageS3Key;
      }

      const result = await reviewService.submitReview(reviewPayload);

      if (result.success) {
        onSubmit && onSubmit();
        form.resetFields();
        setRating(0);
        setImage(null);
        setPreviewUrl(null);
        onClose();
      } else {
        setError(result.error || "Failed to submit review.");
      }
    } catch (err) {
      if (err.errorFields) {
        setError(err.errorFields[0].errors[0]);
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setSubmitting(false);
      message.destroy("reviewImageUpload");
    }
  };

  const isSubmittable =
    rating > 0 && commentValue?.trim()?.length >= 10 && !submitting;

  return (
    <ConfigProvider theme={theme}>
      <AnimatePresence>
        {isOpen && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>How was your class?</ModalTitle>
                <CloseButton onClick={onClose} aria-label="Close modal">
                  <X size={20} />
                </CloseButton>
              </ModalHeader>

              <ModalBody>
                <ClassInfo>
                  <ClassImage
                    src={booking.class_image_thumb || "/api/placeholder/64/64"}
                    alt={booking.class_name}
                  />
                  <ClassDetails>
                    <ClassName>{booking.class_name}</ClassName>
                    <ClassDate>
                      Attended on {dayjs(booking.date).format("MMMM D, YYYY")}
                    </ClassDate>
                  </ClassDetails>
                </ClassInfo>

                <RatingSection>
                  <RatingLabel>
                    {ratingLabels[hoverRating || rating] ||
                      "Select your rating"}
                  </RatingLabel>
                  <StarRatingContainer onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarButton
                        key={star}
                        className={
                          (hoverRating || rating) >= star ? "active" : ""
                        }
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        type="button"
                        aria-label={`Rate ${star} star`}
                      >
                        <Star
                          size={40}
                          fill={
                            (hoverRating || rating) >= star
                              ? theme.token.colorPrimary
                              : "none"
                          }
                        />
                      </StarButton>
                    ))}
                  </StarRatingContainer>
                </RatingSection>

                <Form form={form} layout="vertical">
                  <Form.Item
                    name="comment"
                    rules={[
                      {
                        required: true,
                        message: "Please share your experience.",
                      },
                      {
                        min: 10,
                        message: "Review must be at least 10 characters.",
                      },
                    ]}
                  >
                    <TextArea
                      placeholder="Tell us about your experience! What did you like? What could be improved?"
                      rows={4}
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>
                </Form>

                <ImageUploadContainer>
                  {!previewUrl ? (
                    <>
                      <StyledDragger
                        multiple={false}
                        showUploadList={false}
                        beforeUpload={handleBeforeUpload}
                        accept={ACCEPTED_IMAGE_FORMATS_STRING}
                        name="review-image-upload"
                      >
                        <UploadPlaceholderContent>
                          <ImageIcon size={32} color="#8c8c8c" />
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 500,
                              color: "#434343",
                            }}
                          >
                            Add a photo
                          </p>
                          <p style={{ margin: 0, fontSize: "12px" }}>
                            Drag & Drop or Click to Upload
                          </p>
                        </UploadPlaceholderContent>
                      </StyledDragger>
                      <HelpText>
                        JPG, PNG, WEBP accepted. Max size: {MAX_IMAGE_SIZE_MB}
                        MB.
                      </HelpText>
                    </>
                  ) : (
                    <AnimatePresence>
                      <PreviewContainer
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <PreviewImage src={previewUrl} alt="Review preview" />
                        <RemoveImageButton
                          onClick={removeImage}
                          aria-label="Remove photo"
                        >
                          <X size={16} />
                        </RemoveImageButton>
                      </PreviewContainer>
                    </AnimatePresence>
                  )}
                </ImageUploadContainer>
              </ModalBody>

              <ModalFooter>
                <ErrorMessage>{error}</ErrorMessage>
                <StyledSubmitButton
                  type="primary"
                  onClick={handleSubmit}
                  disabled={!isSubmittable}
                  loading={submitting}
                  size="middle"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </StyledSubmitButton>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </ConfigProvider>
  );
};

export default ReviewModal;
