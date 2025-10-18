"use client";

import React, { useState, useEffect, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import {
  Form,
  Select,
  Switch,
  Button,
  TimePicker,
  Alert,
  message,
  Radio,
  Spin,
  Checkbox,
  Row,
  Col,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import {
  Clock,
  Globe,
  Bell,
  CreditCard,
  Info,
  RefreshCw,
  ExternalLink,
  Shield,
  CheckCircle,
} from "lucide-react";
import {
  FormGroup,
  FormGrid,
  FormLabel,
  HelpText,
  SectionDivider,
  FormSectionCard,
} from "./BusinessSettings";
import { businessService } from "@/services/apiService";

const { Option } = Select;

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

const SwitchLabelContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;
const SwitchInfo = styled.div`
  flex: 1;
  margin-right: 16px;
  .title {
    font-size: 15px;
    font-weight: 600;
    color: #222;
    margin-bottom: 2px;
  }
  .desc {
    font-size: 13px;
    color: #717171;
  }
`;

const StripeConnectCard = styled.div`
  border-radius: 8px;
  border: 1px solid #e2e3e5;
  background-color: #ffffff;
  margin-top: 16px;
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e2e3e5;
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const CardBody = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${(props) => props.color || "#e2e8f0"};
  color: ${(props) => props.$textColor || "#334155"};
`;

const HoursRow = styled(Row)`
  align-items: center;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 8px;
  background: ${(props) => (props.$isClosed ? "#f8f9fa" : "transparent")};

  .day-label {
    font-weight: 600;
    color: ${(props) => props.theme.token.colorTextSecondary};
  }
`;

const ApplyAllCheckbox = styled(Checkbox)`
  margin-top: 1rem;
  font-weight: 500;
`;

const statusMap = {
  unlinked: {
    text: "Not Connected",
    color: "#e2e8f0",
    textColor: "#334155",
    icon: <CreditCard size={24} color="#64748b" />,
  },
  pending: {
    text: "Pending Verification",
    color: "#fef3c7",
    textColor: "#92400e",
    icon: <RefreshCw size={24} color="#d97706" />,
  },
  restricted: {
    text: "Account Restricted",
    color: "#fee2e2",
    textColor: "#991b1b",
    icon: <Info size={24} color="#ef4444" />,
  },
  active: {
    text: "Connected & Active",
    color: "#d1fae5",
    textColor: "#065f46",
    icon: <CheckCircle size={24} color="#059669" />,
  },
  incomplete: {
    text: "Incomplete Setup",
    color: "#fee2e2",
    textColor: "#991b1b",
    icon: <Info size={24} color="#ef4444" />,
  },
};

function PreferencesSettingsTabContent({
  form,
  stripeStatus,
  isMobile,
  refetchBusinessData,
}) {
  const [connectLoading, setConnectLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const businessHours = Form.useWatch("businessHours", form);

  // Replace react-router-dom hooks with Next.js hooks
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const isStripeReturn =
      localStorage.getItem("stripeOnboardingStatus") === "returned";

    if (isStripeReturn) {
      setIsSyncing(true);
      message.loading({
        content: "Syncing latest account status from Stripe...",
        key: "syncing",
        duration: 0,
      });

      let attempts = 0;
      const maxAttempts = 5;

      const intervalId = setInterval(async () => {
        attempts++;
        console.log(`Stripe status sync attempt #${attempts}`);

        try {
          const freshData = await businessService.getMyBusinessProfile();
          const newStripeStatus = freshData?.data?.stripe_account_status;

          if (
            (newStripeStatus && newStripeStatus !== "incomplete") ||
            attempts >= maxAttempts
          ) {
            clearInterval(intervalId);
            message.success({
              content: "Status synchronized!",
              key: "syncing",
              duration: 1,
            });
            setIsSyncing(false);
            localStorage.removeItem("stripeOnboardingStatus");

            // Replace navigate with router.replace
            router.replace(pathname + "#payout-setup-section");

            switch (newStripeStatus) {
              case "active":
                message.success({
                  content:
                    "Your Stripe account is now active! You can now receive payouts.",
                  duration: 5,
                });
                break;
              case "pending":
                message.info({
                  content:
                    "Your Stripe account is pending verification. Please check back later.",
                  duration: 5,
                });
                break;
              case "restricted":
                message.error({
                  content:
                    "Your Stripe account has restrictions. Please navigate to Stripe to resolve them.",
                  duration: 5,
                });
                break;
              case "incomplete":
                message.warning({
                  content:
                    "Your Stripe account setup is incomplete. Please continue the onboarding process.",
                  duration: 5,
                });
                break;
              default:
                message.info({
                  content: "Your Stripe account status is unchanged.",
                  duration: 5,
                });
                break;
            }
          }
        } catch (error) {
          console.error("Error during polling for Stripe status:", error);
          clearInterval(intervalId);
          message.error({
            content: "Could not sync status. Please refresh.",
            key: "syncing",
            duration: 3,
          });
          setIsSyncing(false);
          localStorage.removeItem("stripeOnboardingStatus");

          // Replace navigate with router.replace
          router.replace(pathname + "#payout-setup-section");
        }
      }, 2500);

      return () => clearInterval(intervalId);
    }
  }, [refetchBusinessData, router, pathname]);

  const handleConnectStripe = async () => {
    setConnectLoading(true);
    message.loading({ content: "Connecting to Stripe...", key: "stripe" });
    try {
      const response = await businessService.createStripeAccountLink();
      if (response.success && response.data?.accountLinkUrl) {
        localStorage.setItem("stripeOnboardingStatus", "pending");
        if (typeof window !== "undefined") {
          window.location.href = response.data.accountLinkUrl;
        }
      } else {
        message.error({
          content: response.error || "Failed to create Stripe link.",
          key: "stripe",
        });
      }
    } catch (error) {
      message.error({
        content: "An unexpected error occurred.",
        key: "stripe",
      });
    } finally {
      setConnectLoading(false);
    }
  };

  const stripeButtonInfo = (() => {
    switch (stripeStatus) {
      case "active":
        return {
          text: "Manage Payouts",
          action: handleConnectStripe,
          icon: <ExternalLink size={16} />,
        };
      case "pending":
        return {
          text: "Continue Onboarding",
          action: handleConnectStripe,
          icon: <ExternalLink size={16} />,
        };
      case "restricted":
      case "incomplete":
        return {
          text: "Update Account Details",
          action: handleConnectStripe,
          icon: <ExternalLink size={16} />,
        };
      default:
        return {
          text: "Setup Payouts",
          action: handleConnectStripe,
          icon: <CreditCard size={16} />,
        };
    }
  })();
  const stripeStatusInfo = statusMap[stripeStatus] || statusMap.unlinked;

  return (
    <Form
      form={form}
      layout="vertical"
      name="preferencesSettingsForm"
      requiredMark="optional"
    >
      <FormSectionCard isDrawer={true}>
        <SectionDivider>
          <span>
            <Clock size={16} /> Schedule & Display
          </span>
        </SectionDivider>
        <FormGroup>
          <FormLabel>
            <Clock /> Business Hours
          </FormLabel>
          <HelpText>
            <InfoCircleOutlined /> Default operating hours for each day of the
            week.
          </HelpText>
          <Form.Item
            name="businessHours"
            rules={[
              {
                validator: async (_, hours) => {
                  if (!hours || !hours.some((day) => day.isOpen)) {
                    return Promise.reject(
                      new Error("Please set hours for at least one open day.")
                    );
                  }
                  for (const day of hours) {
                    if (
                      day.isOpen &&
                      (!day.time || !day.time[0] || !day.time[1])
                    ) {
                      return Promise.reject(
                        new Error(
                          `Please set both opening and closing times for ${day.day}.`
                        )
                      );
                    }
                    if (
                      day.isOpen &&
                      day.time &&
                      day.time[0] &&
                      day.time[1] &&
                      day.time[0].isAfter(day.time[1])
                    ) {
                      return Promise.reject(
                        new Error(
                          `Closing time must be after opening time for ${day.day}.`
                        )
                      );
                    }
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <>
              {(businessHours || []).map((day, index) => (
                <HoursRow key={day.day} gutter={16} $isClosed={!day.isOpen}>
                  <Col xs={24} sm={4}>
                    <span className="day-label">{day.day}</span>
                  </Col>
                  <Col xs={12} sm={4}>
                    <Form.Item
                      name={["businessHours", index, "isOpen"]}
                      valuePropName="checked"
                      noStyle
                    >
                      <Checkbox>{day.isOpen ? "Open" : "Closed"}</Checkbox>
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={16}>
                    <Form.Item name={["businessHours", index, "time"]} noStyle>
                      <TimePicker.RangePicker
                        use12Hours
                        format="h:mm A"
                        minuteStep={15}
                        disabled={!day.isOpen}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                </HoursRow>
              ))}
            </>
          </Form.Item>
        </FormGroup>
        <FormGroup>
          <FormLabel>
            <Globe /> Timezone
          </FormLabel>
          <HelpText>
            <InfoCircleOutlined /> Primary timezone for your business
            operations.
          </HelpText>
          <Form.Item
            name="business_timezone"
            rules={[{ required: true, message: "Timezone is required" }]}
          >
            <Select
              showSearch
              placeholder="Select Time Zone"
              optionFilterProp="children"
              options={timezones}
            />
          </Form.Item>
        </FormGroup>

        <FormGroup>
          <FormLabel>
            <Shield /> Contact Info Privacy
          </FormLabel>
          <HelpText>
            <InfoCircleOutlined /> Control who can see your business phone and
            email on public pages.
          </HelpText>
          <Form.Item
            name="contact_privacy"
            rules={[
              { required: true, message: "Please select a privacy option" },
            ]}
          >
            <Radio.Group>
              <Radio.Button value="on_booking">Show After Booking</Radio.Button>
              <Radio.Button value="public">Show Publicly</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </FormGroup>

        <SectionDivider>
          <span>
            <Bell size={16} /> Notification Preferences
          </span>
        </SectionDivider>
        <FormGroup>
          <Form.Item name="newBookingNotification" valuePropName="checked">
            <SwitchLabelContainer>
              <SwitchInfo>
                <div className="title">New Booking Notifications</div>
                <div className="desc">Receive email for new bookings</div>
              </SwitchInfo>
              <Switch />
            </SwitchLabelContainer>
          </Form.Item>
        </FormGroup>
        <FormGroup>
          <Form.Item name="cancellationNotification" valuePropName="checked">
            <SwitchLabelContainer>
              <SwitchInfo>
                <div className="title">Cancellation Notifications</div>
                <div className="desc">
                  Receive email when bookings are cancelled
                </div>
              </SwitchInfo>
              <Switch />
            </SwitchLabelContainer>
          </Form.Item>
        </FormGroup>
        <FormGroup>
          <Form.Item name="reminderNotification" valuePropName="checked">
            <SwitchLabelContainer>
              <SwitchInfo>
                <div className="title">Class Reminders</div>
                <div className="desc">
                  Receive email reminders before classes start
                </div>
              </SwitchInfo>
              <Switch />
            </SwitchLabelContainer>
          </Form.Item>
        </FormGroup>
        <FormGroup>
          <Form.Item name="smsNotifications" valuePropName="checked">
            <SwitchLabelContainer>
              <SwitchInfo>
                <div className="title">SMS Notifications (Future)</div>
                <div className="desc">
                  Receive critical notifications via SMS
                </div>
              </SwitchInfo>
              <Switch disabled />
            </SwitchLabelContainer>
          </Form.Item>
          <HelpText>
            <InfoCircleOutlined /> SMS requires phone verification and setup
            (feature coming soon).
          </HelpText>
        </FormGroup>

        <div id="payout-setup-section">
          <SectionDivider>
            <span>
              <CreditCard size={16} /> Payout Setup
            </span>
          </SectionDivider>

          <Spin spinning={isSyncing} tip="Synchronizing account status...">
            <StripeConnectCard>
              <CardHeader>
                <HeaderInfo>
                  {stripeStatusInfo.icon}
                  <span>Payout Account Status</span>
                </HeaderInfo>
                <StatusBadge
                  color={stripeStatusInfo.color}
                  $textColor={stripeStatusInfo.textColor}
                >
                  {stripeStatusInfo.text}
                </StatusBadge>
              </CardHeader>

              <CardBody>
                {stripeStatus === "active" && (
                  <Alert
                    style={{ width: "100%" }}
                    message="Payouts Active"
                    description="Your account is connected and ready to receive payouts. No further action is required."
                    type="success"
                    showIcon
                  />
                )}
                {stripeStatus === "restricted" && (
                  <Alert
                    style={{ width: "100%" }}
                    message="Action Required"
                    description="Please navigate to Stripe to resolve account restrictions. You may need to provide identity verification or additional business information."
                    type="error"
                    showIcon
                  />
                )}
                {stripeStatus === "pending" && (
                  <Alert
                    style={{ width: "100%" }}
                    message="Verification Pending"
                    description="Stripe is reviewing your account. This can take a few business days."
                    type="info"
                    showIcon
                  />
                )}
                {stripeStatus === "incomplete" && (
                  <Alert
                    style={{ width: "100%" }}
                    message="Onboarding Incomplete"
                    description="Click the button below to continue the setup process on Stripe."
                    type="warning"
                    showIcon
                  />
                )}

                <Button
                  type="primary"
                  icon={stripeButtonInfo.icon}
                  onClick={stripeButtonInfo.action}
                  loading={connectLoading}
                  style={{ marginTop: 8 }}
                >
                  {stripeButtonInfo.text}
                </Button>
                <HelpText
                  style={{
                    textAlign: "center",
                    justifyContent: "center",
                    maxWidth: "350px",
                  }}
                >
                  You'll be redirected to Stripe's secure platform. ClassEasily
                  does not store your bank details.
                </HelpText>
              </CardBody>
            </StripeConnectCard>
          </Spin>
        </div>
      </FormSectionCard>
    </Form>
  );
}

const PreferencesSettingsTab = (props) => {
  return (
    <Suspense fallback={<div style={{ minHeight: "400px" }} />}>
      <PreferencesSettingsTabContent {...props} />
    </Suspense>
  );
};

export default PreferencesSettingsTab;
