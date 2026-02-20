import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  Suspense,
} from "react";
import styled, { ThemeProvider } from "styled-components";
import { Form, Button, Tabs, Grid, Typography } from 'antd';
import message from '@/lib/message';
import { Building, MapPin, Settings, X, Save } from "lucide-react";
import dayjs from "dayjs";
import "leaflet/dist/leaflet.css";
import { Drawer as VaulDrawer } from "vaul";

import { theme as appProvidedTheme } from "@/components/theme";
import { businessService, uploadService } from "@/services/apiService";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";

const GeneralSettingsTab = React.lazy(() => import("./GeneralSettingsTab"));
const LocationSettingsTab = React.lazy(() => import("./LocationSettingsTab"));
const PreferencesSettingsTab = React.lazy(() =>
  import("./PreferencesSettingsTab")
);

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

export const FormGroup = styled.div`
  margin-bottom: ${(props) => props.theme.token.marginLG}px;
  width: 100%;
`;
export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 ${(props) => props.theme.token.marginLG}px;
  @media (max-width: ${(props) => props.theme.screenMD}px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;
export const FormLabel = styled.label`
  font-weight: 600;
  color: ${(props) => props.theme.token.colorText};
  margin-bottom: ${(props) => props.theme.token.marginXS}px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  svg {
    width: 16px;
    height: 16px;
    color: ${(props) => props.theme.token.colorPrimary};
  }
`;
export const HelpText = styled.div`
  font-size: 13px;
  color: ${(props) => props.theme.token.colorTextSecondary};
  margin-top: 4px;
  margin-bottom: 8px;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    margin-top: 2px;
    color: ${(props) => props.theme.token.colorTextDisabled};
  }
`;
/* Match ClassEditDrawer SectionDivider exactly */
export const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 24px 0;
  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }
  span {
    padding: 0 1rem;
    color: #717171;
    font-weight: 600;
    font-size: 15px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    svg {
      color: ${(props) => props.theme.token.colorPrimary};
    }
  }
  @media (max-width: 768px) {
    margin: 20px 0;
  }
`;

/* Match ClassEditDrawer FormSection exactly: bordered card, padding, shadow */
export const FormSectionCard = styled.div`
  margin-bottom: 24px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  padding: 20px;
  @media (max-width: 768px) {
    margin-bottom: 20px;
    padding: 16px;
  }
`;

/* Match ClassEditDrawer: center content with max-width inside ScrollContainer */
export const FormContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

// --- Drawer shell: exact match to ClassEditDrawer ---
const StyledDrawerOverlay = styled(VaulDrawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
`;

const StyledDrawerContent = styled(VaulDrawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 95%;
  max-height: 95vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;

const DrawerHandle = styled(VaulDrawer.Handle)`
  width: 40px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DesktopDrawerContent = styled(VaulDrawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: 800px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: white;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid #e5e7eb;
  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const DrawerContentWrapper = styled.div`
  flex: 1 1 auto;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
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
    padding: 1rem;
  }
`;

const DrawerFooter = styled.div`
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  background: white;
  flex-shrink: 0;
  @media (max-width: 768px) {
    padding: 12px 16px;
    flex-direction: column-reverse;
    .ant-btn {
      width: 100%;
    }
  }
`;

const DrawerTitle = styled(Title)`
  margin: 0 !important;
  font-size: 20px !important;
  font-weight: 600 !important;
  @media (max-width: 768px) {
    font-size: 18px !important;
  }
`;

const CloseButton = styled(Button)`
  padding: 8px;
  height: auto;
  border: none;
  background: none;
  &:hover {
    background: ${(props) => props.theme.token.colorBgTextHover};
  }
`;

// Tabs: exact match to ClassEditDrawer (underline style, borders)
const StyledTabs = styled(Tabs)`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  > .ant-tabs-nav {
    margin: 0 !important;
    padding: 0 24px;
    background: white;
    flex-shrink: 0;
    border-bottom: 1px solid #e5e7eb;
  }

  > .ant-tabs-nav .ant-tabs-tab {
    font-weight: 500;
    font-size: 14px;
    color: #64748b;
  }

  > .ant-tabs-nav .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: #222222;
  }

  > .ant-tabs-nav .ant-tabs-ink-bar {
    background: #222222;
    height: 3px;
  }

  > .ant-tabs-nav .ant-tabs-tab:hover {
    color: #222222;
  }

  > .ant-tabs-content-holder {
    flex: 1;
    overflow: auto;
    background: #fff;
  }

  > .ant-tabs-content-holder > .ant-tabs-content > .ant-tabs-tabpane {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }

  @media (max-width: 768px) {
    > .ant-tabs-nav {
      padding: 0 16px;
    }
    > .ant-tabs-nav .ant-tabs-tab {
      padding: 12px 10px !important;
      font-size: 13px;
    }
  }
`;

const TabIcon = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: inherit;

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
`;

const TabLoader = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
    <GlobalLoaderWithoutInlineStyles />
  </div>
);

const BusinessSettingsContent = forwardRef(
  (
    {
      activeTabKey = "general",
      onTabChangeExternal = () => {},
      onProfileUpdate = () => {},
    },
    ref
  ) => {
    const [generalForm] = Form.useForm();
    const [locationForm] = Form.useForm();
    const [preferencesForm] = Form.useForm();
    const [currentTab, setCurrentTab] = useState(activeTabKey);
    const [loading, setLoading] = useState(true);
    const [logoUrl, setLogoUrl] = useState("");
    const [logoFile, setLogoFile] = useState(null);
    const [initialBusinessData, setInitialBusinessData] = useState(null);
    const [stripeAccountStatus, setStripeAccountStatus] = useState("unlinked");
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    useImperativeHandle(ref, () => ({
      saveChanges: handleSaveAllChanges,
    }));

    const fetchBusinessData = useCallback(async () => {
      setLoading(true);
      try {
        const response = await businessService.getMyBusinessProfile();
        if (response.success && response.data) {
          const data = response.data;
          setInitialBusinessData(data);
          setLogoUrl(data.business_image_medium_url || "");
          setStripeAccountStatus(data.stripe_account_status || "unlinked");

          generalForm.setFieldsValue({
            businessName: data.businessName,
            businessType: data.businessType,
            businessDescription: data.businessDescription,
            studentContactEmail: data.studentContactEmail,
            studentContactPhone: data.studentContactPhone,
            website: data.website || "",
            preferredContact: data.preferredContact,
            founding_year: data.founding_year,
            social_facebook: data.social_media_links?.facebook || "",
            social_instagram: data.social_media_links?.instagram || "",
            social_twitter: data.social_media_links?.twitter || "",
            social_linkedin: data.social_media_links?.linkedin || "",
            tags_keywords: data.tags_keywords || [],
          });

          locationForm.setFieldsValue({
            location: data.businessAddress,
            businessUnit: data.businessUnit,
            latitude: data.latitude,
            longitude: data.longitude,
            saltLocation: data.showExactLocation === false,
            city: data.businessCity,
            state: data.businessState,
            zipCode: data.businessZipCode,
          });

          const formattedHours = (data.businessHours || []).map((day) => ({
            ...day,
            time: [
              day.open ? dayjs(day.open, "HH:mm") : null,
              day.close ? dayjs(day.close, "HH:mm") : null,
            ],
          }));

          preferencesForm.setFieldsValue({
            businessHours:
              formattedHours.length > 0 ? formattedHours : undefined,
            business_timezone:
              data.business_timezone ||
              Intl.DateTimeFormat().resolvedOptions().timeZone,
            contact_privacy: data.contact_privacy || "on_booking",
            newBookingNotification: data.newBookingNotification !== false,
            cancellationNotification: data.cancellationNotification !== false,
            reminderNotification: data.reminderNotification !== false,
            scheduleExpiryNotification: data.scheduleExpiryNotification !== false,
            smsNotifications: data.smsNotifications === true,
          });

          if (onProfileUpdate) onProfileUpdate();
        } else {
          message.error(response.error || "Failed to load business settings");
        }
      } catch (error) {
        console.error("Fetch business data error:", error);
        message.error("An error occurred while loading settings.");
      } finally {
        setLoading(false);
      }
    }, [generalForm, locationForm, preferencesForm, onProfileUpdate]);

    useEffect(() => {
      fetchBusinessData();
    }, [fetchBusinessData]);

    useEffect(() => {
      setCurrentTab(activeTabKey);
    }, [activeTabKey]);

    useEffect(() => {
      const sectionId = sessionStorage.getItem("scrollToSection");
      if (sectionId) {
        const timer = setTimeout(() => {
          const scrollableContent = document.querySelector(
            ".ant-tabs-content-holder"
          );
          const element = document.getElementById(sectionId);
          if (element && scrollableContent) {
            const topPos = element.offsetTop;
            scrollableContent.scrollTo({
              top: topPos - 20,
              behavior: "smooth",
            });
            sessionStorage.removeItem("scrollToSection");
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [currentTab]);

    const handleSaveAllChanges = async () => {
      try {
        const [generalValues, locationValues, preferencesValues] =
          await Promise.all([
            generalForm.validateFields(),
            locationForm.validateFields(),
            preferencesForm.validateFields(),
          ]);

        let businessImageS3Key = null;
        if (logoFile) {
          const uploadResult = await uploadService.uploadFile(
            logoFile,
            "business_image"
          );
          if (uploadResult.success) {
            businessImageS3Key = uploadResult.s3_key;
          } else {
            message.error(`Logo upload failed: ${uploadResult.error}`);
            return;
          }
        }

        const masterFormData = new FormData();

        masterFormData.append("businessName", generalValues.businessName);
        masterFormData.append("businessType", generalValues.businessType);
        masterFormData.append(
          "businessDescription",
          generalValues.businessDescription
        );
        masterFormData.append(
          "studentContactEmail",
          generalValues.studentContactEmail
        );
        masterFormData.append(
          "studentContactPhone",
          generalValues.studentContactPhone
        );
        if (generalValues.website)
          masterFormData.append("website", generalValues.website);
        if (generalValues.preferredContact)
          masterFormData.append(
            "preferredContact",
            generalValues.preferredContact
          );
        if (generalValues.founding_year != null)
          masterFormData.append(
            "founding_year",
            generalValues.founding_year.toString()
          );

        const socialMediaLinks = {
          facebook: generalValues.social_facebook || "",
          instagram: generalValues.social_instagram || "",
          twitter: generalValues.social_twitter || "",
          linkedin: generalValues.social_linkedin || "",
        };
        masterFormData.append(
          "social_media_links",
          JSON.stringify(socialMediaLinks)
        );
        masterFormData.append(
          "tags_keywords",
          JSON.stringify(generalValues.tags_keywords || [])
        );

        if (businessImageS3Key) {
          masterFormData.append("businessImage", businessImageS3Key);
        } else if (
          logoUrl === "" &&
          initialBusinessData?.business_image_medium_url
        ) {
          masterFormData.append("businessImage", "");
        }

        masterFormData.append("businessAddress", locationValues.location);
        if (locationValues.businessUnit)
          masterFormData.append("businessUnit", locationValues.businessUnit);
        if (locationValues.city)
          masterFormData.append("businessCity", locationValues.city);
        if (locationValues.state)
          masterFormData.append("businessState", locationValues.state);
        if (locationValues.zipCode)
          masterFormData.append("businessZipCode", locationValues.zipCode);

        if (locationValues.latitude && locationValues.longitude) {
          masterFormData.append("latitude", locationValues.latitude.toString());
          masterFormData.append(
            "longitude",
            locationValues.longitude.toString()
          );
        }
        masterFormData.append(
          "showExactLocation",
          String(!locationValues.saltLocation)
        );

        if (
          preferencesValues.businessHours &&
          preferencesValues.businessHours.length > 0
        ) {
          const formattedHours = preferencesValues.businessHours.map((day) => ({
            day: day.day,
            isOpen: day.isOpen,
            open:
              day.isOpen && day.time && day.time[0]
                ? day.time[0].format("HH:mm")
                : null,
            close:
              day.isOpen && day.time && day.time[1]
                ? day.time[1].format("HH:mm")
                : null,
          }));
          masterFormData.append(
            "businessHours",
            JSON.stringify(formattedHours)
          );
        }
        masterFormData.append(
          "business_timezone",
          preferencesValues.business_timezone
        );
        masterFormData.append(
          "contact_privacy",
          preferencesValues.contact_privacy
        );
        masterFormData.append(
          "newBookingNotification",
          String(preferencesValues.newBookingNotification)
        );
        masterFormData.append(
          "cancellationNotification",
          String(preferencesValues.cancellationNotification)
        );
        masterFormData.append(
          "reminderNotification",
          String(preferencesValues.reminderNotification)
        );
        masterFormData.append(
          "scheduleExpiryNotification",
          String(preferencesValues.scheduleExpiryNotification)
        );
        masterFormData.append(
          "smsNotifications",
          String(preferencesValues.smsNotifications)
        );

        const response = await businessService.updateMyBusinessProfile(
          masterFormData
        );

        if (response.success) {
          message.success("All settings updated successfully");
          setLogoFile(null);
          await fetchBusinessData();
          return true;
        } else {
          message.error(
            response.error?.detail ||
              response.error ||
              "Failed to save changes."
          );
          return false;
        }
      } catch (errorInfo) {
        message.error("Please correct the highlighted errors before saving.");
        console.log("Validation Failed:", errorInfo);
        return false;
      }
    };

    if (loading) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <GlobalLoaderWithoutInlineStyles text="Loading settings..." />
        </div>
      );
    }

    const tabItems = [
      {
        key: "general",
        label: (
          <TabIcon>
            <Building size={16} /> General
          </TabIcon>
        ),
        children: (
          <ScrollContainer>
            <FormContainer>
              <Suspense fallback={<TabLoader />}>
                <GeneralSettingsTab
                  form={generalForm}
                  logoUrl={logoUrl}
                  setLogoUrl={setLogoUrl}
                  setLogoFile={setLogoFile}
                  isMobile={isMobile}
                />
              </Suspense>
            </FormContainer>
          </ScrollContainer>
        ),
        forceRender: true,
      },
      {
        key: "location",
        label: (
          <TabIcon>
            <MapPin size={16} /> Location
          </TabIcon>
        ),
        children: (
          <ScrollContainer>
            <FormContainer>
              <Suspense fallback={<TabLoader />}>
                <LocationSettingsTab
                  form={locationForm}
                  initialData={{
                    address: initialBusinessData?.businessAddress,
                    businessUnit: initialBusinessData?.businessUnit,
                    city: initialBusinessData?.businessCity,
                    state: initialBusinessData?.businessState,
                    zipCode: initialBusinessData?.businessZipCode,
                    lat: initialBusinessData?.latitude,
                    lon: initialBusinessData?.longitude,
                    hide: initialBusinessData?.showExactLocation === false,
                  }}
                />
              </Suspense>
            </FormContainer>
          </ScrollContainer>
        ),
        forceRender: true,
      },
      {
        key: "preferences",
        label: (
          <TabIcon>
            <Settings size={16} /> Preferences
          </TabIcon>
        ),
        children: (
          <ScrollContainer>
            <FormContainer>
              <Suspense fallback={<TabLoader />}>
                <PreferencesSettingsTab
                  form={preferencesForm}
                  stripeStatus={stripeAccountStatus}
                  isMobile={isMobile}
                />
              </Suspense>
            </FormContainer>
          </ScrollContainer>
        ),
        forceRender: true,
      },
    ];

    return (
      <StyledTabs
        items={tabItems}
        activeKey={currentTab}
        onChange={(key) => {
          setCurrentTab(key);
          onTabChangeExternal(key);
        }}
      />
    );
  }
);

const BusinessSettings = forwardRef((props, ref) => {
  const {
    open = false,
    onClose = () => {},
    onSave = () => {},
    ...restProps
  } = props;

  const [isMobile, setIsMobile] = useState(false);
  const [saving, setSaving] = useState(false);
  const businessSettingsRef = React.useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useImperativeHandle(ref, () => ({
    saveChanges: async () => {
      if (businessSettingsRef.current) {
        return await businessSettingsRef.current.saveChanges();
      }
    },
  }));

  const handleDrawerOpenChange = (isOpen) => {
    if (!isOpen) {
      setTimeout(() => {
        onClose();
      }, 300);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (businessSettingsRef.current) {
        const success = await businessSettingsRef.current.saveChanges();
        if (success && onSave) {
          onSave();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemeProvider theme={appProvidedTheme}>
      <VaulDrawer.Root
          open={open}
          onOpenChange={handleDrawerOpenChange}
          direction={isMobile ? "bottom" : "right"}
          dismissible
          handleOnly={!isMobile}
          repositionInputs={false}
        >
          <VaulDrawer.Portal>
            <StyledDrawerOverlay />
            {isMobile ? (
              <StyledDrawerContent>
                <DrawerHandle />
                <DrawerHeader>
                  <DrawerTitle level={4}>Business Settings</DrawerTitle>
                  <CloseButton
                    icon={<X size={20} />}
                    onClick={onClose}
                  />
                </DrawerHeader>
                <DrawerContentWrapper>
                  <BusinessSettingsContent
                    ref={businessSettingsRef}
                    {...restProps}
                  />
                </DrawerContentWrapper>
                <DrawerFooter>
                  <Button onClick={onClose} disabled={saving} size="middle">
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<Save size={16} />}
                    onClick={handleSave}
                    loading={saving}
                    size="middle"
                    key={`btn-${saving}`}
                  >
                    {saving ? "Saving..." : "Save All Settings"}
                  </Button>
                </DrawerFooter>
              </StyledDrawerContent>
            ) : (
              <DesktopDrawerContent>
                <DrawerHandle />
                <DrawerHeader>
                  <DrawerTitle level={4}>Business Settings</DrawerTitle>
                  <CloseButton
                    icon={<X size={20} />}
                    onClick={onClose}
                  />
                </DrawerHeader>
                <DrawerContentWrapper>
                  <BusinessSettingsContent
                    ref={businessSettingsRef}
                    {...restProps}
                  />
                </DrawerContentWrapper>
                <DrawerFooter>
                  <Button onClick={onClose} disabled={saving} size="middle">
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<Save size={16} />}
                    onClick={handleSave}
                    loading={saving}
                    size="middle"
                    key={`btn-${saving}`}
                  >
                    {saving ? "Saving..." : "Save All Settings"}
                  </Button>
                </DrawerFooter>
              </DesktopDrawerContent>
            )}
          </VaulDrawer.Portal>
      </VaulDrawer.Root>
    </ThemeProvider>
  );
});

export default BusinessSettings;