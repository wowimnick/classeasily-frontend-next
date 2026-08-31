import React, { useState, useMemo } from "react";
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
import { businessService } from "@/services/apiService";
import { formatDistanceToNow } from "date-fns";

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

/* ─── Component ──────────────────────────────────────────────────── */

const GeneralSettingsTab = ({ form, logoUrl, setLogoUrl, setLogoFile, isMobile, onFieldBlur, onFieldChange, onLogoRemove, instagramMeta, onInstagramSyncComplete }) => {
  const [igSyncLoading, setIgSyncLoading] = useState(false);
  const socialInstagram = Form.useWatch("social_instagram", form);

  const igHint = useMemo(() => {
    if (!socialInstagram || !String(socialInstagram).trim()) return null;
    const st = instagramMeta?.status;
    const n = instagramMeta?.followerCount;
    const synced = instagramMeta?.syncedAt;
    if (st === "private") {
      return "This Instagram profile is private — follower count can’t be shown.";
    }
    if (st === "not_found") {
      return "We couldn’t load this Instagram profile. Double-check the URL.";
    }
    if (st === "error") {
      return "Last sync failed. Try Refresh, or try again later.";
    }
    if (n != null && Number(n) > 0 && synced) {
      try {
        const label = new Intl.NumberFormat("en-US", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(Number(n));
        const when = formatDistanceToNow(new Date(synced), { addSuffix: true });
        return `Last synced: ${label} followers · ${when}`;
      } catch {
        return `Last synced ${Number(n).toLocaleString("en-US")} followers.`;
      }
    }
    if (st === "pending" || !synced) {
      return "Follower count appears after sync. Save your link or tap Refresh.";
    }
    return null;
  }, [socialInstagram, instagramMeta]);

  const handleIgRefresh = async () => {
    setIgSyncLoading(true);
    try {
      const r = await businessService.syncInstagramFollowers();
      if (r.success) {
        message.success("Follower sync started. This page will update in a moment.");
        window.setTimeout(() => onInstagramSyncComplete?.(), 12000);
      } else {
        message.error(
          typeof r.error === "string" ? r.error : "Could not start follower sync",
        );
      }
    } catch {
      message.error("Could not start follower sync");
    } finally {
      setIgSyncLoading(false);
    }
  };

  const showIgTools = Boolean(socialInstagram && String(socialInstagram).trim());
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
              <LogoDesc>Min 200×100 px, max 10 MB (JPG, PNG, WEBP, HEIC). Upload an image — it will be hosted on our servers and used across your profile and emails.</LogoDesc>
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
                    onClick={() => { setLogoUrl(""); setLogoFile(null); onLogoRemove?.(); }}
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
                <Input placeholder="e.g., Elite Dance Academy" onBlur={() => onFieldBlur?.("businessName")} />
              </Form.Item>
            )}

            <FieldGrid>
              {field(
                "Business type",
                <Type />,
                "Best describes your organization",
                <Form.Item name="businessType" rules={[{ required: true, message: "Required" }]}>
                  <StyledSelect
                    placeholder="Select type"
                    onBlur={() => onFieldBlur?.("businessType")}
                    onChange={(val) => onFieldChange?.("businessType", val)}
                  >
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
                  <Input placeholder="contact@yourbusiness.com" onBlur={() => onFieldBlur?.("studentContactEmail")} />
                </Form.Item>
              )}
            </FieldGrid>
          </SectionBody>
        </SectionCard>

        {/* TODO(saas): listing copy still feeds widget/emails */}
        <SectionCard>
          <SectionHeader>
            <SectionIconBox><User size={16} /></SectionIconBox>
            <SectionTitleBlock>
              <SectionTitle>Business Profile</SectionTitle>
              <SectionSubtitle>Client-facing contact details</SectionSubtitle>
            </SectionTitleBlock>
          </SectionHeader>

          <SectionBody>
            <FieldGrid>
              {field(
                "Business phone",
                <Phone />,
                "Primary phone for customer contact",
                <Form.Item name="studentContactPhone" rules={[{ required: true, message: "Phone required" }, { validator: validatePhoneNumber("CA") }]}>
                  <Input placeholder="(555) 123-4567" onBlur={() => onFieldBlur?.("studentContactPhone")} />
                </Form.Item>
              )}

              {field(
                "Website (optional)",
                <Globe />,
                "Link to your official website",
                <Form.Item name="website" rules={[{ validator: validateUrl }]} normalize={normalizeUrl}>
                  <Input placeholder="www.yourbusiness.com" onBlur={() => onFieldBlur?.("website")} />
                </Form.Item>
              )}
            </FieldGrid>

            {field(
              "Business description",
              <Info />,
              "50–750 characters. Highlight your key offerings.",
              <Form.Item name="businessDescription" rules={[{ required: true, message: "Description required" }, { min: 50, message: "Min 50 characters" }, { max: 750, message: "Max 750 characters" }]}>
                <TextArea rows={4} placeholder="Tell customers about your business…" maxLength={750} showCount onBlur={() => onFieldBlur?.("businessDescription")} />
              </Form.Item>
            )}

            <FieldGrid>
              {field(
                "Preferred contact",
                <Users />,
                "How customers should primarily reach you",
                <Form.Item name="preferredContact" rules={[{ required: true, message: "Required" }]}>
                  <StyledSelect
                    placeholder="Select method"
                    onBlur={() => onFieldBlur?.("preferredContact")}
                    onChange={(val) => onFieldChange?.("preferredContact", val)}
                  >
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
                  <InputNumber placeholder="e.g., 2010" style={{ width: "100%" }} onBlur={() => onFieldBlur?.("founding_year")} />
                </Form.Item>
              )}
            </FieldGrid>
          </SectionBody>
        </SectionCard>

        <SectionCard>
          <SectionHeader>
            <SectionIconBox><AtSign size={16} /></SectionIconBox>
            <SectionTitleBlock>
              <SectionTitle>Social links</SectionTitle>
              <SectionSubtitle>Optional profiles shown on your business communications</SectionSubtitle>
            </SectionTitleBlock>
          </SectionHeader>

          <SectionBody>
            <FieldGrid>
              {field(
                "Facebook (optional)",
                <ExternalLink />,
                "facebook.com/yourpage",
                <Form.Item name="social_facebook" rules={[{ validator: validateSocialUrl("facebook") }]} normalize={normalizeUrl}>
                  <Input placeholder="facebook.com/yourbusiness" onBlur={() => onFieldBlur?.("social_facebook")} />
                </Form.Item>
              )}
              {field(
                "Instagram (optional)",
                <ExternalLink />,
                "instagram.com/yourprofile",
                <Form.Item name="social_instagram" rules={[{ validator: validateSocialUrl("instagram") }]} normalize={normalizeUrl}>
                  <Input placeholder="instagram.com/yourbusiness" onBlur={() => onFieldBlur?.("social_instagram")} />
                </Form.Item>
              )}
            </FieldGrid>

            {showIgTools ? (
              <div style={{ marginTop: 4, marginBottom: 12 }}>
                {igHint ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginBottom: 8,
                      lineHeight: 1.45,
                    }}
                  >
                    {igHint}
                  </div>
                ) : null}
                <Button
                  type="default"
                  size="small"
                  loading={igSyncLoading}
                  onClick={handleIgRefresh}
                >
                  Refresh follower count
                </Button>
              </div>
            ) : null}

            <FieldGrid>
              {field(
                "X / Twitter (optional)",
                <ExternalLink />,
                "x.com/yourhandle",
                <Form.Item name="social_twitter" rules={[{ validator: validateSocialUrl("twitter") }]} normalize={normalizeUrl}>
                  <Input placeholder="x.com/yourbusiness" onBlur={() => onFieldBlur?.("social_twitter")} />
                </Form.Item>
              )}
              {field(
                "LinkedIn (optional)",
                <ExternalLink />,
                "linkedin.com/company/yourcompany",
                <Form.Item name="social_linkedin" rules={[{ validator: validateSocialUrl("linkedin") }]} normalize={normalizeUrl}>
                  <Input placeholder="linkedin.com/company/yourbusiness" onBlur={() => onFieldBlur?.("social_linkedin")} />
                </Form.Item>
              )}
            </FieldGrid>
          </SectionBody>
        </SectionCard>

      </Form>
    </ThemeProvider>
  );
};

export default GeneralSettingsTab;
