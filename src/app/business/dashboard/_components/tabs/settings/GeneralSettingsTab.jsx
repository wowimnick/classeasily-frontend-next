// src/components/businessDashboard/settings/GeneralSettingsTab.jsx
import React from "react";
import styled, { ThemeProvider } from "styled-components";
import {
  Form,
  Input,
  Select,
  Switch,
  Button,
  Upload,
  Space,
  InputNumber,
  message,
} from "antd";
import { InfoCircleOutlined, CalendarOutlined } from "@ant-design/icons";
import {
  Building,
  Upload as UploadIcon,
  Mail,
  Phone,
  Globe,
  Type,
  Tag,
  Users,
  ExternalLink,
  Info,
  ImageIcon,
  Settings,
} from "lucide-react";
import {
  normalizeUrl,
  validateUrl,
  validateSocialUrl,
  validatePhoneNumber,
} from "./formValidators";
import {
  FormGroup,
  FormGrid,
  FormLabel,
  HelpText,
  SectionDivider,
  FormSectionCard,
} from "./BusinessSettings";
import heic2any from "heic2any";
import { theme } from "@/components/theme";

const { Option } = Select;
const { TextArea } = Input;

const BusinessLogoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  .logo-preview {
    height: 120px;
    object-fit: contain;
    border-radius: 4px;
    border: 1px solid #ddd;
    margin-bottom: 12px;
    background-color: white;
  }
  .logo-placeholder {
    width: 120px;
    height: 120px;
    background: #eee;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #aaa;
    margin-bottom: 12px;
    border: 1px solid #ddd;
  }
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    min-height: ${(props) => props.theme.token.controlHeight}px !important;
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
    border-radius: ${(props) => props.theme.token.borderRadius}px !important;
    background: ${(props) => props.theme.token.colorPrimary}15 !important;
    border: 1px solid ${(props) => props.theme.token.colorPrimary}30 !important;
    font-size: ${(props) => props.theme.token.fontSize}px !important;
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
    border-color: ${(props) =>
      props.theme.token.colorPrimaryBorderHover} !important;
  }

  &:hover .ant-select-selector {
    border-color: ${(props) => props.theme.token.colorPrimary} !important;
  }
`;

const SwitchLabelContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;
const SwitchInfo = styled.div`
  margin-right: 16px;
  .title {
    font-weight: 600;
    color: #222;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .desc {
    font-size: 13px;
    color: #717171;
  }
`;

const GeneralSettingsTab = ({
  form,
  logoUrl,
  setLogoUrl,
  setLogoFile,
  isMobile,
}) => {
  const handleLogoChange = async (file) => {
    // Check file extension for better HEIC detection
    const fileExtension = file.name.toLowerCase().split(".").pop();
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

    // Validate file type
    const isValidType =
      allowedTypes.includes(file.type) ||
      allowedExtensions.includes(fileExtension);
    if (!isValidType) {
      message.error("You can only upload JPG/PNG/WEBP/HEIC files!");
      return Upload.LIST_IGNORE;
    }

    // Check file size
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("Image must be smaller than 10MB!");
      return Upload.LIST_IGNORE;
    }

    try {
      let processedFile = file;

      // Handle HEIC conversion
      const isHeic =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        ["heic", "heif"].includes(fileExtension);

      if (isHeic) {
        message.loading({
          content: "Converting HEIC image...",
          key: "heicConvert",
          duration: 0,
        });

        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.9,
        });

        processedFile = new File(
          [convertedBlob],
          file.name.replace(/\.(heic|heif)$/i, ".jpeg"),
          { type: "image/jpeg" }
        );

        message.destroy("heicConvert");
        message.success("HEIC image converted successfully!");
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result);
        setLogoFile(processedFile);
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      message.destroy("heicConvert");
      console.error("HEIC conversion failed:", error);
      message.error(
        "Failed to process HEIC image. Please try a different format."
      );
      return Upload.LIST_IGNORE;
    }

    return false;
  };

  return (
    <ThemeProvider theme={theme}>
      <Form form={form} layout="vertical" name="generalSettingsForm">
        <FormSectionCard isDrawer={true}>
          <SectionDivider>
            <span>
              <Info size={16} /> Business Profile
            </span>
          </SectionDivider>

          <BusinessLogoWrapper>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="logo-preview" />
            ) : (
              <div className="logo-placeholder">
                <ImageIcon size={40} />
              </div>
            )}
            <Space direction="vertical" align="center">
              <Upload
                name="logo"
                showUploadList={false}
                beforeUpload={handleLogoChange}
                accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
              >
                <Button icon={<UploadIcon size={16} />}>
                  {logoUrl ? "Change Logo" : "Upload Logo"}
                </Button>
              </Upload>
              {logoUrl && (
                <Button
                  type="link"
                  danger
                  size="small"
                  onClick={() => {
                    setLogoUrl("");
                    setLogoFile(null);
                  }}
                >
                  Remove
                </Button>
              )}
            </Space>
            <HelpText style={{ justifyContent: "center", marginTop: "12px" }}>
              <InfoCircleOutlined /> Recommended: Min 200x100px, max 10MB
              (JPG/PNG/WEBP/HEIC)
            </HelpText>
          </BusinessLogoWrapper>

          <FormGroup>
            <FormLabel>
              <Building /> Business Name
            </FormLabel>
            <HelpText>
              <InfoCircleOutlined /> The official name of your business
              displayed to students.
            </HelpText>
            <Form.Item
              name="businessName"
              rules={[{ required: true, message: "Business name is required" }]}
            >
              <Input placeholder="e.g., Elite Dance Academy" />
            </Form.Item>
          </FormGroup>

          <FormGrid>
            <FormGroup>
              <FormLabel>
                <Type /> Business Type
              </FormLabel>
              <HelpText>
                <InfoCircleOutlined /> Select the type that best describes your
                business.
              </HelpText>
              <Form.Item
                name="businessType"
                rules={[
                  { required: true, message: "Business type is required" },
                ]}
              >
                <StyledSelect placeholder="Select business type">
                  <Option value="individual">Individual Teacher</Option>
                  <Option value="school">School</Option>
                  <Option value="studio">Studio</Option>
                  <Option value="academy">Academy</Option>
                  <Option value="center">Learning Center</Option>
                </StyledSelect>
              </Form.Item>
            </FormGroup>

            <FormGroup>
              <FormLabel>
                <Mail /> Business Email
              </FormLabel>
              <HelpText>
                <InfoCircleOutlined /> Primary email for student communication.
              </HelpText>
              <Form.Item
                name="studentContactEmail"
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Invalid email" },
                ]}
              >
                <Input placeholder="contact@yourbusiness.com" />
              </Form.Item>
            </FormGroup>
          </FormGrid>

          <SectionDivider>
            <span>
              <Info size={16} /> Public Details
            </span>
          </SectionDivider>

          <FormGrid>
            <FormGroup>
              <FormLabel>
                <Phone /> Business Phone
              </FormLabel>
              <HelpText>
                <InfoCircleOutlined /> Primary phone for student communication.
              </HelpText>
              <Form.Item
                name="studentContactPhone"
                rules={[
                  { required: true, message: "Phone is required" },
                  { validator: validatePhoneNumber("CA") },
                ]}
              >
                <Input placeholder="(555) 123-4567" />
              </Form.Item>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <Globe /> Website (Optional)
              </FormLabel>
              <HelpText>
                <InfoCircleOutlined /> Link to your official business website.
              </HelpText>
              <Form.Item
                name="website"
                rules={[{ validator: validateUrl }]}
                normalize={normalizeUrl}
              >
                <Input placeholder="www.yourbusiness.com" />
              </Form.Item>
            </FormGroup>
          </FormGrid>

          <FormGroup>
            <FormLabel>
              <Info /> Business Description
            </FormLabel>
            <HelpText>
              <InfoCircleOutlined /> Describe your business in 50-750
              characters. Highlight key offerings.
            </HelpText>
            <Form.Item
              name="businessDescription"
              rules={[
                { required: true, message: "Description is required" },
                { min: 50, message: "Min 50 characters" },
                { max: 750, message: "Max 750 characters" },
              ]}
            >
              <TextArea
                rows={5}
                placeholder="Tell students about your business..."
                maxLength={750}
                showCount
              />
            </Form.Item>
          </FormGroup>

          <FormGrid>
            <FormGroup>
              <FormLabel>
                <Users /> Preferred Contact
              </FormLabel>
              <HelpText>
                <InfoCircleOutlined /> How students should primarily reach you.
              </HelpText>
              <Form.Item
                name="preferredContact"
                rules={[
                  {
                    required: true,
                    message: "Please select preferred contact",
                  },
                ]}
              >
                <StyledSelect placeholder="Select method">
                  <Option value="email">Email</Option>
                  <Option value="phone">Phone</Option>
                  <Option value="text">Text</Option>
                  <Option value="both">Both Email and Phone</Option>
                </StyledSelect>
              </Form.Item>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <CalendarOutlined /> Founding Year (Optional)
              </FormLabel>
              <HelpText>
                <InfoCircleOutlined /> The year your business was established.
              </HelpText>
              <Form.Item
                name="founding_year"
                rules={[
                  { type: "integer", message: "Please enter a valid year." },
                  {
                    validator: (_, value) =>
                      value &&
                      (value < 1800 || value > new Date().getFullYear())
                        ? Promise.reject(
                            new Error(
                              `Year must be between 1800 and ${new Date().getFullYear()}`
                            )
                          )
                        : Promise.resolve(),
                  },
                ]}
              >
                <InputNumber
                  placeholder="e.g., 2010"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </FormGroup>
          </FormGrid>

          <SectionDivider>
            <span>
              <Globe size={16} /> Social & Keywords
            </span>
          </SectionDivider>

          <FormGrid>
            <FormGroup>
              <FormLabel>
                <ExternalLink /> Facebook URL (Optional)
              </FormLabel>
              <HelpText>
                <InfoCircleOutlined /> e.g., facebook.com/yourpage
              </HelpText>
              <Form.Item
                name="social_facebook"
                rules={[{ validator: validateSocialUrl("facebook") }]}
                normalize={normalizeUrl}
              >
                <Input placeholder="facebook.com/yourbusiness" />
              </Form.Item>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <ExternalLink /> Instagram URL (Optional)
              </FormLabel>
              <HelpText>
                <InfoCircleOutlined /> e.g., instagram.com/yourprofile
              </HelpText>
              <Form.Item
                name="social_instagram"
                rules={[{ validator: validateSocialUrl("instagram") }]}
                normalize={normalizeUrl}
              >
                <Input placeholder="instagram.com/yourbusiness" />
              </Form.Item>
            </FormGroup>
          </FormGrid>
          <FormGrid>
            <FormGroup>
              <FormLabel>
                <ExternalLink /> X/Twitter URL (Optional)
              </FormLabel>
              <HelpText>
                <InfoCircleOutlined /> e.g., x.com/yourhandle
              </HelpText>
              <Form.Item
                name="social_twitter"
                rules={[{ validator: validateSocialUrl("twitter") }]}
                normalize={normalizeUrl}
              >
                <Input placeholder="x.com/yourbusiness" />
              </Form.Item>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <ExternalLink /> LinkedIn URL (Optional)
              </FormLabel>
              <HelpText>
                <InfoCircleOutlined /> e.g., linkedin.com/company/yourcompany
              </HelpText>
              <Form.Item
                name="social_linkedin"
                rules={[{ validator: validateSocialUrl("linkedin") }]}
                normalize={normalizeUrl}
              >
                <Input placeholder="linkedin.com/company/yourbusiness" />
              </Form.Item>
            </FormGroup>
          </FormGrid>

          <FormGroup>
            <FormLabel>
              <Tag /> Keywords / Tags (Optional)
            </FormLabel>
            <HelpText>
              <InfoCircleOutlined size={16} /> Add keywords that describe your
              services. Press Enter to add a tag.
            </HelpText>
            <Form.Item name="tags_keywords">
              <StyledTagsSelect
                mode="tags"
                style={{ width: "100%" }}
                placeholder="e.g., Yoga, Beginner Friendly, Kids Art"
                tokenSeparators={[","]}
              />
            </Form.Item>
          </FormGroup>
        </FormSectionCard>
      </Form>
    </ThemeProvider>
  );
};

export default GeneralSettingsTab;
