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
  Sparkles,
  Info,
  Building2,
  Hash,
  Tent,
} from "lucide-react";
import { motion } from "framer-motion";
import { theme } from "@/components/theme";
import { useClass } from "../ClassContext";
import {
  bookingTheme,
  PageTitle,
  FieldDivider,
} from "../../_shared/BookingFlowDesign";
import { businessClassService } from "@/services/apiService";
import debounce from "lodash/debounce";

const { Option } = Select;
const { Title, Text } = Typography;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
  "",
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
  margin-bottom: 24px;
  position: relative;
`;
const StepDescription = styled.div`
  font-size: 15px;
  max-width: 560px;
  margin: 0 auto;
  color: #000;
  line-height: 1.5;
`;
const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 24px 0;
  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${bookingTheme.borderLight};
  }
  span {
    padding: 0 1rem;
    color: ${bookingTheme.textSecondary};
    font-weight: 600;
    font-size: 15px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;
const FormSection = styled(motion.div)`
  margin-bottom: 24px;
  background: ${bookingTheme.bg};
  border: 1px solid ${bookingTheme.borderLight};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  padding: 20px;
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
  @media (max-width: 768px) {
    font-size: 16px !important;
  }
`;

const StyledTextArea = styled(Input.TextArea)`
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: ${(props) => props.theme.token.fontSize}px;
  transition: all 0.3s ease;
  &:focus {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }
  @media (max-width: 768px) {
    font-size: 16px !important;
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

    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }
  @media (max-width: 768px) {
    .ant-select-selection-search-input {
      font-size: 16px !important;
    }
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

    @media (max-width: 768px) {
      font-size: 14px !important;
    }
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

    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }
  @media (max-width: 768px) {
    .ant-select-selection-search-input {
      font-size: 16px !important;
    }
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
  // --- Essentials ---
  { value: "All Supplies Included", label: "All Supplies Included" },
  { value: "Beginner Friendly", label: "Beginner Friendly" },
  { value: "Drinks Included", label: "Drinks Included" },
  { value: "Food Included", label: "Food Included" },
  { value: "Take-Home Creation", label: "Take-Home Creation" },

  // --- Vibe & Audience ---
  { value: "Small Group", label: "Small Group" },
  { value: "Private Group Available", label: "Private Group Available" },
  { value: "Date Night", label: "Date Night" },
  { value: "Family Friendly", label: "Family Friendly" },
  { value: "Great for Teams", label: "Great for Teams" },

  // --- Logistics ---
  { value: "Free Parking", label: "Free Parking" },
  { value: "Indoor", label: "Indoor" },
  { value: "Outdoor", label: "Outdoor" },
  { value: "Wheelchair Accessible", label: "Wheelchair Accessible" },
];

const SubcategorySelect = ({ form, categoryOptions, loadingCategories }) => {
  const categoryValue = Form.useWatch("category", form);

  return (
    <FormGroup>
      <FormLabel>
        <Hash size={16} />
        Subcategory
      </FormLabel>
      <HelpText>
        <Info size={14} />
        Select a specific tag to help guests find exactly what they're looking
        for.
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
        ? (async () => {
            const { default: heic2any } = await import("heic2any");
            return heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: 0.9,
            });
          })()
        : Promise.resolve(file);

      conversionPromise
        .then((blobToProcess) => {
          const processedFile =
            blobToProcess instanceof File
              ? blobToProcess
              : new File(
                  [blobToProcess],
                  file.name.replace(/\.(heic|heif)$/i, ".jpeg"),
                  { type: "image/jpeg" }
                );

          const img = new Image();
          const objectUrl = URL.createObjectURL(processedFile);

          img.onload = () => {
            const MAX_WIDTH = 1920;
            const MAX_HEIGHT = 1080;
            const QUALITY = 0.8;

            let { width, height } = img;

            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            URL.revokeObjectURL(objectUrl);

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

    const isValidType =
      ALLOWED_IMAGE_TYPES.includes(file.type) ||
      allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      message.error(
        `Invalid file type: ${file.name}. Please upload JPEG, PNG, or WEBP.`
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
    updateBasicInfo({ ...values, images });
    onValidatedNext();
  };

  const descriptionTooltipContent = (
    <div style={{ maxWidth: "300px" }}>
      <strong>Make it engaging:</strong>
      <ul
        style={{ paddingLeft: "20px", margin: "5px 0 0 0", fontSize: "12px" }}
      >
        <li>What will guests do?</li>
        <li>Is there a specific vibe or atmosphere?</li>
        <li>What makes this experience unique?</li>
        <li>Who is your host (you)?</li>
      </ul>
    </div>
  );

  return (
    <ConfigProvider theme={theme}>
      <StepHeader>
        <PageTitle>The Experience</PageTitle>
        <StepDescription>
          Showcase what makes your experience unique. Great photos and a
          compelling story help guests imagine themselves there.
        </StepDescription>
      </StepHeader>

      <StyledForm
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFieldsChange={handleFieldsChange}
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
              <Sparkles size={16} />
              Experience Title
            </FormLabel>
            <HelpText>
              <Info size={14} />
              Catchy and descriptive. e.g., "Secret Jazz Club & Cocktails" or
              "Sunset Kayak Tour".
            </HelpText>
            <Form.Item
              name="title"
              rules={[
                { required: true, message: "Please enter a title" },
                { min: 5, message: "Title must be at least 5 characters" },
                { max: 100, message: "Title cannot exceed 100 characters" },
              ]}
            >
              <StyledInput
                width={true}
                placeholder="e.g., Hidden Street Art Walk"
                size="large"
              />
            </Form.Item>
          </FormGroup>

          <FieldDivider />

          <FormGroup>
            <FormLabel>
              {" "}
              <Tent size={16} /> What you'll do (Description){" "}
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
              Describe the itinerary, the atmosphere, and what's included. Help
              guests understand why they should book this experience.
            </HelpText>
            <Form.Item
              name="description"
              rules={[
                { required: true, message: "Please enter a description" },
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
              <StyledTextArea
                placeholder="We'll meet at... Then we'll explore..."
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
            Gallery
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
              Photos (2-10 required)
            </FormLabel>
            <HelpText>
              <Info size={14} />
              High-quality photos are the #1 way to get bookings. Show people
              having fun, the environment, and details.
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
                      <ImagePreview src={image.url} alt={`Experience image`} />
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
                          Drag or click
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
            Categories & Tags
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
              Primary Category
            </FormLabel>
            <HelpText>
              <Info size={14} />
              What type of experience is this?
            </HelpText>
            <Form.Item
              name="category"
              rules={[{ required: true, message: "Please select a category" }]}
            >
              <StyledSelect
                placeholder="Select category"
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

          <SubcategorySelect
            form={form}
            categoryOptions={categoryOptions}
            loadingCategories={loadingCategories}
          />

          <FormGroup>
            <FormLabel>
              <Hash size={16} />
              Features & Highlights
            </FormLabel>
            <HelpText>
              <Info size={14} />
              What's included? What's the vibe? Select matching tags or add your
              own.
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
                placeholder="Select tags..."
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
