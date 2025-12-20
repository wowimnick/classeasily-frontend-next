"use client";

import React, { useState, useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, CalendarDays, Users, MoreHorizontal, AlertCircle,
  Check, List, Undo2, Star, AlertTriangle, FileText, DollarSign,
  Trash2, UploadCloud, Loader2
} from "lucide-react";
import { Button, Tooltip, Dropdown, Alert, Tag, Form, Input, Upload, message } from "antd";
import imageCompression from "browser-image-compression";
import { theme } from "@/components/theme";
import { bookingService, reviewService, uploadService } from "@/services/apiService";

// --- Styled Components ---

const PerspectiveContainer = styled.div`
  perspective: 1000px;
  position: relative;
  z-index: 1;
  -webkit-perspective: 1000px;
  
  /* Highlighting Pulse Animation */
  ${props => props.$highlighted && css`
    z-index: 2;
    &:before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 24px;
      border: 2px solid ${theme.token.colorPrimary};
      animation: pulseHighlight 2s infinite;
      z-index: -1;
      pointer-events: none;
    }
  `}

  @keyframes pulseHighlight {
    0% { opacity: 1; box-shadow: 0 0 0 0 rgba(255, 56, 92, 0.4); }
    70% { opacity: 0; box-shadow: 0 0 0 10px rgba(255, 56, 92, 0); }
    100% { opacity: 0; box-shadow: 0 0 0 0 rgba(255, 56, 92, 0); }
  }
`;

const FlippableCard = styled(motion.div)`
  position: relative;
  width: 100%;
  transform-style: preserve-3d;
  border-radius: 20px;
  background: transparent;
  will-change: transform; 
`;

const FaceBase = styled.div`
  border-radius: 20px;
  background: white;
  border: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
`;

const FrontFace = styled(FaceBase)`
  position: relative; 
  width: 100%;
  height: 100%;
  z-index: 2;
  transform: rotateY(0deg) translateZ(0.1px); 
  background: white;
`;

const BackFace = styled(FaceBase)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fdfdfd;
  transform: rotateY(180deg) translateZ(0.1px);
`;

const ImageContainer = styled.div`
  position: relative;
  height: 150px;
  width: 100%;
  background: #f5f5f5;
  flex-shrink: 0;
`;

const ClassImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: -webkit-optimize-contrast;
`;

const StatusBadge = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  color: ${(props) => {
    switch (props.$status) {
      case "confirmed": return "#15803d";
      case "completed": return "#0369a1";
      case "cancelled": return "#be123c";
      default: return "#555";
    }
  }};
`;

const NotchScheduleButton = styled(motion.button)`
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(30, 41, 59, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: all 0.2s ease;
  z-index: 10;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: rgba(30, 41, 59, 0.9);
    transform: translateY(-1px);
  }
`;

const CardContent = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ClassTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const BusinessName = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
  font-weight: 500;
`;

const Divider = styled.div`
  height: 1px;
  background: #f3f4f6;
  margin: 10px 0;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
  color: #4b5563;
  font-size: 13px;

  svg {
    color: ${theme.token.colorPrimary};
    width: 15px;
    height: 15px;
    margin-top: 2px;
    flex-shrink: 0;
    opacity: 0.8;
  }
`;

const PriceTag = styled.div`
  display: inline-flex;
  align-items: center;
  background: ${(props) => (props.$isFree ? "#f0fdfa" : "#f0fdf4")};
  color: ${(props) => (props.$isFree ? "#0d9488" : "#166534")};
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  margin-bottom: 8px;
  align-self: flex-start;
`;

const CardFooter = styled.div`
  padding: 12px 16px;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const LocationLink = styled.a`
  color: inherit;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
    color: ${theme.token.colorPrimary};
  }
`;

const BackHeader = styled.div`
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;

  h4 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: #111;
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const ReturnButton = styled.button`
  background: #f3f4f6;
  border: none;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #111;
  }
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
`;

const ReviewWrapper = styled.div`
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const ReviewTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
  text-align: center;
`;

const StarContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
`;

const CompactStarBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  transition: transform 0.1s;
  color: ${props => props.$active ? '#ff385c' : '#e5e7eb'};
  &:hover { transform: scale(1.1); }
`;

const UploadZone = styled.div`
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  padding: 16px 12px;
  background: #f9fafb;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    border-color: ${theme.token.colorPrimary || "#1677ff"};
    background: #eff6ff;
  }

  span { font-size: 12px; font-weight: 600; color: #4b5563; }
  small { font-size: 10px; color: #9ca3af; }
`;

const FilePreviewCard = styled(motion.div)`
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e5e7eb;
  padding: 8px;
  border-radius: 12px;
  margin-top: 12px;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
`;

const PreviewThumbnail = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f3f4f6;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const FileInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  span.name { font-size: 12px; font-weight: 600; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  span.size { font-size: 10px; color: #9ca3af; }
`;

const DeleteButton = styled.button`
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  &:hover { background: #fee2e2; }
`;

const skeletonLoading = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const SkeletonBase = styled.div`
  background: #f3f4f6;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: ${skeletonLoading} 1.5s infinite;
  border-radius: 4px;
`;

const SkeletonLine = styled(SkeletonBase)`
  height: 12px;
  width: ${props => props.$width || '100%'};
  margin-bottom: ${props => props.$mb || '8px'};
`;

const SkeletonBox = styled(SkeletonBase)`
  width: 100%;
  height: 60px;
  border-radius: 8px;
  margin-bottom: 12px;
`;

const PolicyContainer = styled.div`
  padding: 16px;
`;

const BackFooter = styled.div`
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #f3f4f6;
  margin-top: auto;
  flex-shrink: 0;
`;

const InfoBox = styled.div`
  background: ${props => props.$bg || '#fafafa'};
  border: 1px solid ${props => props.$border || '#f0f0f0'};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  h5 { margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #333; }
  p { margin: 0; font-size: 12px; color: #666; line-height: 1.4; }
`;

const FinanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
  &:last-child { border-bottom: none; font-weight: 700; background: #fafafa; padding: 8px; border-radius: 6px; margin-top: 4px; }
`;

const SessionItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  background: ${props => props.$isCurrent ? '#eff6ff' : 'transparent'};
  &:last-child { border-bottom: none; }
`;

const SessionIndex = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.$isCompleted ? '#ccfbf1' : '#f3f4f6'};
  color: ${props => props.$isCompleted ? '#0f766e' : '#9ca3af'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  margin-right: 12px;
  flex-shrink: 0;
`;

const SessionDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const BookingClassCard = ({
  id,
  booking,
  onBookAgain,
  highlighted = false,
  onCancelSuccess,
  onReviewSuccess,
}) => {
  const [activeView, setActiveView] = useState(null);
  const [loading, setLoading] = useState(false);

  // Review State
  const [rating, setRating] = useState(0);
  const [reviewImage, setReviewImage] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [reviewForm] = Form.useForm();

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (reviewImage && reviewImage.preview) {
        URL.revokeObjectURL(reviewImage.preview);
      }
    };
  }, [reviewImage]);

  // Cancellation State
  const [cancelPolicy, setCancelPolicy] = useState(null);

  // --- ACTIONS ---

  const fetchCancellationPolicy = async () => {
    setLoading(true);
    try {
      const response = await bookingService.getBookingCancellationInfo(booking.id);
      if (response.success) {
        setCancelPolicy(response.data);
      } else {
        message.error(response.error || "Could not load cancellation policy.");
        setActiveView(null);
      }
    } catch (err) {
      message.error("Failed to load details.");
      setActiveView(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = (view) => {
    setActiveView(view);
    // If flipping to cancel view and we haven't loaded policy yet
    if (view === 'cancel' && !cancelPolicy) {
      fetchCancellationPolicy();
    }
  };

  const handleImageUpload = (file) => {
    // 1. Basic validation (we accept images, browser will allow HEIC/HEIF in picker)
    if (!file.type.startsWith('image/')) {
      message.error('You can only upload image files!');
      return Upload.LIST_IGNORE;
    }

    // 2. Start Async Compression / Conversion
    const processImage = async () => {
      setIsProcessingImage(true);
      try {
        const options = {
          maxSizeMB: 2,           // Compress to 2MB
          maxWidthOrHeight: 1920, // Downscale if huge
          useWebWorker: true,
          fileType: "image/jpeg"  // Force JPEG (fixes HEIC/iPhone issues)
        };

        const compressedFile = await imageCompression(file, options);

        // Add preview for UI
        compressedFile.preview = URL.createObjectURL(compressedFile);

        // Ensure the file name ends in .jpg for the backend
        const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

        // Create a proper File object from the Blob
        const finalFile = new File([compressedFile], `${fileName}.jpg`, {
          type: 'image/jpeg',
          lastModified: new Date().getTime()
        });

        // Attach the preview to the new file object so the UI can use it
        finalFile.preview = compressedFile.preview;

        setReviewImage(finalFile);
      } catch (err) {
        console.error("Image processing error:", err);
        message.error("Could not process image. Please try a different file.");
      } finally {
        setIsProcessingImage(false);
      }
    };

    processImage();

    // 3. Prevent Ant Design from uploading automatically via XHR
    return false;
  };

  const handleRemoveImage = () => {
    setReviewImage(null);
  };

  const handleSubmitReview = async () => {
    try {
      const values = await reviewForm.validateFields();
      if (rating === 0) return message.error("Please select a rating");

      setLoading(true);

      let imageS3Key = null;

      if (reviewImage) {
        const uploadResult = await uploadService.uploadFile(reviewImage, "review_image");

        if (!uploadResult.success) {
          message.error(uploadResult.error || "Failed to upload image");
          setLoading(false);
          return;
        }
        imageS3Key = uploadResult.s3_key;
      }

      // 2. Create JSON Payload
      const payload = {
        booking_id: booking.id,
        rating: rating,
        comment: values.comment,
        image_s3_key: imageS3Key,
      };

      // 3. Submit Review
      const response = await reviewService.submitReview(payload);

      if (response.success) {
        message.success("Review submitted successfully!");
        setActiveView(null);
        setRating(0);
        setReviewImage(null);
        reviewForm.resetFields();
        if (onReviewSuccess) onReviewSuccess();
      } else {
        message.error(response.error || "Failed to submit review.");
      }
    } catch (e) {
      console.error(e);
      if (!e.errorFields) message.error("An error occurred submitting the review.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!booking || !booking.id) {
      message.error("Invalid booking.");
      return;
    }

    setLoading(true);
    try {
      const response = await bookingService.studentCancelBooking(
        booking.id,
        "Cancelled by student via dashboard."
      );

      if (response.success) {
        message.success("Booking cancelled successfully.");
        setActiveView(null);
        if (onCancelSuccess) onCancelSuccess();
      } else {
        let errorMsg = "Failed to cancel booking.";
        if (typeof response.error === "string") errorMsg = response.error;
        else if (response.error?.detail) errorMsg = response.error.detail;
        message.error(errorMsg);
      }
    } catch (error) {
      message.error("An error occurred during cancellation.");
    } finally {
      setLoading(false);
    }
  };

  // --- CONTENT RENDERERS ---

  const renderBackContent = () => {
    if (activeView === 'schedule') {
      return (
        <ScrollArea>
          {booking.all_sessions?.map((session, idx) => {
            const isCompleted = session.status === "completed";
            return (
              <SessionItem key={session.id} $isCurrent={session.id === booking.id}>
                <SessionIndex $isCompleted={isCompleted}>
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                </SessionIndex>
                <SessionDetails>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Session {idx + 1}</span>
                  <span style={{ fontSize: 11, color: '#666' }}>{session.userLocalSessionTime}</span>
                </SessionDetails>
              </SessionItem>
            );
          })}
        </ScrollArea>
      );
    }

    if (activeView === 'review') {
      return (
        <ScrollArea>
          <ReviewWrapper>
            <div>
              <ReviewTitle>Rate your experience</ReviewTitle>

              <StarContainer>
                {[1, 2, 3, 4, 5].map(star => (
                  <CompactStarBtn
                    key={star}
                    type="button"
                    $active={rating >= star}
                    onClick={() => setRating(star)}
                  >
                    <Star fill={rating >= star ? "#ff385c" : "none"} size={28} />
                  </CompactStarBtn>
                ))}
              </StarContainer>
              <Form form={reviewForm} layout="vertical">
                <Form.Item
                  name="comment"
                  rules={[{ required: true, min: 5, message: 'Write a bit more!' }]}
                  style={{ marginBottom: 8 }}
                >
                  <Input.TextArea
                    placeholder="What did you like? What could be improved?"
                    autoSize={{ minRows: 3, maxRows: 5 }}
                    style={{ fontSize: 13, borderRadius: 8 }}
                  />
                </Form.Item>
              </Form>

              <AnimatePresence mode="wait">
                {!reviewImage ? (
                  <motion.div
                    key="upload-btn"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Upload
                      accept="image/png, image/jpeg, image/webp, image/heic, image/heif"
                      showUploadList={false}
                      beforeUpload={handleImageUpload}
                      disabled={isProcessingImage}
                      customRequest={() => { }}
                    >
                      <UploadZone>
                        {isProcessingImage ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            >
                              <Loader2 size={20} color="#6b7280" />
                            </motion.div>
                            <span>Optimizing...</span>
                            <small>Converting for upload</small>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={20} color="#6b7280" />
                            <span>Add Photo</span>
                            <small>Max 2MB (Auto-compressed)</small>
                          </>
                        )}
                      </UploadZone>
                    </Upload>
                  </motion.div>
                ) : (
                  <FilePreviewCard
                    key="preview-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <PreviewThumbnail>
                      <img src={reviewImage.preview} alt="preview" />
                    </PreviewThumbnail>
                    <FileInfo>
                      <span className="name">{reviewImage.name}</span>
                      <span className="size">{(reviewImage.size / 1024).toFixed(1)} KB</span>
                    </FileInfo>
                    <Tooltip title="Remove photo">
                      <DeleteButton onClick={handleRemoveImage}>
                        <Trash2 size={16} />
                      </DeleteButton>
                    </Tooltip>
                  </FilePreviewCard>
                )}
              </AnimatePresence>
            </div>

            <Button
              type="primary"
              block
              style={{ marginTop: 16, borderRadius: 12, fontWeight: 600, height: 40 }}
              loading={loading || isProcessingImage}
              onClick={handleSubmitReview}
              key={`btn-${loading || isProcessingImage}`}>
              Submit Review
            </Button>
          </ReviewWrapper>
        </ScrollArea>
      );
    }

    if (activeView === 'cancel') {
      if (loading && !cancelPolicy) {
        return (
          <>
            <ScrollArea>
              <PolicyContainer>
                <InfoBox>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <SkeletonLine $width="14px" $mb="0" style={{ height: 14 }} />
                    <SkeletonLine $width="100px" $mb="0" style={{ height: 14 }} />
                  </div>
                  <SkeletonLine $width="90%" />
                  <SkeletonLine $width="75%" />
                  <SkeletonLine $width="40%" $mb="0" />
                </InfoBox>
                <InfoBox $bg="white">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <SkeletonLine $width="14px" $mb="0" style={{ height: 14 }} />
                    <SkeletonLine $width="60px" $mb="0" style={{ height: 14 }} />
                  </div>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <SkeletonLine $width="30%" $mb="0" style={{ height: 10 }} />
                      <SkeletonLine $width="20%" $mb="0" style={{ height: 10 }} />
                    </div>
                  ))}
                </InfoBox>
              </PolicyContainer>
            </ScrollArea>
            <BackFooter>
              <SkeletonBox style={{ height: 40, borderRadius: 12, margin: 0 }} />
            </BackFooter>
          </>
        );
      }

      // Safe access to policy data
      const price = parseFloat(booking.price || 0);
      const refund = cancelPolicy?.refund_percentage
        ? (price * (cancelPolicy.refund_percentage / 100))
        : 0;

      return (
        <>
          <ScrollArea>
            <PolicyContainer>
              <InfoBox>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <FileText size={14} color="#666" />
                  <h5>Cancellation Policy</h5>
                </div>
                <p>{cancelPolicy?.policy_description || "Policy details unavailable."}</p>
              </InfoBox>

              <InfoBox $bg="white">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <DollarSign size={14} color="#666" />
                  <h5>Summary</h5>
                </div>
                <FinanceRow><span>Paid</span><span>${price.toFixed(2)}</span></FinanceRow>
                <FinanceRow><span>Non-Refundable</span><span>${(price - refund).toFixed(2)}</span></FinanceRow>
                <FinanceRow><span>Refund Amount</span><span style={{ color: refund > 0 ? 'green' : 'inherit' }}>${refund.toFixed(2)}</span></FinanceRow>
              </InfoBox>
            </PolicyContainer>
          </ScrollArea>
          <BackFooter>
            {cancelPolicy?.can_cancel ? (
              <Button
                danger
                block
                type="primary"
                style={{ borderRadius: 12, height: 40 }}
                loading={loading}
                onClick={handleConfirmCancel}
                key={`btn-${loading}`}>
                Confirm Cancellation
              </Button>
            ) : (
              <Alert type="error" message="Cancellation unavailable" style={{ fontSize: 12 }} />
            )}
          </BackFooter>
        </>
      );
    }
    return null;
  };

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'schedule': return <><List size={14} /> Course Schedule</>;
      case 'review': return <><Star size={14} /> Write a Review</>;
      case 'cancel': return <><AlertTriangle size={14} /> Cancel Booking</>;
      default: return "";
    }
  };

  const statusMap = { confirmed: "Upcoming", completed: "Completed", cancelled: "Cancelled" };
  const hasSchedule = booking.enrollment_type === "Full Course" && booking.all_sessions?.length > 0;
  const isUpcoming = booking.status === "confirmed";
  const isCompleted = booking.status === "completed";

  return (
    <PerspectiveContainer id={`booking-card-${id}`} $highlighted={highlighted}>
      <FlippableCard
        initial={false}
        animate={{ rotateY: activeView ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        <FrontFace>
          <ImageContainer>
            <ClassImage src={booking.class_image_large_url || "/api/placeholder/400/300"} alt={booking.class_name} />
            <StatusBadge $status={booking.status}>{statusMap[booking.status] || booking.status}</StatusBadge>

            {hasSchedule && !activeView && (
              <NotchScheduleButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); handleFlip('schedule'); }}
              >
                <span>Schedule</span>
                <List size={14} strokeWidth={2.5} />
              </NotchScheduleButton>
            )}
          </ImageContainer>

          <CardContent>
            {booking.session_info && (
              <div style={{ marginBottom: 6 }}>
                <Tag color="geekblue" style={{ border: 'none', fontWeight: 600 }}>
                  Session {booking.session_info.current_session}/{booking.session_info.total_sessions}
                </Tag>
              </div>
            )}
            <ClassTitle title={booking.class_name}>{booking.class_name}</ClassTitle>
            <BusinessName>{booking.business_name}</BusinessName>

            <PriceTag $isFree={!parseFloat(booking.price)}>
              {!parseFloat(booking.price) ? "FREE" : `$${parseFloat(booking.price).toFixed(2)}`}
            </PriceTag>

            <Divider />

            <DetailRow><CalendarDays /><span>{booking.userLocalSessionTime}</span></DetailRow>
            <DetailRow>
              <MapPin />
              <Tooltip title={booking.location_address_string}>
                <LocationLink href="#">{booking.location_address_string || "Online"}</LocationLink>
              </Tooltip>
            </DetailRow>
            {booking.participants > 1 && <DetailRow><Users /><span>{booking.participants} Participants</span></DetailRow>}
          </CardContent>

          <CardFooter>
            {isUpcoming && (
              <Dropdown
                menu={{
                  items: [{
                    key: 'cancel',
                    label: 'Cancel Booking',
                    icon: <AlertCircle size={14} />,
                    danger: true,
                    onClick: () => handleFlip('cancel')
                  }]
                }}
                trigger={['click']}
              >
                <Button size="middle" icon={<MoreHorizontal size={14} />}>Options</Button>
              </Dropdown>
            )}

            {isCompleted && (
              <>
                <Button
                  size="middle"
                  disabled={booking.has_review}
                  onClick={() => handleFlip('review')}
                >
                  {booking.has_review ? "Reviewed" : "Review"}
                </Button>
                <Button size="middle" type="primary" onClick={() => onBookAgain(booking)}>Book Again</Button>
              </>
            )}

            {!isUpcoming && !isCompleted && (
              <Button size="middle" onClick={() => onBookAgain(booking)}>Book Again</Button>
            )}
          </CardFooter>
        </FrontFace>

        <BackFace>
          <BackHeader>
            <h4>{getHeaderTitle()}</h4>
            <ReturnButton onClick={() => setActiveView(null)}>
              <Undo2 size={14} /> Back
            </ReturnButton>
          </BackHeader>

          {renderBackContent()}
        </BackFace>
      </FlippableCard>
    </PerspectiveContainer>
  );
};

export default BookingClassCard;