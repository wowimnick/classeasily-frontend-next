"use client";

import React, { useState, useEffect, Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import styled from "styled-components";
import { Form, Select, Switch, Button, TimePicker, Spin } from "antd";
import message from "@/lib/message";
import {
  Clock,
  Globe,
  Bell,
  CreditCard,
  Info,
  RefreshCw,
  ExternalLink,
  Users,
  CheckCircle,
  Moon,
  ChevronUp,
} from "lucide-react";
import { businessService } from "@/services/apiService";

const { Option } = Select;

/* ─── Timezone list ─────────────────────────────────────────────── */

const timezones = (() => {
  try {
    if (typeof Intl !== "undefined" && Intl.supportedValuesOf) {
      const allTimezones = Intl.supportedValuesOf("timeZone");
      const now = new Date();
      return allTimezones
        .filter((tz) => tz.includes("/") || tz === "UTC" || tz === "GMT")
        .map((tz) => {
          try {
            const offsetString = new Intl.DateTimeFormat("en", {
              timeZone: tz,
              timeZoneName: "longOffset",
            })
              .formatToParts(now)
              .find((part) => part.type === "timeZoneName")?.value;
            const displayName = tz.replace(/_/g, " ").split("/").pop();
            const region = tz.includes("/") ? tz.split("/")[0].replace(/_/g, " ") : "";
            return {
              value: tz,
              label: `${offsetString} - ${displayName}${region ? ` (${region})` : ""}`,
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    throw new Error("Intl not supported");
  } catch {
    return [
      { value: "UTC", label: "GMT+0:00 - UTC" },
      { value: "America/New_York", label: "GMT-4:00 - New York (America)" },
      { value: "America/Chicago", label: "GMT-5:00 - Chicago (America)" },
      { value: "America/Denver", label: "GMT-6:00 - Denver (America)" },
      { value: "America/Los_Angeles", label: "GMT-7:00 - Los Angeles (America)" },
      { value: "Europe/London", label: "GMT+1:00 - London (Europe)" },
      { value: "Europe/Paris", label: "GMT+2:00 - Paris (Europe)" },
      { value: "Asia/Tokyo", label: "GMT+9:00 - Tokyo (Asia)" },
    ].sort((a, b) => a.label.localeCompare(b.label));
  }
})();

/* ─── Stripe status map ──────────────────────────────────────────── */

const statusMap = {
  unlinked: {
    text: "Not connected",
    pillBg: "#f1f5f9",
    pillColor: "#475569",
    msgBg: "#f8fafc",
    msgColor: "#475569",
    msgBorder: "#e2e8f0",
    msgIcon: <CreditCard size={15} />,
    msgText: "Connect a Stripe account to start receiving payouts from your bookings.",
  },
  pending: {
    text: "Pending verification",
    pillBg: "#fef3c7",
    pillColor: "#92400e",
    msgBg: "#fffbeb",
    msgColor: "#78350f",
    msgBorder: "#fde68a",
    msgIcon: <RefreshCw size={15} />,
    msgText: "Stripe is reviewing your account. This typically takes a few business days.",
  },
  restricted: {
    text: "Account restricted",
    pillBg: "#fee2e2",
    pillColor: "#991b1b",
    msgBg: "#fff5f5",
    msgColor: "#991b1b",
    msgBorder: "#fecaca",
    msgIcon: <Info size={15} />,
    msgText: "Your Stripe account has restrictions. Visit Stripe to resolve them before you can receive payouts.",
  },
  active: {
    text: "Connected & active",
    pillBg: "#d1fae5",
    pillColor: "#065f46",
    msgBg: "#f0fdf4",
    msgColor: "#166534",
    msgBorder: "#bbf7d0",
    msgIcon: <CheckCircle size={15} />,
    msgText: "Your account is connected and ready to receive payouts. No further action needed.",
  },
  incomplete: {
    text: "Setup incomplete",
    pillBg: "#fee2e2",
    pillColor: "#991b1b",
    msgBg: "#fff5f5",
    msgColor: "#991b1b",
    msgBorder: "#fecaca",
    msgIcon: <Info size={15} />,
    msgText: "Your Stripe onboarding isn't finished yet. Continue setup to enable payouts.",
  },
};

/* ─── Shared Section components ──────────────────────────────────── */

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
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
`;

const SectionIconBox = styled.div`
  width: 34px;
  height: 34px;
  background: #f3f4f6;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #374151;
`;

const SectionTitleBlock = styled.div`
  flex: 1;
`;

const SectionTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
`;

const SectionSubtitle = styled.div`
  font-size: 12.5px;
  color: #6b7280;
  margin-top: 1px;
`;

const SectionChevron = styled.div`
  color: #9ca3af;
  display: flex;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
  gap: 16px;

  &:last-child {
    border-bottom: none;
  }
`;

const SettingInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SettingLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
`;

const SettingDesc = styled.div`
  font-size: 12.5px;
  color: #6b7280;
  margin-top: 2px;
`;

const SettingControl = styled.div`
  flex-shrink: 0;
`;

/* ─── Business Hours ─────────────────────────────────────────────── */

const DayGrid = styled.div`
  padding: 8px 0;
`;

const DayRow = styled.div`
  display: grid;
  grid-template-columns: 160px 1fr 1fr;
  align-items: center;
  padding: 10px 20px;
  gap: 10px;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 600px) {
    grid-template-columns: 130px 1fr 1fr;
    padding: 10px 14px;
    gap: 8px;
  }
`;

const DayToggleCol = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DayName = styled.span`
  font-size: 13.5px;
  font-weight: 600;
  color: #111827;
`;

const TimeInputBox = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  padding: 6px 10px;
  background: #fff;
  min-width: 0;

  .ant-picker {
    border: none !important;
    padding: 0 !important;
    box-shadow: none !important;
    flex: 1;
    min-width: 0;
    background: transparent;
  }

  .ant-picker-input input {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
  }
`;

const TimePrefix = styled.span`
  font-size: 11.5px;
  font-weight: 400;
  color: #9ca3af;
  white-space: nowrap;
  flex-shrink: 0;
`;

const ClosedBar = styled.div`
  grid-column: 2 / 4;
  background: #f9fafb;
  border-radius: 8px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
`;

/* ─── Payout status ──────────────────────────────────────────────── */

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: ${p => p.$bg || "#e2e8f0"};
  color: ${p => p.$color || "#334155"};

  &::before {
    content: "";
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.7;
    flex-shrink: 0;
  }
`;

const PayoutStatusMessage = styled.div`
  margin: 20px 16px;
  padding: 12px 14px;
  border-radius: 7px;
  font-size: 13px;
  line-height: 1.5;
  background: ${p => p.$bg};
  color: ${p => p.$color};
  border: 1px solid ${p => p.$border};
  display: flex;
  align-items: flex-start;
  gap: 10px;

  svg { flex-shrink: 0; margin-top: 1px; }
`;

const PayoutActionRow = styled.div`
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid #e5e7eb;
`;

const PayoutActionInfo = styled.div`
  font-size: 12px;
  color: #9ca3af;
`;

const HelpNote = styled.p`
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
  max-width: 320px;
`;

/* ─── TimePairPicker ──────────────────────────────────────────────── */

const TimePairWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  grid-column: 2 / 4;
`;

function TimePairCell({ value = [null, null], onChange, disabled }) {
  const [open, close] = Array.isArray(value) ? value : [null, null];
  return (
    <TimePairWrapper>
      <TimeInputBox style={{ flex: 1, opacity: disabled ? 0.4 : 1 }}>
        <TimePrefix>From</TimePrefix>
        <TimePicker
          value={open}
          onChange={(t) => onChange?.([t, close])}
          use12Hours
          format="h:mm A"
          minuteStep={15}
          disabled={disabled}
          placeholder="Open"
          suffixIcon={null}
          allowClear={false}
          size="small"
          variant="borderless"
        />
      </TimeInputBox>
      <TimeInputBox style={{ flex: 1, opacity: disabled ? 0.4 : 1 }}>
        <TimePrefix>To</TimePrefix>
        <TimePicker
          value={close}
          onChange={(t) => onChange?.([open, t])}
          use12Hours
          format="h:mm A"
          minuteStep={15}
          disabled={disabled}
          placeholder="Close"
          suffixIcon={null}
          allowClear={false}
          size="small"
          variant="borderless"
        />
      </TimeInputBox>
    </TimePairWrapper>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */

function PreferencesSettingsTabContent({ form, stripeStatus, isMobile, refetchBusinessData, onFieldBlur, onFieldChange }) {
  const [connectLoading, setConnectLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  // useWatch for rendering the day rows — we need the array length/day names
  const businessHours = Form.useWatch("businessHours", form);

  // Stable ref to onFieldChange so the effect below doesn't re-run on every render
  const onFieldChangeRef = React.useRef(onFieldChange);
  useEffect(() => { onFieldChangeRef.current = onFieldChange; }, [onFieldChange]);

  // Track whether the initial form population has settled before treating
  // businessHours changes as user-driven edits worth auto-saving.
  const initializedRef = React.useRef(false);
  const pendingTimerRef = React.useRef(null);

  useEffect(() => {
    if (!businessHours || !Array.isArray(businessHours) || businessHours.length === 0) return;

    // First non-empty value after mount is the initial data load — skip it.
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    // Debounce: cancel any in-flight timer so rapid toggles only fire once settled.
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    pendingTimerRef.current = setTimeout(() => {
      onFieldChangeRef.current?.("businessHours", businessHours);
    }, 500);

    return () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessHours]); // intentionally omit onFieldChange — using ref instead

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isStripeReturn = localStorage.getItem("stripeOnboardingStatus") === "returned";
    if (!isStripeReturn) return;

    setIsSyncing(true);
    message.loading({ content: "Syncing latest account status from Stripe…", key: "syncing", duration: 0 });

    let attempts = 0;
    const intervalId = setInterval(async () => {
      attempts++;
      try {
        const freshData = await businessService.getMyBusinessProfile();
        const newStripeStatus = freshData?.data?.stripe_account_status;
        if ((newStripeStatus && newStripeStatus !== "incomplete") || attempts >= 5) {
          clearInterval(intervalId);
          message.success({ content: "Status synchronized!", key: "syncing", duration: 1 });
          setIsSyncing(false);
          localStorage.removeItem("stripeOnboardingStatus");
          router.replace(pathname + "#payout-setup-section");
        }
      } catch {
        clearInterval(intervalId);
        message.error({ content: "Could not sync status. Please refresh.", key: "syncing", duration: 3 });
        setIsSyncing(false);
        localStorage.removeItem("stripeOnboardingStatus");
        router.replace(pathname + "#payout-setup-section");
      }
    }, 2500);

    return () => clearInterval(intervalId);
  }, [refetchBusinessData, router, pathname]);

  const handleConnectStripe = async () => {
    setConnectLoading(true);
    message.loading({ content: "Connecting to Stripe…", key: "stripe" });
    try {
      const response = await businessService.createStripeAccountLink();
      if (response.success && response.data?.accountLinkUrl) {
        localStorage.setItem("stripeOnboardingStatus", "pending");
        if (typeof window !== "undefined") window.location.href = response.data.accountLinkUrl;
      } else {
        message.error({ content: response.error || "Failed to create Stripe link.", key: "stripe" });
      }
    } catch {
      message.error({ content: "An unexpected error occurred.", key: "stripe" });
    } finally {
      setConnectLoading(false);
    }
  };

  const stripeButtonInfo = (() => {
    switch (stripeStatus) {
      case "active":     return { text: "Manage Payouts",        icon: <ExternalLink size={15} /> };
      case "pending":    return { text: "Continue Onboarding",   icon: <ExternalLink size={15} /> };
      case "restricted":
      case "incomplete": return { text: "Update Account Details", icon: <ExternalLink size={15} /> };
      default:           return { text: "Setup Payouts",         icon: <CreditCard size={15} /> };
    }
  })();

  const stripeStatusInfo = statusMap[stripeStatus] || statusMap.unlinked;

  return (
    <Form form={form} layout="vertical" name="preferencesSettingsForm" requiredMark="optional">

      {/* ── Business Hours ── */}
      <SectionCard>
        <SectionHeader>
          <SectionIconBox><Clock size={17} /></SectionIconBox>
          <SectionTitleBlock>
            <SectionTitle>Business hours</SectionTitle>
            <SectionSubtitle>Set your weekly schedule and operating timezone</SectionSubtitle>
          </SectionTitleBlock>
        </SectionHeader>

        {/* Timezone row */}
        <SettingRow>
          <SettingInfo>
            <SettingLabel>Timezone</SettingLabel>
            <SettingDesc>Set your business timezone for accurate scheduling</SettingDesc>
          </SettingInfo>
          <SettingControl style={{ minWidth: 220 }}>
            <Form.Item name="business_timezone" noStyle rules={[{ required: true, message: "Timezone is required" }]}>
              <Select
                showSearch
                placeholder="Select timezone"
                optionFilterProp="label"
                options={timezones}
                style={{ width: "100%" }}
                size="middle"
                onChange={(val) => onFieldChange?.("business_timezone", val)}
              />
            </Form.Item>
          </SettingControl>
        </SettingRow>

        {/* Day grid */}
        <Form.Item
          name="businessHours"
          noStyle
          rules={[{
            validator: async (_, hours) => {
              if (!hours || !hours.some((d) => d.isOpen))
                return Promise.reject(new Error("Please set hours for at least one open day."));
              for (const d of hours) {
                if (d.isOpen && (!d.time || !d.time[0] || !d.time[1]))
                  return Promise.reject(new Error(`Please set both times for ${d.day}.`));
                if (d.isOpen && d.time?.[0] && d.time?.[1] && d.time[0].isAfter(d.time[1]))
                  return Promise.reject(new Error(`Closing time must be after opening for ${d.day}.`));
              }
              return Promise.resolve();
            },
          }]}
        >
          <DayGrid>
            {(businessHours || []).map((day, index) => (
              // key must be stable (day name), NOT index, so React doesn't confuse rows on re-order
              <DayRow key={day.day}>
                <DayToggleCol>
                  <Form.Item name={["businessHours", index, "isOpen"]} valuePropName="checked" noStyle>
                    <Switch size="small" />
                  </Form.Item>
                  <DayName>{day.day}</DayName>
                </DayToggleCol>

                {/*
                  CRITICAL: read isOpen from live form state, NOT from the watched `businessHours`
                  snapshot which may lag by a render cycle. Using Form.Item shouldUpdate ensures
                  this inner block re-renders synchronously when the Switch fires, preventing the
                  stale-state mismatch that caused ClosedBar / TimePairCell to show incorrectly
                  after rapid toggles.
                */}
                <Form.Item noStyle shouldUpdate={(prev, curr) =>
                  prev.businessHours?.[index]?.isOpen !== curr.businessHours?.[index]?.isOpen
                }>
                  {({ getFieldValue }) => {
                    const isOpen = getFieldValue(["businessHours", index, "isOpen"]);
                    return isOpen ? (
                      <Form.Item name={["businessHours", index, "time"]} noStyle>
                        <TimePairCell />
                      </Form.Item>
                    ) : (
                      <ClosedBar>
                        <Moon size={15} />
                        Closed
                      </ClosedBar>
                    );
                  }}
                </Form.Item>
              </DayRow>
            ))}
          </DayGrid>
        </Form.Item>
      </SectionCard>

      {/* ── Booking checkout ── */}
      <SectionCard>
        <SectionHeader>
          <SectionIconBox><Users size={17} /></SectionIconBox>
          <SectionTitleBlock>
            <SectionTitle>Booking checkout</SectionTitle>
            <SectionSubtitle>How guest information is collected when someone books</SectionSubtitle>
          </SectionTitleBlock>
        </SectionHeader>
        <SettingRow>
          <SettingInfo>
            <SettingLabel>Require each participant&apos;s name</SettingLabel>
            <SettingDesc>
              When guests book more than one spot, ask for every participant&apos;s name (not only the booker&apos;s).
            </SettingDesc>
          </SettingInfo>
          <SettingControl>
            <Form.Item name="require_participant_names" valuePropName="checked" noStyle>
              <Switch
                size="small"
                onChange={(checked) => onFieldChange?.("require_participant_names", checked)}
              />
            </Form.Item>
          </SettingControl>
        </SettingRow>
      </SectionCard>

      {/* ── Notifications ── */}
      <SectionCard>
        <SectionHeader>
          <SectionIconBox><Bell size={17} /></SectionIconBox>
          <SectionTitleBlock>
            <SectionTitle>Notifications</SectionTitle>
            <SectionSubtitle>Manage email and SMS alerts for your business</SectionSubtitle>
          </SectionTitleBlock>
        </SectionHeader>

        {[
          { name: "newBookingNotification",      label: "New booking",          desc: "Get notified when a new booking is made" },
          { name: "cancellationNotification",    label: "Cancellations",        desc: "Get notified when a booking is cancelled" },
          { name: "reminderNotification",        label: "Student reminders",    desc: "Automatically remind students 24 hours before class" },
          { name: "scheduleExpiryNotification",  label: "Schedule expiry",      desc: "Alert when classes are running low on sessions" },
          { name: "smsNotifications",            label: "SMS notifications",    desc: "Receive critical alerts via text message" },
        ].map(({ name, label, desc }) => (
          <SettingRow key={name}>
            <SettingInfo>
              <SettingLabel>{label}</SettingLabel>
              <SettingDesc>{desc}</SettingDesc>
            </SettingInfo>
            <SettingControl>
              <Form.Item name={name} valuePropName="checked" noStyle>
                <Switch size="small" onChange={(checked) => onFieldChange?.(name, checked)} />
              </Form.Item>
            </SettingControl>
          </SettingRow>
        ))}
      </SectionCard>

      {/* ── Payout Setup ── */}
      <SectionCard id="payout-setup-section">
        <SectionHeader>
          <SectionIconBox><CreditCard size={17} /></SectionIconBox>
          <SectionTitleBlock>
            <SectionTitle>Payout setup</SectionTitle>
            <SectionSubtitle>Connect Stripe to receive payments from bookings</SectionSubtitle>
          </SectionTitleBlock>
        </SectionHeader>

        <Spin spinning={isSyncing} tip="Synchronizing…">
          {/* Status row */}
          <SettingRow>
            <SettingInfo>
              <SettingLabel>Account status</SettingLabel>
              <SettingDesc>Your Stripe payout account connection</SettingDesc>
            </SettingInfo>
            <SettingControl>
              <StatusPill $bg={stripeStatusInfo.pillBg} $color={stripeStatusInfo.pillColor}>
                {stripeStatusInfo.text}
              </StatusPill>
            </SettingControl>
          </SettingRow>

          {/* Status message */}
          <PayoutStatusMessage
            $bg={stripeStatusInfo.msgBg}
            $color={stripeStatusInfo.msgColor}
            $border={stripeStatusInfo.msgBorder}
          >
            {stripeStatusInfo.msgIcon}
            {stripeStatusInfo.msgText}
          </PayoutStatusMessage>

          {/* Action row */}
          <PayoutActionRow>
            <PayoutActionInfo>
              You&apos;ll be redirected to Stripe&apos;s secure platform. ClassEasily does not store your bank details.
            </PayoutActionInfo>
            <Button
              type={stripeStatus === "active" ? "default" : "primary"}
              icon={stripeButtonInfo.icon}
              onClick={handleConnectStripe}
              loading={connectLoading}
              key={`stripe-${connectLoading}`}
              style={{ flexShrink: 0 }}
            >
              {stripeButtonInfo.text}
            </Button>
          </PayoutActionRow>
        </Spin>
      </SectionCard>

    </Form>
  );
}

const PreferencesSettingsTab = (props) => (
  <Suspense fallback={<div style={{ minHeight: 400 }} />}>
    <PreferencesSettingsTabContent {...props} />
  </Suspense>
);

export default PreferencesSettingsTab;