import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Menu,
  DatePicker,
  Upload,
  Select,
  ConfigProvider,
  Tooltip,
} from "antd";
import message from "@/lib/message";
import {
  UserOutlined,
  LockOutlined,
  PlusOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import heic2any from "heic2any";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import styled, { ThemeProvider } from "styled-components";
import { motion } from "framer-motion";
import { Drawer } from "vaul";

import { useAuth } from "@/lib/auth-client";
import { useAuthModal } from "@/context/AuthContext";
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";
import { theme } from "@/components/theme";
import { uploadService } from "@/services/apiService";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);

const { TextArea } = Input;

// Vaul Drawer Styles - Mobile (Bottom)
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
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

// Vaul Drawer Styles - Desktop (Right Side)
const DesktopDrawerContent = styled(Drawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: 600px;
  display: flex;
`;

const DesktopDrawerInner = styled.div`
  background: white;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
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
  flex-shrink: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  border-radius: 16px 16px 0 0;
`;

const DrawerTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  text-align: center;
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

const DrawerFooter = styled.div`
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: white;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-radius: 0 0 16px 16px;
`;

const ScrollableMenu = styled(Menu)`
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 24px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 16px;
  border: none;
  width: fit-content;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
  .ant-menu-item {
    display: inline-flex;
    align-items: center;
    margin: 0 4px !important;
    padding: 12px 14px;
    border-radius: 12px;
    transition: none;
    font-weight: 500;
    font-size: 14px;
    line-height: 1.5;
    .anticon {
      margin-right: 8px;
      font-size: 16px;
      transition: all 0.3s ease;
    }
    &:hover {
      color: #ff385c;
      background: rgba(255, 56, 92, 0.08);
    }
    &.ant-menu-item-selected {
      background: #ff385c;
      border-radius: 12px;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 56, 92, 0.2);
      &:hover {
        background: #e0000c;
      }
      .anticon {
        color: white;
      }
    }
    &::after {
      display: none;
    }
  }
`;

const ErrorMessage = styled.div`
  margin-bottom: ${({ theme }) => theme.margin}px;
  padding: 12px ${({ theme }) => theme.margin}px;
  background-color: #fef2f2;
  border: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  color: ${({ theme }) => theme.colorError};
  font-size: ${({ theme }) => theme.fontSize}px;
`;

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 20px;
  }
  .ant-form-item-label label {
    font-size: ${({ theme }) => theme.fontSize - 1}px;
    font-weight: 500;
    color: ${({ theme }) => theme.colorText};
    &::after {
      display: none;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 48px;
`;

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
    console.error("Error generating timezone list, using fallback:", e);
    return [
      { value: "UTC", label: "GMT+0:00 - UTC" },
      { value: "America/New_York", label: "GMT-4:00 - New York (America)" },
      { value: "America/Chicago", label: "GMT-5:00 - Chicago (America)" },
      { value: "America/Denver", label: "GMT-6:00 - Denver (America)" },
      {
        value: "America/Los_Angeles",
        label: "GMT-7:00 - Los Angeles (America)",
      },
      { value: "Europe/London", label: "GMT+1:00 - London (Europe)" },
      { value: "Europe/Paris", label: "GMT+2:00 - Paris (Europe)" },
      { value: "Asia/Tokyo", label: "GMT+9:00 - Tokyo (Asia)" },
    ].sort((a, b) => a.label.localeCompare(b.label));
  }
})();

const SettingsModal = ({ open, onClose }) => {
  const { user: currentUser, isInitialized, updateUserDetails } = useAuth();
  const { openForgotPasswordModal } = useAuthModal();
  const initialLoading = !isInitialized;

  const [form] = Form.useForm();
  const [selectedMenu, setSelectedMenu] = useState("profile");
  const [isMobile, setIsMobile] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);
  const [stagedAvatarFile, setStagedAvatarFile] = useState(null);
  const [isAvatarMarkedForRemoval, setIsAvatarMarkedForRemoval] =
    useState(false);

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State to delay unmounting for exit animation
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle delayed unmounting for exit animation
  useEffect(() => {
    if (open) {
      setShouldRender(true);
    } else {
      // Delay unmounting to allow Vaul's exit animation to complete
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const menuItems = useMemo(
    () => [
      { key: "profile", icon: <UserOutlined />, label: "Profile" },
      { key: "security", icon: <LockOutlined />, label: "Security" },
    ],
    []
  );

  useEffect(() => {
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
      if (!selectedMenu) setSelectedMenu("profile");
    } else if (!open) {
      form.resetFields();
      setPreviewImage(null);
      setStagedAvatarFile(null);
      setIsAvatarMarkedForRemoval(false);
      setError(null);
      setIsSubmitting(false);
    }
  }, [currentUser, form, open, initialLoading, selectedMenu]);

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
    const allowedExtensions = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "heic",
      "heif",
    ];
    const isValidType =
      allowedTypes.includes(file.type) ||
      allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      message.error(
        "Invalid file type. Please use JPG, PNG, GIF, WEBP, or HEIC."
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      message.error("Image must be smaller than 10MB!");
      return;
    }

    try {
      let processedFile = file;
      const isHeic =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        ["heic", "heif"].includes(fileExtension);

      if (isHeic) {
        message.loading({
          content: "Converting HEIC image...",
          key: "heicConvertAvatar",
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
        message.destroy("heicConvertAvatar");
        message.success("HEIC image converted successfully!");
      }

      setStagedAvatarFile(processedFile);
      setIsAvatarMarkedForRemoval(false);

      const reader = new FileReader();
      reader.readAsDataURL(processedFile);
      reader.onload = () => setPreviewImage(reader.result);
    } catch (error) {
      message.destroy("heicConvertAvatar");
      console.error("HEIC conversion failed:", error);
      message.error(
        "Failed to process HEIC image. Please try a different format."
      );
    }
  }, []);

  const handleRemoveAvatarClick = useCallback(() => {
    setPreviewImage(null);
    setStagedAvatarFile(null);
    setIsAvatarMarkedForRemoval(true);
    message.info("Avatar marked for removal. Save changes to confirm.");
  }, []);

  const onFinish = useCallback(
    async (values) => {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        ...values,
      };
      let localAvatarUrlForOptimisticUpdate;

      try {
        if (stagedAvatarFile) {
          const uploadResult = await uploadService.uploadFile(
            stagedAvatarFile,
            "avatar"
          );
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

        await updateUserDetails({
          payload,
          localAvatarUrl: localAvatarUrlForOptimisticUpdate,
        });
        message.success("Profile updated successfully!");
        onClose();
      } catch (e) {
        setError(e.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      onClose,
      stagedAvatarFile,
      isAvatarMarkedForRemoval,
      previewImage,
      updateUserDetails,
    ]
  );

  const onFinishFailed = (errorInfo) => {
    setError("Please check highlighted fields.");
    if (errorInfo.errorFields.length > 0) {
      const fieldName = errorInfo.errorFields[0].name[0];
      setSelectedMenu("profile");
      setTimeout(() => form.scrollToField(fieldName), 100);
    }
  };

  const handleChangePassword = () => {
    onClose();
    openForgotPasswordModal();
  };

  const renderContent = () => {
    const motionProps = {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
    };
    switch (selectedMenu) {
      case "profile":
        return (
          <motion.div key="profile" {...motionProps}>
            <Form.Item
              label="Profile Picture"
              tooltip={{
                title: "Max 10MB. JPG, PNG, GIF, WEBP, HEIC formats supported.",
                icon: <InfoCircleOutlined />,
              }}
            >
              <Upload
                name="avatar_upload_trigger"
                listType="picture-card"
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleAvatarChange}
                accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                disabled={isSubmitting}
              >
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Avatar Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "14px",
                    }}
                  />
                ) : (
                  <div>
                    <PlusOutlined />
                    <div>Upload</div>
                  </div>
                )}
              </Upload>
              {previewImage && !isSubmitting && (
                <Button
                  size="small"
                  onClick={handleRemoveAvatarClick}
                  style={{ marginTop: "8px" }}
                  danger
                >
                  Remove Avatar
                </Button>
              )}
            </Form.Item>
            <Form.Item
              name="first_name"
              label="First Name"
              rules={[{ required: true }]}
            >
              <Input placeholder="Enter first name" />
            </Form.Item>
            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[{ required: true }]}
            >
              <Input placeholder="Enter last name" />
            </Form.Item>
            <Form.Item label="Email">
              <Input value={currentUser?.email} readOnly disabled />
            </Form.Item>
            <Form.Item
              name="user_timezone"
              label="Timezone"
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                placeholder="Select your timezone"
                optionFilterProp="label"
                options={timezones}
              />
            </Form.Item>
            <Form.Item name="phone_number" label="Phone Number">
              <Input placeholder="Enter phone number (optional)" />
            </Form.Item>
          </motion.div>
        );
      case "security":
        return (
          <motion.div key="security" {...motionProps}>
            <Form.Item label="Change Password">
              <Button onClick={handleChangePassword}>Change Password</Button>
            </Form.Item>
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Don't render until shouldRender is true
  if (!shouldRender) return null;

  // Mobile: Use Vaul Drawer (Bottom)
  if (isMobile) {
    return (
      <ConfigProvider theme={theme}>
        <ThemeProvider theme={theme.token}>
          <Drawer.Root
            open={open}
            onOpenChange={(isOpen) => {
              if (!isOpen) onClose();
            }}
            dismissible
          >
            <Drawer.Portal>
              <StyledDrawerOverlay />
              <StyledDrawerContent>
                <DrawerHandle />

                <DrawerHeader>
                  <DrawerTitle>Account Settings</DrawerTitle>
                </DrawerHeader>

                <DrawerBody>
                  {initialLoading ? (
                    <LoadingContainer>
                      <GlobalLoaderWithInlineStyles />
                    </LoadingContainer>
                  ) : (
                    <div style={{ padding: "24px" }}>
                      <ScrollableMenu
                        mode="horizontal"
                        selectedKeys={[selectedMenu]}
                        onClick={({ key }) => setSelectedMenu(key)}
                        items={menuItems}
                      />
                      {error && (
                        <ErrorMessage theme={theme.token}>{error}</ErrorMessage>
                      )}
                      <StyledForm
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                        theme={theme.token}
                      >
                        {renderContent()}
                      </StyledForm>
                    </div>
                  )}
                </DrawerBody>

                <DrawerFooter>
                  <Button onClick={onClose} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => form.submit()}
                    type="primary"
                    loading={isSubmitting}
                    disabled={initialLoading || isSubmitting}
                  >
                    Save Changes
                  </Button>
                </DrawerFooter>
              </StyledDrawerContent>
            </Drawer.Portal>
          </Drawer.Root>
        </ThemeProvider>
      </ConfigProvider>
    );
  }

  // Desktop: Use Vaul Drawer (Right Side)
  return (
    <ConfigProvider theme={theme}>
      <ThemeProvider theme={theme.token}>
        <Drawer.Root
          open={open}
          onOpenChange={(isOpen) => {
            if (!isOpen) onClose();
          }}
          direction="right"
          dismissible
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <DesktopDrawerContent
              style={{ "--initial-transform": "calc(100% + 8px)" }}
            >
              <DesktopDrawerInner>
                <DrawerHeader>
                  <DrawerTitle>Account Settings</DrawerTitle>
                </DrawerHeader>

                <DrawerBody>
                  {initialLoading ? (
                    <LoadingContainer>
                      <GlobalLoaderWithInlineStyles />
                    </LoadingContainer>
                  ) : (
                    <div style={{ padding: "24px" }}>
                      <ScrollableMenu
                        mode="horizontal"
                        selectedKeys={[selectedMenu]}
                        onClick={({ key }) => setSelectedMenu(key)}
                        items={menuItems}
                      />
                      {error && (
                        <ErrorMessage theme={theme.token}>{error}</ErrorMessage>
                      )}
                      <StyledForm
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                        theme={theme.token}
                      >
                        {renderContent()}
                      </StyledForm>
                    </div>
                  )}
                </DrawerBody>

                <DrawerFooter>
                  <Button onClick={onClose} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => form.submit()}
                    type="primary"
                    loading={isSubmitting}
                    disabled={initialLoading || isSubmitting}
                  >
                    Save Changes
                  </Button>
                </DrawerFooter>
              </DesktopDrawerInner>
            </DesktopDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      </ThemeProvider>
    </ConfigProvider>
  );
};

export default SettingsModal;
