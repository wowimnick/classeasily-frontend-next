"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Form,
  Input,
  Select,
  Typography,
  ConfigProvider,
  Tooltip,
  Upload,
} from "antd";
import message from "@/lib/message";
import styled from "styled-components";
import {
  Star,
  X,
  ImagePlus,
  BookOpen,
  Info,
  Building2,
  Hash,
} from "lucide-react";
import heic2any from "heic2any";
import { motion } from "framer-motion";
import { theme } from "@/components/theme";
import { useClass } from "../ClassContext";
import { businessClassService } from "@/services/apiService";
import debounce from "lodash/debounce";

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg", // Some browsers use this
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
  "", // Empty string for cases where MIME type isn't detected
];
const MAX_IMAGE_SIZE_MB = 30;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_FORMATS_STRING = ALLOWED_IMAGE_TYPES.join(",");
const StyledForm = styled(Form)`
  overflow-x: hidden;
  .ant-form-item {
    &:first-child {
      margin-bottom: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }
  .ant-form-item-explain-error {
    margin-top: ${(props) => props.theme.token.marginXS}px;
    font-size: ${(props) => props.theme.token.fontSizeSM || "12px"};
  }
`;
const StepHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
`;
const StepTitle = styled(Title)`
  margin-bottom: ${(props) => props.theme.token.marginXS}px !important;
  color: ${(props) => props.theme.token.colorText};
  font-size: 28px !important;
  font-weight: 700 !important;
`;
const StepDescription = styled(Text)`
  display: block;
  color: ${(props) => props.theme.token.colorTextSecondary};
  font-size: ${(props) => props.theme.token.fontSizeLG || "16px"};
  margin-bottom: ${(props) => props.theme.token.marginLG}px;
  line-height: 1.6;
`;
const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 2rem 0;
  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${(props) => props.theme.token.colorBorder} 20%,
      ${(props) => props.theme.token.colorBorder} 80%,
      transparent 100%
    );
  }
  span {
    padding: 0 1rem;
    color: ${(props) => props.theme.token.colorTextSecondary};
    font-weight: 500;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: ${(props) => props.theme.token.colorBgContainer};
    border-radius: 20px;
    padding: 0.5rem 1rem;
    border: 1px solid ${(props) => props.theme.token.colorBorder};
  }
`;
const FormSection = styled(motion.div)`
  margin-bottom: 2rem;
  border-radius: 12px;
`;
const FormGroup = styled.div`
  margin-bottom: ${(props) =>
    props.theme.token.marginLG || props.theme.token.margin}px;
  width: 100%;
`;
const FormLabel = styled.label`
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => props.theme.token.colorText};
  margin-bottom: ${(props) => props.theme.token.marginXS}px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const HelpText = styled.div`
  font-size: 13px;
  color: ${(props) => props.theme.token.colorTextSecondary};
  margin-top: 4px;
  margin-bottom: 8px;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;
const StyledInput = styled(Input)`
  height: ${(props) => props.theme.token.controlHeight}px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: ${(props) => props.theme.token.fontSize}px;
  transition: all 0.3s ease;
  &:focus {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }
`;
const StyledSelect = styled(Select)`
  .ant-select-selector {
    height: ${(props) => props.theme.token.controlHeight}px !important;
    padding: 0 ${(props) => props.theme.token.controlPaddingHorizontal}px !important;
    border-radius: ${(props) => props.theme.token.borderRadius}px !important;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
  }
  .ant-select-selection-item,
  .ant-select-selection-placeholder {
    line-height: ${(props) => props.theme.token.controlHeight - 2}px !important;
    font-size: ${(props) => props.theme.token.fontSize}px;
  }
  &.ant-select-focused .ant-select-selector {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20 !important;
  }
`;
const StyledTagsSelect = styled(Select)`
  .ant-select-selector {
    min-height: ${(props) => props.theme.token.controlHeight}px !important;
    border-radius: ${(props) => props.theme.token.borderRadius}px !important;
    transition: all 0.3s ease;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    align-content: flex-start;
  }
  .ant-select-selection-overflow {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    gap: 4px;
    align-items: center;
  }
  .ant-select-selection-item {
    margin: 2px 2px 2px 0 !important;
    border-radius: ${(props) => props.theme.token.borderRadius}px !important;
    background: ${(props) => props.theme.token.colorPrimary}15 !important;
    border: 1px solid ${(props) => props.theme.token.colorPrimary}30 !important;
    font-size: ${(props) => props.theme.token.fontSize}px !important;
    padding: 2px 8px !important;
    height: auto !important;
    display: flex;
    align-items: center;
  }
  .ant-select-selection-item-content {
    color: ${(props) => props.theme.token.colorPrimary} !important;
    font-weight: 500;
  }
  .ant-select-selection-item-remove {
    color: ${(props) => props.theme.token.colorPrimary} !important;
    margin-left: 4px !important;
    font-size: 12px !important;
  }
  .ant-select-selection-search {
    margin: 2px 0 !important;
    min-width: 80px;
  }
  .ant-select-selection-placeholder {
    line-height: ${(props) =>
      props.theme.token.controlHeight - 12}px !important;
    font-size: ${(props) => props.theme.token.fontSize}px;
    color: ${(props) => props.theme.token.colorTextPlaceholder};
  }
  &.ant-select-focused .ant-select-selector {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20 !important;
  }
  &:hover .ant-select-selector {
    border-color: ${(props) => props.theme.token.colorPrimary} !important;
  }
`;
const ImageUploadSection = styled(motion.div)`
  padding: 0 0 0.5rem 0;
  border-radius: 12px;
  transition: all 0.3s ease;
`;
const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 12px;
`;
const StyledDragger = styled(Upload.Dragger)`
  &.ant-upload.ant-upload-drag {
    border: none;
    background: transparent;
    padding: 0;
    height: 100%;
    .ant-upload-btn {
      padding: 0;
      display: block;
      height: 100%;
    }
    .ant-upload-drag-container {
      display: block;
      height: 100%;
    }
    &:hover {
      border: none !important;
    }
  }
`;
const ImageCard = styled.div`
  position: relative;
  aspect-ratio: 1;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  ${(props) =>
    props.$isUpload &&
    ` cursor: pointer; gap: ${props.theme.token.marginXS}px; `}
`;
const ImagePreview = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${(props) => props.src});
  background-size: cover;
  background-position: center;
`;
const ImageActions = styled.div`
  position: absolute;
  top: ${(props) => props.theme.token.marginXS}px;
  right: ${(props) => props.theme.token.marginXS}px;
  display: flex;
  gap: ${(props) => props.theme.token.marginXS}px;
  z-index: 10;
`;
const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: white;
    transform: scale(1.1);
  }
`;
const CoverBadge = styled.div`
  position: absolute;
  bottom: ${(props) => props.theme.token.marginXS}px;
  left: ${(props) => props.theme.token.marginXS}px;
  background: ${(props) => props.theme.token.colorPrimary};
  color: white;
  padding: 6px 12px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
`;

const presetFeatures = [
  // --- Class Experience & Value ---
  { value: "All Materials Provided", label: "All Materials Provided" },
  { value: "Hands-On Experience", label: "Hands-On Experience" },
  { value: "Take-Home Creation", label: "Take-Home Creation" },
  { value: "Personalized Feedback", label: "Personalized Feedback" },
  { value: "Certificate of Completion", label: "Certificate of Completion" },

  // --- Skill & Level ---
  { value: "No Experience Necessary", label: "No Experience Necessary" },
  { value: "Suitable for All Levels", label: "Suitable for All Levels" },

  // --- Audience & Occasion ---
  { value: "Date Night Special", label: "Date Night Special" },
  { value: "Great for Team-Building", label: "Great for Team-Building" },
  { value: "Family-Friendly (All Ages)", label: "Family-Friendly (All Ages)" },

  // --- Logistics & Amenities ---
  { value: "Intimate Class Setting", label: "Intimate Class Setting" },
  { value: "Free On-Site Parking", label: "Free On-Site Parking" },
  { value: "Wheelchair Accessible", label: "Wheelchair Accessible" },
  { value: "Refreshments Included", label: "Refreshments Included" },
  { value: "Flexible Booking", label: "Flexible Booking" },
  { value: "Wear Comfortable Clothes", label: "Wear Comfortable Clothes" },
  { value: "Bilingual Instructor", label: "Bilingual Instructor" },

  // --- Pricing & Post-Class ---
  {
    value: "In-Class Materials for Purchase",
    label: "In-Class Materials for Purchase",
  },
];

// Sub-component to robustly handle subcategory rendering
const SubcategorySelect = ({ form, categoryOptions, loadingCategories }) => {
  const categoryValue = Form.useWatch("category", form);

  return (
    <FormGroup>
      <FormLabel>
        <Building2 size={16} />
        Subcategory
      </FormLabel>
      <HelpText>
        <Info size={14} />
        Select a specific subcategory to help students find exactly what they're
        looking for.
      </HelpText>
      <Form.Item
        name="subcategory"
        rules={[{ required: true, message: "Please select a subcategory" }]}
      >
        <StyledSelect
          placeholder="Select a subcategory"
          disabled={!categoryValue || loadingCategories}
          allowClear
          size="large"
        >
          {categoryValue &&
            categoryOptions[categoryValue]?.subcategories?.map((sub) => (
              <Option key={sub.key} value={sub.key}>
                {sub.label}
              </Option>
            ))}
        </StyledSelect>
      </Form.Item>
    </FormGroup>
  );
};

const BasicInfoStep = ({ onValidatedNext }) => {
  const [form] = Form.useForm();
  const { state, updateBasicInfo, debouncedUpdateBasicInfo, isLoaded } =
    useClass();
  const images = state.basicInfo?.images || [];
  const [categoryOptions, setCategoryOptions] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const isFormInitialized = useRef(false);
  const uploadBatchRef = useRef([]);

  useEffect(() => {
    if (isLoaded && !isFormInitialized.current && state.basicInfo) {
      const contextBasicInfo = state.basicInfo;
      form.setFieldsValue({
        title: contextBasicInfo.title || "",
        description: contextBasicInfo.description || "",
        category: contextBasicInfo.category || undefined,
        subcategory: contextBasicInfo.subcategory || undefined,
        features: contextBasicInfo.features || [],
      });
      isFormInitialized.current = true;
    }
  }, [isLoaded, state.basicInfo, form]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await businessClassService.getCategories();
        if (response.success) {
          const options = {};
          response.data.forEach((cat) => {
            options[cat.key] = {
              label: cat.name,
              subcategories: cat.subcategories.map((sub) => ({
                key: sub.key,
                label: sub.name,
              })),
            };
          });
          setCategoryOptions(options);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        message.error("An error occurred while loading categories");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Re-introduced for auto-saving
  const handleFieldsChange = (changedFields, allFields) => {
    if (isFormInitialized.current) {
      debouncedUpdateBasicInfo(form.getFieldsValue());
    }
  };

  const processImage = async (file) => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.toLowerCase().split(".").pop();
      const isHeic =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        ["heic", "heif"].includes(fileExtension);

      const conversionPromise = isHeic
        ? heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.9,
          })
        : Promise.resolve(file);

      conversionPromise
        .then((blobToProcess) => {
          // Handle the result from heic2any (could be Blob or File)
          const processedFile =
            blobToProcess instanceof File
              ? blobToProcess
              : new File(
                  [blobToProcess],
                  file.name.replace(/\.(heic|heif)$/i, ".jpeg"),
                  { type: "image/jpeg" }
                );

          // Now load the converted/original image
          const img = new Image();
          const objectUrl = URL.createObjectURL(processedFile);

          img.onload = () => {
            const MAX_WIDTH = 1920;
            const MAX_HEIGHT = 1080;
            const QUALITY = 0.8;

            let { width, height } = img;

            // Calculate new dimensions if resizing is needed
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }

            // Create canvas and resize if necessary
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            // Clean up object URL
            URL.revokeObjectURL(objectUrl);

            // Convert canvas to blob
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Image processing failed"));
                  return;
                }

                const finalFile = new File([blob], processedFile.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });

                resolve(finalFile);
              },
              "image/jpeg",
              QUALITY
            );
          };

          img.onerror = (error) => {
            console.error("Image loading error:", error);
            URL.revokeObjectURL(objectUrl);
            reject(new Error(`Failed to load image: ${file.name}`));
          };

          // Set the source after setting up event handlers
          img.src = objectUrl;
        })
        .catch((err) => {
          console.error("HEIC conversion failed:", err);
          reject(
            new Error(`HEIC conversion failed for ${file.name}: ${err.message}`)
          );
        });
    });
  };

  const validateFile = (file) => {
    // Check file extension for HEIC files since browsers might not detect MIME type correctly
    const fileExtension = file.name.toLowerCase().split(".").pop();
    const allowedExtensions = [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "heic",
      "heif",
      "avif",
    ];

    // Check both MIME type and file extension
    const isValidType =
      ALLOWED_IMAGE_TYPES.includes(file.type) ||
      allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      // Create a user-friendly, dynamic list of allowed formats.
      const friendlyFormatNames = [
        "JPEG",
        "PNG",
        "WEBP",
        "HEIC",
        "HEIF",
        "AVIF",
      ];

      message.error(
        `Invalid file type: ${
          file.name
        }. Please upload one of the following: ${friendlyFormatNames.join(
          ", "
        )}.`
      );
      return false;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      message.error(
        `File too large: ${file.name}. Max ${MAX_IMAGE_SIZE_MB}MB.`
      );
      return false;
    }

    return true;
  };
  const handleImageUpload = useCallback(
    async (selectedFiles) => {
      if (selectedFiles.length === 0) return;
      const remainingSlots = 10 - images.length;
      if (remainingSlots <= 0) {
        message.warning("Maximum 10 images allowed.");
        return;
      }
      const filesToProcess = selectedFiles
        .slice(0, remainingSlots)
        .filter(validateFile);
      if (filesToProcess.length === 0) return;
      message.loading({
        content: `Processing ${filesToProcess.length} image(s)...`,
        key: "imgProc",
        duration: 0,
      });

      const newUploadedImagesPromises = filesToProcess.map((file) =>
        processImage(file)
          .then((processedFile) => ({
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            file: processedFile,
            url: URL.createObjectURL(processedFile),
            isCover: false,
          }))
          .catch((error) => {
            message.error(`Error processing ${file.name}: ${error.message}`);
            return null;
          })
      );
      const newImagesResults = await Promise.all(newUploadedImagesPromises);
      const successfullyProcessedImages = newImagesResults.filter(
        (img) => img !== null
      );
      message.destroy("imgProc");

      if (successfullyProcessedImages.length > 0) {
        message.success(
          `${successfullyProcessedImages.length} image(s) added.`
        );
        const currentImages = state.basicInfo?.images || [];
        let updatedImages = [...currentImages, ...successfullyProcessedImages];

        // Ensure there is always a cover image if images exist
        if (
          !updatedImages.some((img) => img.isCover) &&
          updatedImages.length > 0
        ) {
          updatedImages[0].isCover = true;
        }

        const currentFormValues = form.getFieldsValue();

        debouncedUpdateBasicInfo({
          ...currentFormValues,
          images: updatedImages.slice(0, 10),
        });
      }
    },
    [state.basicInfo?.images, debouncedUpdateBasicInfo, images.length, form]
  );
  const debouncedProcessBatch = useCallback(
    debounce((files) => {
      handleImageUpload(files);
      uploadBatchRef.current = [];
    }, 150),
    [handleImageUpload]
  );
  const handleBeforeUpload = (file) => {
    uploadBatchRef.current.push(file);
    debouncedProcessBatch([...uploadBatchRef.current]);
    return false;
  };
  const setCoverImage = (imageId) => {
    const newImages = images.map((img) => ({
      ...img,
      isCover: img.id === imageId,
    }));
    updateBasicInfo({ images: newImages });
  };
  const removeImage = (imageId) => {
    const imageToRemove = images.find((img) => img.id === imageId);
    if (imageToRemove?.url?.startsWith("blob:")) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    const updated = images.filter((img) => img.id !== imageId);
    if (
      imageToRemove?.isCover &&
      updated.length > 0 &&
      !updated.some((img) => img.isCover)
    ) {
      updated[0].isCover = true;
    }
    updateBasicInfo({ images: updated });
  };

  const handleCategoryChange = (value) => {
    form.setFieldsValue({ subcategory: undefined });
  };

  const handleSubmit = (values) => {
    // 1. Update the global context immediately (non-debounced)
    updateBasicInfo({ ...values, images });
    // 2. Signal to the parent to proceed
    onValidatedNext();
  };

  const descriptionTooltipContent = (
    <div style={{ maxWidth: "300px" }}>
      <strong>Make your description engaging:</strong>
      <ul
        style={{ paddingLeft: "20px", margin: "5px 0 0 0", fontSize: "12px" }}
      >
        <li>What will students learn or achieve?</li>
        <li>Describe your teaching style/atmosphere.</li>
        <li>Mention unique aspects or benefits.</li>
        <li>Include relevant keywords.</li>
      </ul>
    </div>
  );

  return (
    <ConfigProvider theme={theme}>
      <StepHeader>
        <StepTitle level={2}>Class Information</StepTitle>
        <StepDescription>
          Tell us about your class. These core details help students find and
          understand your workshop.
        </StepDescription>
      </StepHeader>

      <StyledForm
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFieldsChange={handleFieldsChange} // Restored for auto-saving
        id="step-0-form"
        preserve={true}
      >
        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FormGroup>
            <FormLabel>
              <BookOpen size={16} />
              Class Title
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Create a clear, descriptive title that tells students exactly what
              you're teaching.
            </HelpText>
            <Form.Item
              name="title"
              rules={[
                { required: true, message: "Please enter a class title" },
                { min: 5, message: "Title must be at least 5 characters" },
                { max: 100, message: "Title cannot exceed 100 characters" },
              ]}
            >
              <StyledInput
                width={true}
                placeholder="e.g., Introduction to Pottery Wheel Throwing"
                size="large"
              />
            </Form.Item>
          </FormGroup>

          <FormGroup>
            <FormLabel>
              {" "}
              <BookOpen size={16} /> Class Description{" "}
              <Tooltip title={descriptionTooltipContent} placement="topRight">
                {" "}
                <Info
                  size={14}
                  style={{ color: "#8c8c8c", cursor: "help" }}
                />{" "}
              </Tooltip>{" "}
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Describe what students will learn, your teaching approach, and
              what makes your class special. Longer descriptions = higher
              ranking ⭐
            </HelpText>
            <Form.Item
              name="description"
              rules={[
                { required: true, message: "Please enter a class description" },
                {
                  min: 100,
                  message: "Description must be at least 100 characters",
                },
                {
                  max: 4000,
                  message: "Description cannot exceed 4000 characters",
                },
              ]}
            >
              <StyledInput.TextArea
                placeholder="Tell students about what they'll learn, your teaching style, and what makes this class unique..."
                maxLength={4000}
                showCount
                autoSize={{ minRows: 4, maxRows: 6 }}
              />
            </Form.Item>
          </FormGroup>
        </FormSection>

        <SectionDivider>
          {" "}
          <span>
            <ImagePlus size={16} />
            Class Photos
          </span>{" "}
        </SectionDivider>

        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <FormGroup>
            <FormLabel>
              <ImagePlus size={16} />
              Class Images (2-10 photos required)
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Upload high-quality photos that showcase your class environment,
              materials, and student work. More images = higher ranking ⭐
            </HelpText>
            <Form.Item
              name="class_photos_validation"
              rules={[
                {
                  validator: async () => {
                    if (!images || images.length < 2) {
                      return Promise.reject(
                        new Error("Please upload at least 2 images.")
                      );
                    }
                    if (images.length > 10) {
                      return Promise.reject(
                        new Error("Maximum 10 images allowed.")
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              dependencies={[images]}
            >
              <ImageUploadSection>
                <ImageGrid>
                  {images.map((image) => (
                    <ImageCard key={image.id} $isCover={image.isCover}>
                      <ImagePreview
                        src={image.url}
                        alt={`Class image ${
                          image.file ? image.file.name : image.id
                        }`}
                      />
                      <ImageActions>
                        {!image.isCover && (
                          <Tooltip title="Set as cover">
                            {" "}
                            <ActionButton
                              type="button"
                              onClick={() => setCoverImage(image.id)}
                            >
                              {" "}
                              <Star size={16} />{" "}
                            </ActionButton>{" "}
                          </Tooltip>
                        )}
                        <Tooltip title="Remove image">
                          {" "}
                          <ActionButton
                            type="button"
                            onClick={() => removeImage(image.id)}
                          >
                            {" "}
                            <X size={16} />{" "}
                          </ActionButton>{" "}
                        </Tooltip>
                      </ImageActions>
                      {image.isCover && (
                        <CoverBadge>
                          {" "}
                          <Star size={12} /> Cover{" "}
                        </CoverBadge>
                      )}
                    </ImageCard>
                  ))}
                  {images.length < 10 && (
                    <StyledDragger
                      multiple={true}
                      showUploadList={false}
                      beforeUpload={handleBeforeUpload}
                      accept={ACCEPTED_IMAGE_FORMATS_STRING}
                    >
                      <ImageCard $isUpload>
                        <ImagePlus size={32} color="#94a3b8" />
                        <span style={{ fontSize: "14px", fontWeight: "500" }}>
                          Add Photos
                        </span>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          Drag, drop, or click
                        </span>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                          up to {10 - images.length} more
                        </span>
                      </ImageCard>
                    </StyledDragger>
                  )}
                </ImageGrid>
              </ImageUploadSection>
            </Form.Item>
          </FormGroup>
        </FormSection>

        <SectionDivider>
          {" "}
          <span>
            <Building2 size={16} />
            Categorization & Features
          </span>{" "}
        </SectionDivider>

        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <FormGroup>
            <FormLabel>
              <Building2 size={16} />
              Main Category
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Choose the primary subject area that best describes your class.
            </HelpText>
            <Form.Item
              name="category"
              rules={[{ required: true, message: "Please select a category" }]}
            >
              <StyledSelect
                placeholder="Select the main category"
                allowClear
                onChange={handleCategoryChange}
                loading={loadingCategories}
                size="large"
              >
                {Object.entries(categoryOptions).map(([key, { label }]) => (
                  <Option key={key} value={key}>
                    {label}
                  </Option>
                ))}
              </StyledSelect>
            </Form.Item>
          </FormGroup>

          {/* Using the robust sub-component */}
          <SubcategorySelect
            form={form}
            categoryOptions={categoryOptions}
            loadingCategories={loadingCategories}
          />

          <FormGroup>
            <FormLabel>
              <Hash size={16} />
              Class Features
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Select from our curated list of features that highlight the value
              of your class. You can also type to add your own.
            </HelpText>
            <Form.Item
              name="features"
              rules={[
                {
                  required: true,
                  message: "Please select or add at least one feature",
                },
              ]}
            >
              <StyledTagsSelect
                mode="tags"
                style={{ width: "100%" }}
                placeholder="Select features or type custom ones"
                tokenSeparators={[","]}
                size="large"
                options={presetFeatures}
                maxTagCount="responsive"
              />
            </Form.Item>
          </FormGroup>
        </FormSection>
      </StyledForm>
    </ConfigProvider>
  );
};

export default BasicInfoStep;
