import React from "react";
import styled, { ThemeProvider } from "styled-components";
import { Form, Input, Select, Button, Upload, Space, InputNumber } from "antd";
import message from "@/lib/message";
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
  User,
  AtSign,
} from "lucide-react";
import {
  normalizeUrl,
  validateUrl,
  validateSocialUrl,
  validatePhoneNumber,
} from "./formValidators";
import { theme } from "@/components/theme";

const { Option } = Select;
const { TextArea } = Input;

/* ─── Section card layout ────────────────────────────────────────── */

const SectionCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
`;

const SectionIconBox = styled.div`
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #374151;
`;

const SectionTitleBlock = styled.div``;

const SectionTitle = styled.div`
  font-size: 14.5px;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
`;

const SectionSubtitle = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 1px;
`;

const SectionBody = styled.div`
  padding: 18px 20px;
`;

/* ─── Logo area ──────────────────────────────────────────────────── */

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
`;

const LogoPreviewBox = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const LogoTextBlock = styled.div`
  flex: 1;
`;

const LogoLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
`;

const LogoDesc = styled.div`
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
`;

const LogoActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
`;

/* ─── Form grid ──────────────────────────────────────────────────── */

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 20px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

const FieldLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;

  svg {
    width: 13px;
    height: 13px;
    color: #9ca3af;
  }
`;

const FieldHint = styled.div`
  font-size: 11.5px;
  color: #9ca3af;
  margin-bottom: 6px;
`;

const FieldGroup = styled.div`
  margin-bottom: 16px;
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    border-radius: 7px !important;
  }
`;

const StyledTagsSelect = styled(Select)`
  .ant-select-selector {
    border-radius: 7px !important;
    min-height: 38px !important;
  }

  .ant-select-selection-item {
    border-radius: 5px !important;
    background: #f3f4f6 !important;
    border: 1px solid #e5e7eb !important;
    font-size: 12.5px !important;
  }

  .ant-select-selection-item-content {
    color: #374151 !important;
    font-weight: 500;
  }

  .ant-select-selection-item-remove {
    color: #9ca3af !important;
  }
`;

/* ─── Component ──────────────────────────────────────────────────── */

const GeneralSettingsTab = ({ form, logoUrl, setLogoUrl, setLogoFile, isMobile }) => {
  const handleLogoChange = async (file) => {
    const fileExtension = file.name.toLowerCase().split(".").pop();
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      message.error("You can only upload JPG/PNG/WEBP/HEIC files!");
      return Upload.LIST_IGNORE;
    }
    if (file.size / 1024 / 1024 >= 10) {
      message.error("Image must be smaller than 10MB!");
      return Upload.LIST_IGNORE;
    }

    try {
      let processedFile = file;
      const isHeic = file.type === "image/heic" || file.type === "image/heif" || ["heic", "heif"].includes(fileExtension);

      if (isHeic) {
        message.loading({ content: "Converting HEIC image…", key: "heicConvert", duration: 0 });
        const { default: heic2any } = await import("heic2any");
        const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
        processedFile = new File(
          [convertedBlob],
          file.name.replace(/\.(heic|heif)$/i, ".jpeg"),
          { type: "image/jpeg" }
        );
        message.destroy("heicConvert");
        message.success("HEIC image converted successfully!");
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result);
        setLogoFile(processedFile);
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      message.destroy("heicConvert");
      message.error("Failed to process HEIC image. Please try a different format.");
      return Upload.LIST_IGNORE;
    }

    return false;
  };

  const field = (label, icon, hint, formItem) => (
    <FieldGroup>
      <FieldLabel>
        {icon}
        {label}
      </FieldLabel>
      {hint && <FieldHint>{hint}</FieldHint>}
      {formItem}
    </FieldGroup>
  );

  return (
    <ThemeProvider theme={theme}>
      <Form form={form} layout="vertical" name="generalSettingsForm">

        {/* ── Business Profile ── */}
        <SectionCard>
          <SectionHeader>
            <SectionIconBox><Building size={16} /></SectionIconBox>
            <SectionTitleBlock>
              <SectionTitle>Business profile</SectionTitle>
              <SectionSubtitle>Core identity and contact information</SectionSubtitle>
            </SectionTitleBlock>
          </SectionHeader>

          {/* Logo upload row */}
          <LogoRow>
            <LogoPreviewBox>
              {logoUrl ? (
                <img src={logoUrl} alt="Business logo" />
              ) : (
                <ImageIcon size={24} color="#9ca3af" />
              )}
            </LogoPreviewBox>
            <LogoTextBlock>
              <LogoLabel>Business logo</LogoLabel>
              <LogoDesc>Min 200×100 px, max 10 MB (JPG, PNG, WEBP, HEIC)</LogoDesc>
              <LogoActions>
                <Upload
                  name="logo"
                  showUploadList={false}
                  beforeUpload={handleLogoChange}
                  accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
                >
                  <Button size="small" icon={<UploadIcon size={13} />}>
                    {logoUrl ? "Change" : "Upload logo"}
                  </Button>
                </Upload>
                {logoUrl && (
                  <Button
                    size="small"
                    type="text"
                    danger
                    onClick={() => { setLogoUrl(""); setLogoFile(null); }}
                  >
                    Remove
                  </Button>
                )}
              </LogoActions>
            </LogoTextBlock>
          </LogoRow>

          <SectionBody>
            {field(
              "Business name",
              <Building />,
              "Official name displayed to customers",
              <Form.Item name="businessName" rules={[{ required: true, message: "Business name is required" }]}>
                <Input placeholder="e.g., Elite Dance Academy" />
              </Form.Item>
            )}

            <FieldGrid>
              {field(
                "Business type",
                <Type />,
                "Best describes your organization",
                <Form.Item name="businessType" rules={[{ required: true, message: "Required" }]}>
                  <StyledSelect placeholder="Select type">
                    <Option value="individual">Individual Host</Option>
                    <Option value="tour-operator">Tour Operator</Option>
                    <Option value="experience-group">Experience Group</Option>
                    <Option value="venue">Venue / Studio</Option>
                    <Option value="event-organizer">Event Organizer</Option>
                  </StyledSelect>
                </Form.Item>
              )}

              {field(
                "Business email",
                <Mail />,
                "Primary email for customer contact",
                <Form.Item name="studentContactEmail" rules={[{ required: true, message: "Email required" }, { type: "email", message: "Invalid email" }]}>
                  <Input placeholder="contact@yourbusiness.com" />
                </Form.Item>
              )}
            </FieldGrid>
          </SectionBody>
        </SectionCard>

        {/* ── Public Details ── */}
        <SectionCard>
          <SectionHeader>
            <SectionIconBox><User size={16} /></SectionIconBox>
            <SectionTitleBlock>
              <SectionTitle>Public details</SectionTitle>
              <SectionSubtitle>Information visible to customers on your listing</SectionSubtitle>
            </SectionTitleBlock>
          </SectionHeader>

          <SectionBody>
            <FieldGrid>
              {field(
                "Business phone",
                <Phone />,
                "Primary phone for customer contact",
                <Form.Item name="studentContactPhone" rules={[{ required: true, message: "Phone required" }, { validator: validatePhoneNumber("CA") }]}>
                  <Input placeholder="(555) 123-4567" />
                </Form.Item>
              )}

              {field(
                "Website (optional)",
                <Globe />,
                "Link to your official website",
                <Form.Item name="website" rules={[{ validator: validateUrl }]} normalize={normalizeUrl}>
                  <Input placeholder="www.yourbusiness.com" />
                </Form.Item>
              )}
            </FieldGrid>

            {field(
              "Business description",
              <Info />,
              "50–750 characters. Highlight your key offerings.",
              <Form.Item name="businessDescription" rules={[{ required: true, message: "Description required" }, { min: 50, message: "Min 50 characters" }, { max: 750, message: "Max 750 characters" }]}>
                <TextArea rows={4} placeholder="Tell customers about your business…" maxLength={750} showCount />
              </Form.Item>
            )}

            <FieldGrid>
              {field(
                "Preferred contact",
                <Users />,
                "How customers should primarily reach you",
                <Form.Item name="preferredContact" rules={[{ required: true, message: "Required" }]}>
                  <StyledSelect placeholder="Select method">
                    <Option value="email">Email</Option>
                    <Option value="phone">Phone</Option>
                    <Option value="text">Text</Option>
                    <Option value="both">Both Email and Phone</Option>
                  </StyledSelect>
                </Form.Item>
              )}

              {field(
                "Founding year (optional)",
                <CalendarOutlined style={{ fontSize: 13, color: "#9ca3af" }} />,
                "The year your business was established",
                <Form.Item name="founding_year" rules={[{ type: "integer" }, { validator: (_, v) => v && (v < 1800 || v > new Date().getFullYear()) ? Promise.reject(new Error(`Year must be 1800–${new Date().getFullYear()}`)) : Promise.resolve() }]}>
                  <InputNumber placeholder="e.g., 2010" style={{ width: "100%" }} />
                </Form.Item>
              )}
            </FieldGrid>
          </SectionBody>
        </SectionCard>

        {/* ── Social & Keywords ── */}
        <SectionCard>
          <SectionHeader>
            <SectionIconBox><AtSign size={16} /></SectionIconBox>
            <SectionTitleBlock>
              <SectionTitle>Social & keywords</SectionTitle>
              <SectionSubtitle>Links and tags to improve discoverability</SectionSubtitle>
            </SectionTitleBlock>
          </SectionHeader>

          <SectionBody>
            <FieldGrid>
              {field(
                "Facebook (optional)",
                <ExternalLink />,
                "facebook.com/yourpage",
                <Form.Item name="social_facebook" rules={[{ validator: validateSocialUrl("facebook") }]} normalize={normalizeUrl}>
                  <Input placeholder="facebook.com/yourbusiness" />
                </Form.Item>
              )}
              {field(
                "Instagram (optional)",
                <ExternalLink />,
                "instagram.com/yourprofile",
                <Form.Item name="social_instagram" rules={[{ validator: validateSocialUrl("instagram") }]} normalize={normalizeUrl}>
                  <Input placeholder="instagram.com/yourbusiness" />
                </Form.Item>
              )}
            </FieldGrid>

            <FieldGrid>
              {field(
                "X / Twitter (optional)",
                <ExternalLink />,
                "x.com/yourhandle",
                <Form.Item name="social_twitter" rules={[{ validator: validateSocialUrl("twitter") }]} normalize={normalizeUrl}>
                  <Input placeholder="x.com/yourbusiness" />
                </Form.Item>
              )}
              {field(
                "LinkedIn (optional)",
                <ExternalLink />,
                "linkedin.com/company/yourcompany",
                <Form.Item name="social_linkedin" rules={[{ validator: validateSocialUrl("linkedin") }]} normalize={normalizeUrl}>
                  <Input placeholder="linkedin.com/company/yourbusiness" />
                </Form.Item>
              )}
            </FieldGrid>

            {field(
              "Keywords / tags (optional)",
              <Tag />,
              "Add keywords that describe your services. Press Enter to add a tag.",
              <Form.Item name="tags_keywords">
                <StyledTagsSelect
                  mode="tags"
                  style={{ width: "100%" }}
                  placeholder="e.g., Yoga, Beginner Friendly, Art"
                  tokenSeparators={[","]}
                />
              </Form.Item>
            )}
          </SectionBody>
        </SectionCard>

      </Form>
    </ThemeProvider>
  );
};

export default GeneralSettingsTab;
