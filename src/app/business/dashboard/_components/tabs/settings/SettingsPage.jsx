"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  Suspense,
  forwardRef,
  useImperativeHandle,
} from "react";
import styled from "styled-components";
import { Form, Button, Grid } from "antd";
import { Settings, Save, Building, MapPin, SlidersHorizontal } from "lucide-react";
import dayjs from "dayjs";
import "leaflet/dist/leaflet.css";

import message from "@/lib/message";
import { businessService, uploadService } from "@/services/apiService";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";

const GeneralSettingsTab = React.lazy(() => import("./GeneralSettingsTab"));
const LocationSettingsTab = React.lazy(() => import("./LocationSettingsTab"));
const PreferencesSettingsTab = React.lazy(() => import("./PreferencesSettingsTab"));

const { useBreakpoint } = Grid;

/* ─── Page Shell ────────────────────────────────────────────────── */

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #f9fafb;
`;

const PageHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 20;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 18px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderIconBox = styled.div`
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #374151;
`;

const HeaderTextBlock = styled.div``;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
`;

const HeaderSubtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  font-weight: 400;
  margin-top: 2px;
`;

const SaveBtn = styled(Button)`
  height: 36px;
  font-weight: 600;
  font-size: 14px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 18px;
`;

/* ─── Tab Navigation ─────────────────────────────────────────────── */

const TabNav = styled.div`
  position: sticky;
  top: 73px;
  z-index: 19;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 32px;
  display: flex;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  @media (max-width: 768px) {
    top: 57px;
    padding: 0 16px;
  }
`;

const TabButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 14px 4px;
  margin-right: 24px;
  font-size: 14px;
  font-weight: ${p => p.$active ? '600' : '500'};
  color: ${p => p.$active ? '#111827' : '#6b7280'};
  border-bottom: 2.5px solid ${p => p.$active ? '#111827' : 'transparent'};
  margin-bottom: -1px;
  display: flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: #111827;
  }

  svg {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
  }
`;

/* ─── Content Area ───────────────────────────────────────────────── */

const ContentArea = styled.div`
  padding: 28px 32px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 780px;
  margin: 0 auto;
`;

const TabLoader = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
    <GlobalLoaderWithoutInlineStyles />
  </div>
);

/* ─── Settings Page Component ────────────────────────────────────── */

const SettingsPage = forwardRef(({ defaultTab = "general", onProfileUpdate }, ref) => {
  const [generalForm] = Form.useForm();
  const [locationForm] = Form.useForm();
  const [preferencesForm] = Form.useForm();
  const [currentTab, setCurrentTab] = useState(defaultTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          businessHours: formattedHours.length > 0 ? formattedHours : undefined,
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
    setCurrentTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    const sectionId = sessionStorage.getItem("scrollToSection");
    if (sectionId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
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
        const uploadResult = await uploadService.uploadFile(logoFile, "business_image");
        if (uploadResult.success) {
          businessImageS3Key = uploadResult.s3_key;
        } else {
          message.error(`Logo upload failed: ${uploadResult.error}`);
          return false;
        }
      }

      const masterFormData = new FormData();

      masterFormData.append("businessName", generalValues.businessName);
      masterFormData.append("businessType", generalValues.businessType);
      masterFormData.append("businessDescription", generalValues.businessDescription);
      masterFormData.append("studentContactEmail", generalValues.studentContactEmail);
      masterFormData.append("studentContactPhone", generalValues.studentContactPhone);
      if (generalValues.website)
        masterFormData.append("website", generalValues.website);
      if (generalValues.preferredContact)
        masterFormData.append("preferredContact", generalValues.preferredContact);
      if (generalValues.founding_year != null)
        masterFormData.append("founding_year", generalValues.founding_year.toString());

      masterFormData.append(
        "social_media_links",
        JSON.stringify({
          facebook: generalValues.social_facebook || "",
          instagram: generalValues.social_instagram || "",
          twitter: generalValues.social_twitter || "",
          linkedin: generalValues.social_linkedin || "",
        })
      );
      masterFormData.append("tags_keywords", JSON.stringify(generalValues.tags_keywords || []));

      if (businessImageS3Key) {
        masterFormData.append("businessImage", businessImageS3Key);
      } else if (logoUrl === "" && initialBusinessData?.business_image_medium_url) {
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
        masterFormData.append("longitude", locationValues.longitude.toString());
      }
      masterFormData.append("showExactLocation", String(!locationValues.saltLocation));

      if (preferencesValues.businessHours?.length > 0) {
        const formattedHours = preferencesValues.businessHours.map((day) => ({
          day: day.day,
          isOpen: day.isOpen,
          open: day.isOpen && day.time?.[0] ? day.time[0].format("HH:mm") : null,
          close: day.isOpen && day.time?.[1] ? day.time[1].format("HH:mm") : null,
        }));
        masterFormData.append("businessHours", JSON.stringify(formattedHours));
      }
      masterFormData.append("business_timezone", preferencesValues.business_timezone);
      masterFormData.append("contact_privacy", preferencesValues.contact_privacy);
      masterFormData.append("newBookingNotification", String(preferencesValues.newBookingNotification));
      masterFormData.append("cancellationNotification", String(preferencesValues.cancellationNotification));
      masterFormData.append("reminderNotification", String(preferencesValues.reminderNotification));
      masterFormData.append("scheduleExpiryNotification", String(preferencesValues.scheduleExpiryNotification));
      masterFormData.append("smsNotifications", String(preferencesValues.smsNotifications));

      const response = await businessService.updateMyBusinessProfile(masterFormData);

      if (response.success) {
        message.success("All settings updated successfully");
        setLogoFile(null);
        await fetchBusinessData();
        return true;
      } else {
        message.error(
          response.error?.detail || response.error || "Failed to save changes."
        );
        return false;
      }
    } catch {
      message.error("Please correct the highlighted errors before saving.");
      return false;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await handleSaveAllChanges();
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    {
      key: "general",
      label: "General",
      icon: <Building />,
    },
    {
      key: "location",
      label: "Location",
      icon: <MapPin />,
    },
    {
      key: "preferences",
      label: "Preferences",
      icon: <SlidersHorizontal />,
    },
  ];

  if (loading) {
    return (
      <PageWrapper>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "80px 0",
          }}
        >
          <GlobalLoaderWithoutInlineStyles text="Loading settings..." />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader>
        <HeaderLeft>

          <HeaderTextBlock>
            <HeaderTitle>Business Settings</HeaderTitle>
            <HeaderSubtitle>
              Manage your business profile, location, and preferences
            </HeaderSubtitle>
          </HeaderTextBlock>
        </HeaderLeft>
        <SaveBtn
          type="primary"
          icon={<Save size={15} />}
          onClick={handleSave}
          loading={saving}
          key={`save-${saving}`}
        >
          {saving ? "Saving…" : "Save Changes"}
        </SaveBtn>
      </PageHeader>

      <TabNav>
        {tabs.map((tab) => (
          <TabButton
            key={tab.key}
            $active={currentTab === tab.key}
            onClick={() => setCurrentTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
          </TabButton>
        ))}
      </TabNav>

      <ContentArea>
        <ContentContainer>
          {currentTab === "general" && (
            <Suspense fallback={<TabLoader />}>
              <GeneralSettingsTab
                form={generalForm}
                logoUrl={logoUrl}
                setLogoUrl={setLogoUrl}
                setLogoFile={setLogoFile}
                isMobile={isMobile}
              />
            </Suspense>
          )}
          {currentTab === "location" && (
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
          )}
          {currentTab === "preferences" && (
            <Suspense fallback={<TabLoader />}>
              <PreferencesSettingsTab
                form={preferencesForm}
                stripeStatus={stripeAccountStatus}
                isMobile={isMobile}
                refetchBusinessData={fetchBusinessData}
              />
            </Suspense>
          )}
        </ContentContainer>
      </ContentArea>
    </PageWrapper>
  );
});

SettingsPage.displayName = "SettingsPage";
export default SettingsPage;
