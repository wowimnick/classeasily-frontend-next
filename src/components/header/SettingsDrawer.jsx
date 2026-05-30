import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  Select,
  ConfigProvider,
  Tabs,
  Typography,
} from "antd";
import message from "@/lib/message";
import {
  User,
  Lock,
  X,
  Plus,
  Info,
  Save,
} from "lucide-react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import styled, { ThemeProvider } from "styled-components";
import { motion } from "framer-motion";
import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";

import { useAuth } from "@/lib/auth-client";
import { useAuthModal } from "@/context/AuthContext";
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";
import { theme } from "@/components/theme";
import { uploadService } from "@/services/apiService";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);

const { Title } = Typography;

// --- Styled Components (Matched to ClassEditDrawer) ---

const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 85%;
  max-height: 85vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;

const DesktopDrawerContent = styled(Drawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid ${(props) => props.theme.colorBorderSecondary};
  background-color: white;
  flex-shrink: 0;
`;

const DrawerTitle = styled(Title)`
  margin: 0 !important;
  font-size: 20px !important;
  font-weight: 600 !important;
`;

const CloseButton = styled(Button)`
  padding: 8px;
  height: auto;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: ${(props) => props.theme.colorBgTextHover};
  }
`;

const DrawerContentWrapper = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
`;

const DrawerFooter = styled.div`
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid ${(props) => props.theme.colorBorderSecondary};
  background: white;
  flex-shrink: 0;
`;

const StyledTabs = styled(Tabs)`
  height: 100%;
  display: flex;
  flex-direction: column;

  .ant-tabs-nav {
    margin: 0 !important;
    padding: 0 16px;
    background: white;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .ant-tabs-tab {
    padding: 12px 16px !important;
    font-weight: 500;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    
    svg {
      width: 16px;
      height: 16px;
    }
  }

  .ant-tabs-content-holder {
    flex: 1;
    background: #f8fafc;
    overflow-y: auto;
  }

  .ant-tabs-tabpane {
    height: 100%;
    padding: 0;
  }
`;

const TabContentWrapper = styled.div`
  padding: 24px;
  max-width: 100%;
`;

const FormSection = styled(motion.div)`
  background: white;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid ${(props) => props.theme.colorBorderSecondary};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
`;

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 20px;
  }
  .ant-form-item-label label {
    font-size: 14px;
    font-weight: 500;
    color: ${(props) => props.theme.colorText};
  }
`;

const ErrorMessage = styled.div`
  margin-bottom: 16px;
  padding: 12px 16px;
  background-color: #fef2f2;
  border: 1px solid ${(props) => props.theme.colorBorderSecondary};
  border-radius: 8px;
  color: ${(props) => props.theme.colorError};
  font-size: 14px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 48px;
`;

// --- Helpers ---

const timezones = (() => {
  try {
    if (typeof Intl !== "undefined" && Intl.supportedValuesOf) {
      const allTimezones = Intl.supportedValuesOf("timeZone");
      const filteredTimezones = allTimezones.filter(
        (tz) => tz.includes("/") || tz === "UTC" || tz === "GMT"
      );
      const now = new Date();
      return filteredTimezones
        .map((tz) => {
          try {
            const offsetString = new Intl.DateTimeFormat("en", {
              timeZone: tz,
              timeZoneName: "longOffset",
            })
              .formatToParts(now)
              .find((part) => part.type === "timeZoneName")?.value;
            const displayName = tz.replace(/_/g, " ").split("/").pop();
            const region = tz.includes("/")
              ? tz.split("/")[0].replace(/_/g, " ")
              : "";
            return {
              value: tz,
              label: `${offsetString} - ${displayName}${
                region ? ` (${region})` : ""
              }`,
            };
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => a.label.localeCompare(b.label));
    } else {
      throw new Error("Intl API not supported");
    }
  } catch (e) {
    return [
      { value: "UTC", label: "GMT+0:00 - UTC" },
      { value: "America/New_York", label: "GMT-4:00 - New York (America)" },
      { value: "Europe/London", label: "GMT+1:00 - London (Europe)" },
    ].sort((a, b) => a.label.localeCompare(b.label));
  }
})();

const SettingsModal = ({ open, onClose }) => {
  const { user: currentUser, isInitialized, updateUserDetails } = useAuth();
  const { openForgotPasswordModal } = useAuthModal();
  const initialLoading = !isInitialized;

  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("profile");
  const [isMobile, setIsMobile] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);
  const [stagedAvatarFile, setStagedAvatarFile] = useState(null);
  const [isAvatarMarkedForRemoval, setIsAvatarMarkedForRemoval] = useState(false);

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!shouldRender) return;

    if (open && currentUser && !initialLoading) {
      form.setFieldsValue({
        first_name: currentUser.first_name || "",
        last_name: currentUser.last_name || "",
        email: currentUser.email || "",
        username: currentUser.username || "",
        bio: currentUser.bio || "",
        phone_number: currentUser.phone_number || "",
        user_timezone: currentUser.user_timezone || "UTC",
      });
      setPreviewImage(currentUser.avatar_medium_url || null);
      setStagedAvatarFile(null);
      setIsAvatarMarkedForRemoval(false);
      setError(null);
      if (!activeTab) setActiveTab("profile");
    } else if (!open) {
      form.resetFields();
      setPreviewImage(null);
      setStagedAvatarFile(null);
      setIsAvatarMarkedForRemoval(false);
      setError(null);
      setIsSubmitting(false);
      setActiveTab("profile");
    }
  }, [currentUser, form, open, initialLoading, shouldRender, activeTab]);

  const handleAvatarChange = useCallback(async (info) => {
    const file = info.file?.originFileObj || info.file;
    if (!file) return;

    const fileExtension = file.name.toLowerCase().split(".").pop();
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heic",
      "image/heif",
    ];
    if (!allowedTypes.includes(file.type) && !["heic", "heif"].includes(fileExtension)) {
      message.error("Invalid file type.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      message.error("Image must be smaller than 10MB!");
      return;
    }

    try {
      let processedFile = file;
      const isHeic = file.type.includes("heic") || file.type.includes("heif") || ["heic", "heif"].includes(fileExtension);

      if (isHeic) {
        message.loading({ content: "Converting image...", key: "heic", duration: 0 });
        const { default: heic2any } = await import("heic2any");
        const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
        processedFile = new File([convertedBlob], file.name.replace(/\.(heic|heif)$/i, ".jpeg"), { type: "image/jpeg" });
        message.destroy("heic");
      }

      setStagedAvatarFile(processedFile);
      setIsAvatarMarkedForRemoval(false);

      const reader = new FileReader();
      reader.readAsDataURL(processedFile);
      reader.onload = () => setPreviewImage(reader.result);
    } catch (err) {
      message.destroy("heic");
      message.error("Failed to process image.");
    }
  }, []);

  const handleRemoveAvatarClick = useCallback(() => {
    setPreviewImage(null);
    setStagedAvatarFile(null);
    setIsAvatarMarkedForRemoval(true);
    message.info("Avatar marked for removal.");
  }, []);

  const onFinish = useCallback(
    async (values) => {
      setIsSubmitting(true);
      setError(null);
      const payload = { ...values };
      let localAvatarUrlForOptimisticUpdate;

      try {
        if (stagedAvatarFile) {
          const uploadResult = await uploadService.uploadFile(stagedAvatarFile, "avatar");
          if (uploadResult.success) {
            payload.avatar = uploadResult.s3_key;
            localAvatarUrlForOptimisticUpdate = previewImage;
          } else {
            throw new Error(uploadResult.error || "Image upload failed.");
          }
        } else if (isAvatarMarkedForRemoval) {
          payload.avatar = null;
          localAvatarUrlForOptimisticUpdate = null;
        }

        await updateUserDetails({ payload, localAvatarUrl: localAvatarUrlForOptimisticUpdate });
        message.success("Profile updated successfully!");
        onClose();
      } catch (e) {
        setError(e.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onClose, stagedAvatarFile, isAvatarMarkedForRemoval, previewImage, updateUserDetails]
  );

  const onFinishFailed = (errorInfo) => {
    setError("Please check highlighted fields.");
    setActiveTab("profile");
  };

  const handleChangePassword = () => {
    onClose();
    openForgotPasswordModal();
  };

  const renderDrawerContent = () => (
    <>
      <DrawerHeader>
        <DrawerTitle level={4}>Account Settings</DrawerTitle>
        <CloseButton onClick={onClose} disabled={isSubmitting}>
          <X size={20} />
        </CloseButton>
      </DrawerHeader>

      <DrawerContentWrapper>
        {initialLoading ? (
          <LoadingContainer>
            <GlobalLoaderWithInlineStyles />
          </LoadingContainer>
        ) : (
          <StyledForm
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            theme={theme.token}
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <StyledTabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  label: "Profile",
                  key: "profile",
                  icon: <User />,
                  children: (
                    <TabContentWrapper>
                      {error && <ErrorMessage theme={theme.token}>{error}</ErrorMessage>}
                      <FormSection
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        theme={theme.token}
                      >
                        <Form.Item
                          label="Profile Picture"
                          tooltip={{
                            title: "Max 10MB. Standard formats supported.",
                            icon: <Info size={14} />,
                          }}
                        >
                          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                            <Upload
                              name="avatar_upload"
                              listType="picture-card"
                              showUploadList={false}
                              beforeUpload={() => false}
                              onChange={handleAvatarChange}
                              disabled={isSubmitting}
                            >
                              {previewImage ? (
                                <img
                                  src={previewImage}
                                  alt="Avatar"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                  }}
                                />
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                  <Plus size={20} />
                                  <span style={{ marginTop: 8 }}>Upload</span>
                                </div>
                              )}
                            </Upload>
                            {previewImage && !isSubmitting && (
                              <Button onClick={handleRemoveAvatarClick} danger>
                                Remove
                              </Button>
                            )}
                          </div>
                        </Form.Item>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                          <Form.Item
                            name="first_name"
                            label="First Name"
                            rules={[{ required: true, message: "Required" }]}
                          >
                            <Input placeholder="First name" />
                          </Form.Item>
                          <Form.Item
                            name="last_name"
                            label="Last Name"
                            rules={[{ required: true, message: "Required" }]}
                          >
                            <Input placeholder="Last name" />
                          </Form.Item>
                        </div>

                        <Form.Item label="Email">
                          <Input value={currentUser?.email} readOnly disabled />
                        </Form.Item>

                        <Form.Item
                          name="user_timezone"
                          label="Timezone"
                          rules={[{ required: true, message: "Required" }]}
                        >
                          <Select
                            showSearch
                            placeholder="Select timezone"
                            optionFilterProp="label"
                            options={timezones}
                          />
                        </Form.Item>

                        <Form.Item name="phone_number" label="Phone Number">
                          <Input placeholder="Enter phone number (optional)" />
                        </Form.Item>
                      </FormSection>
                    </TabContentWrapper>
                  ),
                },
                {
                  label: "Security",
                  key: "security",
                  icon: <Lock />,
                  children: (
                    <TabContentWrapper>
                      <FormSection
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        theme={theme.token}
                      >
                        <Form.Item label="Password Management">
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>
                              Update your password securely. You will be logged out after changing your password.
                            </div>
                            <Button onClick={handleChangePassword} style={{ width: "fit-content" }}>
                              Change Password
                            </Button>
                          </div>
                        </Form.Item>
                      </FormSection>
                    </TabContentWrapper>
                  ),
                },
              ]}
            />
          </StyledForm>
        )}
      </DrawerContentWrapper>

      <DrawerFooter theme={theme.token}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={() => form.submit()}
          type="primary"
          icon={<Save size={16} />}
          loading={isSubmitting}
          disabled={initialLoading || isSubmitting}
          key={`btn-${isSubmitting}`}>
          Save Changes
        </Button>
      </DrawerFooter>
    </>
  );

  if (!shouldRender) return null;

  return (
    <ConfigProvider theme={theme}>
      <ThemeProvider theme={theme.token}>
        <Drawer.Root
          open={open}
          onOpenChange={(isOpen) => {
            if (!isOpen) onClose();
          }}
          direction={isMobile ? "bottom" : "right"}
          dismissible
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            {isMobile ? (
              <StyledDrawerContent>
                <DrawerHandle />
                {renderDrawerContent()}
              </StyledDrawerContent>
            ) : (
              <DesktopDrawerContent>
                {renderDrawerContent()}
              </DesktopDrawerContent>
            )}
          </Drawer.Portal>
        </Drawer.Root>
      </ThemeProvider>
    </ConfigProvider>
  );
};

export default SettingsModal;