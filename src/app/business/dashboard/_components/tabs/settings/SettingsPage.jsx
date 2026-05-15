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
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Building, MapPin, SlidersHorizontal, CreditCard, Mail, Link2 } from "lucide-react";
import dayjs from "dayjs";
import "leaflet/dist/leaflet.css";

import message from "@/lib/message";
import { businessService, uploadService } from "@/services/apiService";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { getAddressFieldsForProfileSave } from "./locationsSettingsHelpers";

const GeneralSettingsTab = React.lazy(() => import("./GeneralSettingsTab"));
const LocationsSettingsTab = React.lazy(() => import("./LocationsSettingsTab"));
const PreferencesSettingsTab = React.lazy(() => import("./PreferencesSettingsTab"));
const PlanBillingSettingsTab = React.lazy(() => import("./PlanBillingSettingsTab"));
const EmailBrandingSettingsTab = React.lazy(() => import("./EmailBrandingSettingsTab"));

const { useBreakpoint } = Grid;

/* ─── Page Shell ────────────────────────────────────────────────── */

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #f9fafb;
`;

const PageHeader = styled.div`
  padding: 18px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #ffffff;

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

const TabLabelGradient = styled.span`
  display: inline-block;
  line-height: inherit;
  vertical-align: middle;
  background: linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #0284c7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

/* ─── Tab Navigation ─────────────────────────────────────────────── */

const StickyHeaderTabs = styled.div`
  position: sticky;
  top: 0;
  z-index: 20;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
`;

const TabNav = styled.div`
  padding: 0 32px;
  display: flex;
  align-items: center;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

const TabSeparator = styled.div`
  width: 1px;
  height: 20px;
  background: #e5e7eb;
  margin: 0 8px;
  flex-shrink: 0;
`;

const TabButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 14px 4px;
  margin-right: ${(p) => (p.$compactRight ? "8px" : "24px")};
  font-size: 14px;
  font-weight: ${p => p.$active ? '600' : '500'};
  color: ${p => p.$active ? '#111827' : '#6b7280'};
  border-bottom: 1px solid ${p => p.$active ? '#111827' : 'transparent'};
  display: flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;

  &:last-child {
    margin-right: 0;
  }

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
  padding: ${(p) => (p.$noPadding ? "0" : "28px 32px")};

  @media (max-width: 768px) {
    padding: ${(p) => (p.$noPadding ? "0" : "16px")};
  }
`;

const ContentContainer = styled.div`
  width: 100%;
`;

const FormTabsWrap = styled.div`
  width: 100%;
  max-width: 780px;
  margin: 0 auto;
`;

const AutoSaveIndicatorWrap = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border: 1px solid #e5e7eb;
  font-size: 13px;
  color: #6b7280;

  @media (max-width: 768px) {
    bottom: 16px;
    right: 16px;
  }
`;

const SaveSpinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: saveSpin 0.7s linear infinite;
  @keyframes saveSpin {
    to { transform: rotate(360deg); }
  }
`;

const TabLoader = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
    <GlobalLoaderWithoutInlineStyles />
  </div>
);

/* ─── Settings Page Component ────────────────────────────────────── */

const VALID_SETTINGS_TABS = ["general", "locations", "preferences", "billing", "stripe", "email"];

const SettingsPage = forwardRef(({ defaultTab = "general", onProfileUpdate, addonReturn = false }, ref) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [generalForm] = Form.useForm();
  const [preferencesForm] = Form.useForm();
  const tabFromUrl = searchParams.get("tab");
  const normalizedTab = tabFromUrl === "location" ? "locations" : tabFromUrl;
  const initialTab = VALID_SETTINGS_TABS.includes(normalizedTab) ? normalizedTab : defaultTab;
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  const setTabWithUrl = useCallback(
    (key) => {
      setCurrentTab(key);
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("tab", key);
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const raw = searchParams.get("tab");
    const tabFromUrl = raw === "location" ? "locations" : raw;
    if (VALID_SETTINGS_TABS.includes(tabFromUrl) && tabFromUrl !== currentTab) {
      setCurrentTab(tabFromUrl);
    }
  }, [searchParams, currentTab]);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'saved'
  const savedTimerRef = React.useRef(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [initialBusinessData, setInitialBusinessData] = useState(null);
  const [stripeAccountStatus, setStripeAccountStatus] = useState("unlinked");
  const [addons, setAddons] = useState(null);
  const [addonsLoading, setAddonsLoading] = useState(true);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const hasEmailAddon = addons?.marketplace_email_branding?.active === true;

  const refetchAddons = useCallback(async () => {
    const result = await businessService.getAddons();
    if (result.success && result.data) setAddons(result.data);
    return result;
  }, []);

  const saveChangesRef = React.useRef(null);
  useImperativeHandle(ref, () => ({
    saveChanges: () => (saveChangesRef.current ? saveChangesRef.current() : Promise.resolve(false)),
  }), []);

  const lastSavePayloadRef = React.useRef(null);
  const lastSaveTimeRef = React.useRef(0);
  const SAVE_DEBOUNCE_MS = 400;

  const savePayload = useCallback(async (payload) => {
    if (!payload || Object.keys(payload).length === 0) return false;
    const payloadKey = JSON.stringify(payload);
    const now = Date.now();
    if (lastSavePayloadRef.current === payloadKey && now - lastSaveTimeRef.current < SAVE_DEBOUNCE_MS) {
      return true;
    }
    lastSavePayloadRef.current = payloadKey;
    lastSaveTimeRef.current = now;
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }
    setSaveStatus("saving");
    try {
      const res = await businessService.updateMyBusinessProfile(payload);
      if (res.success) {
        setSaveStatus("saved");
        savedTimerRef.current = setTimeout(() => {
          setSaveStatus("idle");
          savedTimerRef.current = null;
        }, 5000);
        return true;
      } else {
        setSaveStatus("idle");
        message.error(res.error?.detail || res.error || "Failed to save");
        return false;
      }
    } catch {
      setSaveStatus("idle");
      message.error("Failed to save");
      return false;
    }
  }, []);

  const buildGeneralPayload = useCallback((form, fieldName, valueOverride) => {
    const v = form.getFieldValue;
    const value = valueOverride !== undefined ? valueOverride : v(fieldName);
    if (["social_facebook", "social_instagram", "social_twitter", "social_linkedin"].includes(fieldName)) {
      return {
        social_media_links: {
          facebook: fieldName === "social_facebook" ? (value ?? "") : (v("social_facebook") ?? ""),
          instagram: fieldName === "social_instagram" ? (value ?? "") : (v("social_instagram") ?? ""),
          twitter: fieldName === "social_twitter" ? (value ?? "") : (v("social_twitter") ?? ""),
          linkedin: fieldName === "social_linkedin" ? (value ?? "") : (v("social_linkedin") ?? ""),
        },
      };
    }
    if (value === undefined && valueOverride === undefined) return null;
    const payload = {};
    const apiKey = fieldName;
    if (fieldName === "founding_year" && (value === null || value === undefined || value === "")) {
      payload[apiKey] = null;
    } else if (fieldName === "tags_keywords") {
      payload[apiKey] = Array.isArray(value) ? value : (v("tags_keywords") || []);
    } else {
      payload[apiKey] = value;
    }
    return Object.keys(payload).length ? payload : null;
  }, []);

  const buildPreferencesPayload = useCallback((form, fieldName, directValue) => {
    const v = form.getFieldValue;
    const booleanPrefFields = [
      "newBookingNotification",
      "cancellationNotification",
      "reminderNotification",
      "scheduleExpiryNotification",
      "smsNotifications",
      "require_participant_names",
    ];
    if (booleanPrefFields.includes(fieldName)) {
      const val = directValue !== undefined ? directValue : v(fieldName);
      return { [fieldName]: Boolean(val) };
    }
    if (fieldName === "business_timezone") {
      const val = directValue !== undefined ? directValue : v("business_timezone");
      return val != null ? { business_timezone: val } : null;
    }
    if (fieldName === "contact_privacy") {
      const val = directValue !== undefined ? directValue : v("contact_privacy");
      return val != null ? { contact_privacy: val } : null;
    }
    if (fieldName === "businessHours") {
      const hours = directValue !== undefined ? directValue : v("businessHours");
      if (!hours || !Array.isArray(hours)) return null;
      const formatted = hours.map((day) => ({
        day: day.day,
        isOpen: day.isOpen,
        open: day.isOpen && day.time?.[0] ? day.time[0].format("HH:mm") : null,
        close: day.isOpen && day.time?.[1] ? day.time[1].format("HH:mm") : null,
      }));
      return { businessHours: formatted };
    }
    return null;
  }, []);

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
          require_participant_names: data.require_participant_names === true,
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
  }, [generalForm, preferencesForm, onProfileUpdate]);

  useEffect(() => {
    fetchBusinessData();
  }, [fetchBusinessData]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await businessService.getAddons();
      if (!cancelled && result.success && result.data) setAddons(result.data);
      if (!cancelled) setAddonsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setCurrentTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (!addonsLoading && currentTab === "email" && !hasEmailAddon) {
      setCurrentTab("billing");
    }
  }, [addonsLoading, currentTab, hasEmailAddon]);

  const addonReturnHandled = React.useRef(false);
  useEffect(() => {
    if (!addonReturn || addonReturnHandled.current) return;
    addonReturnHandled.current = true;
    refetchAddons().then((result) => {
      if (result?.success && result?.data?.marketplace_email_branding?.active) {
        setAddons(result.data);
        setCurrentTab("email");
        router.replace("/business/dashboard/settings?tab=email", { scroll: false });
      }
    });
  }, [addonReturn, refetchAddons, router]);

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
      const [generalValues, preferencesValues] = await Promise.all([
        generalForm.validateFields(),
        preferencesForm.validateFields(),
      ]);
      const addr = getAddressFieldsForProfileSave(initialBusinessData);

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

      masterFormData.append("businessAddress", addr.businessAddress || "");
      if (addr.businessUnit) masterFormData.append("businessUnit", addr.businessUnit);
      if (addr.businessCity) masterFormData.append("businessCity", addr.businessCity);
      if (addr.businessState) masterFormData.append("businessState", addr.businessState);
      if (addr.businessZipCode)
        masterFormData.append("businessZipCode", addr.businessZipCode);
      if (addr.latitude != null && addr.longitude != null) {
        masterFormData.append("latitude", String(addr.latitude));
        masterFormData.append("longitude", String(addr.longitude));
      }
      masterFormData.append("showExactLocation", String(addr.showExactLocation !== false));

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
      masterFormData.append(
        "require_participant_names",
        String(preferencesValues.require_participant_names === true)
      );

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
  saveChangesRef.current = handleSaveAllChanges;

  const onLogoRemove = useCallback(() => {
    savePayload({ businessImage: "" });
  }, [savePayload]);

  const onGeneralFieldBlur = useCallback((fieldName) => {
    const fieldsToValidate = ["social_facebook", "social_instagram", "social_twitter", "social_linkedin"].includes(fieldName)
      ? ["social_facebook", "social_instagram", "social_twitter", "social_linkedin"]
      : [fieldName];
    generalForm.validateFields(fieldsToValidate).then(() => {
      const payload = buildGeneralPayload(generalForm, fieldName);
      if (payload) savePayload(payload);
    }).catch(() => { /* validation failed, form shows error; don't save */ });
  }, [buildGeneralPayload, generalForm, savePayload]);

  const onGeneralFieldChange = useCallback((fieldName, value) => {
    const fieldsToValidate = ["social_facebook", "social_instagram", "social_twitter", "social_linkedin"].includes(fieldName)
      ? ["social_facebook", "social_instagram", "social_twitter", "social_linkedin"]
      : [fieldName];
    generalForm.setFieldsValue({ [fieldName]: value });
    generalForm.validateFields(fieldsToValidate).then(() => {
      const payload = buildGeneralPayload(generalForm, fieldName, value);
      if (payload) savePayload(payload);
    }).catch(() => { /* validation failed */ });
  }, [buildGeneralPayload, generalForm, savePayload]);

  const onPreferencesFieldChange = useCallback((fieldName, value) => {
    const fieldsToValidate = fieldName === "businessHours" ? ["businessHours"] : [fieldName];
    preferencesForm.validateFields(fieldsToValidate).then(() => {
      const payload = buildPreferencesPayload(preferencesForm, fieldName, value);
      if (payload) savePayload(payload);
    }).catch(() => {});
  }, [buildPreferencesPayload, preferencesForm, savePayload]);

  const onPreferencesFieldBlur = useCallback((fieldName) => {
    const fieldsToValidate = fieldName === "businessHours" ? ["businessHours"] : [fieldName];
    preferencesForm.validateFields(fieldsToValidate).then(() => {
      const payload = buildPreferencesPayload(preferencesForm, fieldName);
      if (payload) savePayload(payload);
    }).catch(() => {});
  }, [buildPreferencesPayload, preferencesForm, savePayload]);

  useEffect(() => {
    if (!logoFile) return;
    let cancelled = false;
    (async () => {
      const result = await uploadService.uploadFile(logoFile, "business_image");
      if (cancelled) return;
      if (result.success && result.s3_key) {
        const saved = await savePayload({ businessImage: result.s3_key });
        if (cancelled) return;
        if (saved) {
          const url = result.public_url || (typeof window !== "undefined" && process.env.NEXT_PUBLIC_CDN_URL
            ? `${process.env.NEXT_PUBLIC_CDN_URL.replace(/\/$/, "")}/${result.s3_key}`
            : null);
          if (url) setLogoUrl(url);
        }
      } else {
        message.error(result.error || "Logo upload failed");
      }
      setLogoFile(null);
    })();
    return () => { cancelled = true; };
  }, [logoFile, savePayload]);

  const mainTabs = [
    { key: "general", label: "General", icon: <Building /> },
    { key: "locations", label: "Locations", icon: <MapPin /> },
    { key: "preferences", label: "Preferences", icon: <SlidersHorizontal /> },
    { key: "billing", label: "Plan & Billing", icon: <CreditCard /> },
    { key: "stripe", label: "Stripe", icon: <Link2 size={18} /> },
  ];
  const emailTab = hasEmailAddon ? [{ key: "email", label: "Email Branding", icon: <Mail />, $gradient: true }] : [];
  const showAutoSaveIndicator = ["general", "preferences"].includes(currentTab);

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
      <StickyHeaderTabs>
        <PageHeader>
          <HeaderLeft>
            <HeaderTextBlock>
              <HeaderTitle>Business Settings</HeaderTitle>
              <HeaderSubtitle>
                Manage your business profile, location, and preferences
              </HeaderSubtitle>
            </HeaderTextBlock>
          </HeaderLeft>
        </PageHeader>

        <TabNav>
          {mainTabs.map((tab, index) => (
            <TabButton
              key={tab.key}
              $active={currentTab === tab.key}
              $compactRight={emailTab.length > 0 && index === mainTabs.length - 1}
              onClick={() => setTabWithUrl(tab.key)}
            >
              {tab.icon}
              {tab.label}
            </TabButton>
          ))}
          {emailTab.length > 0 && (
            <>
              <TabSeparator />
              {emailTab.map((tab) => (
                <TabButton
                  key={tab.key}
                  $active={currentTab === tab.key}
                  onClick={() => setTabWithUrl(tab.key)}
                >
                  {tab.icon}
                  <TabLabelGradient>{tab.label}</TabLabelGradient>
                </TabButton>
              ))}
            </>
          )}
        </TabNav>
      </StickyHeaderTabs>

      <ContentArea $noPadding={currentTab === "email"}>
        {currentTab === "billing" ? (
          <Suspense fallback={<TabLoader />}>
            <PlanBillingSettingsTab
              addons={addons}
              addonsLoading={addonsLoading}
              refetchAddons={refetchAddons}
            />
          </Suspense>
        ) : currentTab === "stripe" ? (
          <Suspense fallback={<TabLoader />}>
            <StripeConnectionSettingsTab
              stripeStatus={stripeAccountStatus}
              onRefresh={fetchBusinessData}
            />
          </Suspense>
        ) : currentTab === "email" ? (
          <Suspense fallback={<TabLoader />}>
            <EmailBrandingSettingsTab />
          </Suspense>
        ) : (
          <>
            <FormTabsWrap>
              <ContentContainer>
                {currentTab === "general" && (
                  <Suspense fallback={<TabLoader />}>
                    <GeneralSettingsTab
                      form={generalForm}
                      logoUrl={logoUrl}
                      setLogoUrl={setLogoUrl}
                      setLogoFile={setLogoFile}
                      isMobile={isMobile}
                      onFieldBlur={onGeneralFieldBlur}
                      onFieldChange={onGeneralFieldChange}
                      onLogoRemove={onLogoRemove}
                    />
                  </Suspense>
                )}
                {currentTab === "locations" && (
                  <Suspense fallback={<TabLoader />}>
                    <LocationsSettingsTab onLocationsChanged={fetchBusinessData} />
                  </Suspense>
                )}
                {currentTab === "preferences" && (
                  <Suspense fallback={<TabLoader />}>
                    <PreferencesSettingsTab
                      form={preferencesForm}
                      stripeStatus={stripeAccountStatus}
                      isMobile={isMobile}
                      refetchBusinessData={fetchBusinessData}
                      onFieldBlur={onPreferencesFieldBlur}
                      onFieldChange={onPreferencesFieldChange}
                    />
                  </Suspense>
                )}
              </ContentContainer>
            </FormTabsWrap>
            {showAutoSaveIndicator && (saveStatus === "saving" || saveStatus === "saved") && (
              <AutoSaveIndicatorWrap>
                {saveStatus === "saving" && <SaveSpinner />}
                {saveStatus === "saving" && <span>Saving…</span>}
                {saveStatus === "saved" && <span>Saved</span>}
              </AutoSaveIndicatorWrap>
            )}
          </>
        )}
      </ContentArea>
    </PageWrapper>
  );
});

SettingsPage.displayName = "SettingsPage";
export default SettingsPage;
