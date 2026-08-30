"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  ChevronLeft,
} from "lucide-react";
import {
  ConfigProvider,
  Form,
  Input,
  Button as AntButton,
  Checkbox,
  Select,
} from "antd";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PLANS } from "@/lib/subscriptionPlans";
import { businessService } from "@/services/apiService";
import {
  signInWithDjango,
  signInWithGoogle,
  signUpWithDjango,
} from "@/lib/auth-client";
import { useAuthUser } from "@/hooks/useAuthUser";
import GoogleOAuthWrapper from "@/components/auth/GoogleOAuthWrapper";
import {
  marketingTheme as t,
  REGISTER_HREF,
  SUPPORT_EMAIL,
} from "@/components/marketing/tokens";
import dynamic from "next/dynamic";
import OnboardAmbient from "./OnboardAmbient";
import PayoutFlowScene from "./PayoutFlowScene";
import PlanPicker from "./PlanPicker";

const LogoIcon = dynamic(() => import("@/components/common/logoIcon"), {
  ssr: false,
});

const IS_DEV = process.env.NODE_ENV === "development";

const STEPS = [
  { id: "account", label: "Account", skippable: IS_DEV },
  { id: "business", label: "Business", skippable: false },
  { id: "plan", label: "Plan", skippable: false },
  { id: "pay", label: "Pay", skippable: IS_DEV },
  { id: "timezone", label: "Timezone", skippable: true },
  { id: "connect", label: "Payouts", skippable: true },
  { id: "preview", label: "Widget", skippable: true },
];

const antdTheme = {
  token: {
    colorPrimary: "#fc4056",
    colorText: "#222222",
    colorTextBase: "#222222",
    colorTextHeading: "#222222",
    colorTextSecondary: "#6A6A6A",
    colorTextLabel: "#222222",
    colorLink: "#fc4056",
    colorBorder: "#DDDDDD",
    colorBorderSecondary: "#EBEBEB",
    fontFamily: t.fonts.body,
    borderRadius: 12,
    controlHeight: 48,
  },
  components: {
    Button: {
      primaryShadow: "none",
      fontWeight: 600,
      controlHeight: 48,
      borderRadius: 999,
    },
    Form: {
      labelColor: "#222222",
      itemMarginBottom: 12,
    },
    Checkbox: {
      colorText: "#222222",
    },
    Select: {
      controlHeight: 48,
      borderRadius: 12,
    },
    Input: {
      borderRadius: 12,
    },
  },
};

const spring = { type: "spring", stiffness: 380, damping: 28 };

const TIMEZONES = (() => {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [
      "America/Toronto",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Vancouver",
      "UTC",
    ];
  }
})();

function stepCopy(step, name, plan) {
  const business = name || "your business";
  switch (step) {
    case "account":
      return {
        eyebrow: "Let’s get you set up",
        title: "Start with your account",
        paragraphs: [
          "Create a login for your ClassEasily workspace. You’ll use it to manage bookings, customers, schedules, and payouts from one dashboard.",
          "If you already have an account, switch to log in and we’ll pick up where you left off.",
        ],
      };
    case "business":
      return {
        eyebrow: "Your public details",
        title: "Tell us about the business",
        paragraphs: [
          `This is the name and contact info on your widget, receipts, and confirmation emails. Use the name ${business === "your business" ? "your customers already know" : business} — you can add locations, hours, and photos from the dashboard after this.`,
          "We also use your website to whitelist the embed, so the booking widget only loads on your domain.",
        ],
      };
    case "plan":
      return {
        eyebrow: "Pricing that scales with bookings",
        title: "Pick a plan",
        paragraphs: [
          "Estimate a typical month. We’ll mark the lowest-cost plan — you can still choose any of the three.",
        ],
      };
    case "pay":
      return {
        eyebrow: "Activate your subscription",
        title: "Activate ClassEasily",
        paragraphs: [
          `You’re starting the ${plan?.name || "selected"} plan at $${plan?.price || "—"}/mo CAD, plus ${plan?.commission ?? "—"}% per paid booking. This is your ClassEasily subscription — booking payouts are set up separately with Stripe Connect in a later step.`,
          "You can change or cancel the plan from the dashboard. After this we’ll set timezone, payouts, and a widget preview.",
        ],
      };
    case "timezone":
      return {
        eyebrow: "One clock for bookings, emails, and the widget",
        title: "Set your timezone",
        paragraphs: [
          "The calendar, widget times, and reminder emails all use this timezone. A mismatch shows the wrong local time on confirmations.",
          "We’ve pre-selected it from this browser. If you operate in more than one city, pick your primary location; you can still set exceptions on individual listings. Change this anytime in Settings.",
        ],
      };
    case "connect":
      return {
        eyebrow: "Booking payouts",
        title: "Get paid for bookings",
        paragraphs: [
          "Stripe Connect deposits booking revenue to your bank — typically a day or two after completion. ClassEasily doesn’t hold that money; the subscription you just started is separate.",
          "You’ll need a legal name, address, and bank details. Stripe may also ask for ID. You can skip this for now and finish it later from Settings — payouts stay paused until Connect is complete.",
        ],
      };
    case "preview":
      return {
        eyebrow: "You’re through the boring part",
        title: `${name || "Your widget"} is ready to embed`,
        paragraphs: [
          "This is a preview of the booking widget: your name, a listing, a time, a price, and a reserve button. The live widget uses your real schedule, capacity, and brand once you add something to book.",
          "In the dashboard, add your first listing, copy the embed snippet, and paste it on your site. That’s account, plan, widget — you’re set.",
        ],
      };
    default:
      return {
        eyebrow: "Get started",
        title: "Get started",
        paragraphs: [],
      };
  }
}

function tzLabel(zone) {
  const readable = String(zone || "").replace(/_/g, " ");
  try {
    const name = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "short",
    })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;
    return name ? `${readable} (${name})` : readable;
  } catch {
    return readable;
  }
}

const Page = styled.div`
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #fff;
  font-family: ${t.fonts.body};
  color: #222;
  overflow: hidden;
`;

const Top = styled.header`
  flex-shrink: 0;
  z-index: 20;
  height: 72px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  padding: 0 28px;
  background: #fff;

  @media (max-width: 640px) {
    height: 64px;
    padding: 0 16px;
    grid-template-columns: auto 1fr;
  }
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #222;
  font-weight: 800;
  font-size: 16px;
  flex-shrink: 0;
`;

const StepMeta = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6a6a6a;
  text-align: center;

  @media (max-width: 640px) {
    display: none;
  }
`;

const TopActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  min-width: 0;

  a,
  button {
    font-family: inherit;
  }
`;

const TextLinkBtn = styled.button`
  appearance: none;
  background: none;
  border: none;
  color: #222;
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 8px;

  &:hover {
    background: #f7f7f7;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Questions = styled.a`
  color: #222;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  padding: 8px 10px;
  border-radius: 8px;

  &:hover {
    background: #f7f7f7;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (max-width: 640px) {
    display: none;
  }
`;

const ProgressTrack = styled.div`
  height: 4px;
  background: #ebebeb;
  flex-shrink: 0;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: ${t.colors.primary};
  border-radius: 0 99px 99px 0;
  transition: width 0.35s ease;
`;

const Main = styled.main`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-anchor: none;
  scrollbar-gutter: stable;
  --onboard-pad-x: 28px;
  --onboard-pad-t: 40px;
  --onboard-pad-b: 32px;
  padding: var(--onboard-pad-t) var(--onboard-pad-x) var(--onboard-pad-b);
  position: relative;
  container-type: size;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 860px) {
    --onboard-pad-x: 20px;
    --onboard-pad-t: 24px;
    --onboard-pad-b: 20px;
  }
`;

const Shell = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: ${(p) => (p.$wide ? "1120px" : "1080px")};
  margin: 0 auto;
  display: grid;
  grid-template-columns: ${(p) =>
    p.$wide ? "1fr" : "minmax(0, 0.92fr) auto minmax(0, 1.08fr)"};
  align-items: start;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const ColRule = styled.div`
  width: 1px;
  margin: 4px 28px;
  align-self: stretch;
  background: linear-gradient(
    180deg,
    transparent 0%,
    #e8e8e8 8%,
    #e8e8e8 92%,
    transparent 100%
  );

  @media (max-width: 860px) {
    display: none;
  }
`;

const Story = styled.div`
  position: ${(p) => (p.$plain ? "static" : "sticky")};
  top: 8px;
  padding-top: 4px;
  min-width: 0;
  ${(p) =>
    p.$plain
      ? `
    max-width: 1120px;
    margin-bottom: 20px;
  `
      : ""}

  @media (max-width: 860px) {
    position: static;
  }
`;

const StepSlot = styled.div`
  position: relative;
`;

const Panel = styled.div`
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 20px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  min-width: 0;
`;

const PanelMeasure = styled.div`
  padding: 28px;

  @media (max-width: 640px) {
    padding: 20px;
  }
`;

const Eyebrow = styled.p`
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${t.colors.primary};
`;

const Title = styled.h1`
  margin: 0 0 16px;
  font-size: clamp(30px, 4.2vw, 44px);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.12;
  color: #222;
  min-height: ${(p) => (p.$compact ? "0" : "calc(1.12em * 2)")};
`;

const Lead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: ${(p) => (p.$wide ? "36em" : "460px")};

  p {
    margin: 0;
    font-size: 16px;
    line-height: 1.65;
    color: #6a6a6a;
  }
`;

const FormWrap = styled.div`
  .ant-form-item-label {
    padding-bottom: 4px !important;
  }

  .ant-form-item-label > label {
    font-weight: 600;
    font-size: 14px;
    height: auto;
  }

  .ant-form-item-extra {
    color: #6a6a6a;
    font-size: 13px;
    line-height: 1.45;
    padding-top: 4px;
  }

  .ant-input,
  .ant-input-affix-wrapper,
  .ant-select-selector {
    border-radius: 12px !important;
  }

  .ant-checkbox-wrapper {
    font-size: 14px;
    line-height: 1.5;
    color: #222;
  }

  a {
    color: #222;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

const ErrorText = styled.p`
  color: #c13515;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px;
  padding: 12px 14px;
  background: #fff8f6;
  border: 1px solid #e8d5d0;
  border-radius: 12px;
`;

const ModeSwitch = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 5px;
  background: #f7f7f7;
  border-radius: 999px;
  margin-bottom: 16px;
`;

const ModeBtn = styled.button`
  appearance: none;
  border: none;
  background: ${(p) => (p.$on ? "#fff" : "transparent")};
  color: #222;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  height: 40px;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: ${(p) => (p.$on ? "0 1px 3px rgba(0,0,0,0.08)" : "none")};
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 16px;
  color: #6a6a6a;
  font-size: 13px;
  font-weight: 600;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #ebebeb;
  }
`;

const Note = styled.aside`
  margin-top: ${(p) => (p.$flush ? "0" : "20px")};
  padding: 18px 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  font-size: 14px;
  line-height: 1.55;
  color: #222;

  strong {
    display: block;
    margin-bottom: 4px;
    font-size: 13px;
    font-weight: 700;
  }

  p {
    margin: 0;
    color: #6a6a6a;
  }
`;

const LegalStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  margin-bottom: 8px;
`;

const InfoCard = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: ${(p) => (p.$flush ? "0" : "4px")};
`;

const InfoBlock = styled.div`
  padding: 18px 20px;
`;

const InfoRule = styled.div`
  height: 1px;
  background: #ebebeb;
  margin: 0 20px;
`;

const InfoLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const InfoText = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: #6a6a6a;
`;

const RecapTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

const RecapName = styled.div`
  font-size: 18px;
  font-weight: 800;
`;

const RecapPrice = styled.div`
  font-size: 18px;
  font-weight: 800;
  white-space: nowrap;
`;

const RecapMeta = styled.p`
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.55;
  color: #6a6a6a;
`;

const SampleKicker = styled.div`
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6a6a6a;
  margin-bottom: 6px;
`;

const SampleTime = styled.div`
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.25;
`;

const SampleSub = styled.p`
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: #6a6a6a;
`;

const UsesList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
  font-size: 14px;
  color: #222;

  li {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    line-height: 1.45;
  }

  svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: #111;
  }
`;

const WidgetMock = styled.div`
  border: 1px solid #ebebeb;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
`;

const WidgetBar = styled.div`
  padding: 14px 18px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 800;
  font-size: 15px;
`;

const WidgetBody = styled.div`
  padding: 18px;
`;

const WidgetClass = styled.div`
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

const WidgetMeta = styled.p`
  margin: 6px 0 14px;
  font-size: 14px;
  color: #6a6a6a;
  line-height: 1.5;
`;

const WidgetRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const WidgetPrice = styled.div`
  font-size: 20px;
  font-weight: 800;
`;

const Reserve = styled.div`
  background: ${t.colors.primary};
  color: #fff;
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 700;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const NextList = styled.ol`
  margin: 0 0 8px;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
  counter-reset: next;
`;

const NextItem = styled.li`
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 12px;
  align-items: start;
  counter-increment: next;

  &::before {
    content: counter(next);
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: #f7f7f7;
    color: #222;
    font-size: 13px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  strong {
    display: block;
    font-size: 14px;
    margin-bottom: 2px;
  }

  span {
    font-size: 13px;
    line-height: 1.5;
    color: #6a6a6a;
  }
`;

const Footer = styled.footer`
  flex-shrink: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 28px 18px;
  background: #fff;
  border-top: 1px solid #ebebeb;

  @media (max-width: 640px) {
    padding: 12px 16px 16px;
  }
`;

const BackBtn = styled.button`
  appearance: none;
  background: none;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  color: #222;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  padding: 8px 4px;
  opacity: ${(p) => (p.disabled ? 0 : 1)};
  pointer-events: ${(p) => (p.disabled ? "none" : "auto")};

  &:hover {
    color: #000;
  }
`;

const FooterRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-height: 48px;
`;

const PrimaryBtn = styled(AntButton)`
  && {
    height: 48px;
    padding: 0 28px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 16px;
  }

  @media (max-width: 640px) {
    && {
      padding: 0 20px;
    }
  }
`;

function StepIntro({ eyebrow, title, paragraphs, reduceMotion, wide }) {
  const words = String(title).split(" ");
  const bodyDelay = reduceMotion ? 0 : words.length * 0.05 + 0.16;

  return (
    <>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={reduceMotion ? false : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Eyebrow>{eyebrow}</Eyebrow>
      </motion.div>
      <Title $compact={wide}>
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{ ...spring, delay: reduceMotion ? 0 : i * 0.05 }}
            style={{ display: "inline-block", marginRight: "0.22em" }}
          >
            {word}
          </motion.span>
        ))}
      </Title>
      <Lead $wide={wide}>
        {paragraphs.map((text, i) => (
          <motion.p
            key={text.slice(0, 48)}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{
              delay: bodyDelay + i * 0.12,
              duration: 0.4,
            }}
          >
            {text}
          </motion.p>
        ))}
      </Lead>
    </>
  );
}

export default function RegisterFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuthUser();
  const reduceMotion = useReducedMotion();
  const mainRef = useRef(null);
  const [step, setStep] = useState("account");
  const [minStep, setMinStep] = useState("account");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [planId, setPlanId] = useState(searchParams.get("plan") || "growth");
  const [businessName, setBusinessName] = useState("");
  const [timezone, setTimezone] = useState(
    (typeof Intl !== "undefined" &&
      Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      "America/Toronto",
  );
  const [mode, setMode] = useState("signup");

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const minIndex = STEPS.findIndex((s) => s.id === minStep);
  const selectedPlan = PLANS.find((p) => p.id === planId);
  const copy = stepCopy(step, businessName, selectedPlan);
  const canBack = stepIndex > Math.max(0, minIndex);
  const current = STEPS[stepIndex];

  const detectedZone = useMemo(
    () =>
      (typeof Intl !== "undefined" &&
        Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      "America/Toronto",
    [],
  );

  const goDashboard = useCallback(async () => {
    await businessService.completeOnboarding();
    router.replace("/business/dashboard");
  }, [router]);

  const skip = useCallback(() => {
    const next = STEPS[stepIndex + 1];
    if (!next) {
      goDashboard();
      return;
    }
    setError("");
    setStep(next.id);
  }, [goDashboard, stepIndex]);

  const goBack = useCallback(() => {
    if (!canBack) return;
    setError("");
    setStep(STEPS[stepIndex - 1].id);
  }, [canBack, stepIndex]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [step]);

  useEffect(() => {
    const qStep = searchParams.get("step");
    if (qStep && STEPS.some((s) => s.id === qStep)) {
      setStep(qStep);
    }
    const qPlan = searchParams.get("plan");
    if (qPlan) setPlanId(qPlan);
  }, [searchParams]);

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    (async () => {
      if (!isAuthenticated) {
        if (IS_DEV) return;
        if (!searchParams.get("step")) setStep("account");
        return;
      }
      const state = await businessService.getOnboardingState();
      if (cancelled || !state.success) return;
      const d = state.data || {};
      if (d.business_name) setBusinessName(d.business_name);
      if (d.timezone) setTimezone(d.timezone);
      if (d.has_paid_subscription && d.onboarding_completed) {
        router.replace("/business/dashboard");
        return;
      }
      if (d.has_paid_subscription) {
        setMinStep("timezone");
        const qStep = searchParams.get("step");
        if (!qStep || ["account", "business", "plan", "pay"].includes(qStep)) {
          setStep("timezone");
        }
        return;
      }
      if (d.has_business) {
        setMinStep("plan");
        const qStep = searchParams.get("step");
        if (!qStep || ["account", "business"].includes(qStep)) {
          setStep("plan");
        }
      } else {
        setStep("business");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, router, searchParams]);

  const onGoogle = async (tokenResponse) => {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle(tokenResponse.access_token, null);
      setStep("business");
    } catch (e) {
      setError(e.message || "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const submitAccount = async (values) => {
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUpWithDjango({
          email: values.email,
          password1: values.password,
          password2: values.password,
          first_name: values.firstName,
        });
      }
      await signInWithDjango(values.email, values.password, null);
      setStep("business");
    } catch (err) {
      const msg =
        err?.email?.[0] ||
        err?.password1?.[0] ||
        err?.message ||
        "Could not sign in. Check your details.";
      setError(typeof msg === "string" ? msg : "Could not create account.");
    } finally {
      setBusy(false);
    }
  };

  const submitBusiness = async (values) => {
    setError("");
    if (!values.terms || !values.privacy) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }
    setBusy(true);
    try {
      const result = await businessService.registerBusiness({
        businessName: values.businessName,
        website: values.website,
        studentContactPhone: values.phone,
        termsAccepted: true,
        privacyAccepted: true,
        plan_id: planId,
      });
      if (!result.success) {
        if (IS_DEV) {
          setBusinessName(values.businessName);
          setMinStep("plan");
          setStep("plan");
          setBusy(false);
          return;
        }
        const err = result.error;
        const first =
          err?.error?.businessName?.[0] ||
          err?.error?.website?.[0] ||
          err?.error?.studentContactPhone?.[0] ||
          err?.error ||
          "Could not create your business.";
        setError(typeof first === "string" ? first : JSON.stringify(first));
        setBusy(false);
        return;
      }
      setBusinessName(values.businessName);
      setMinStep("plan");
      setStep("plan");
    } finally {
      setBusy(false);
    }
  };

  const startCheckout = async () => {
    setError("");
    setBusy(true);
    try {
      const origin = window.location.origin;
      const result = await businessService.createWidgetSubscriptionCheckout({
        plan_id: planId,
        billing_interval: "month",
        success_url: `${origin}${REGISTER_HREF}?step=timezone`,
        cancel_url: `${origin}${REGISTER_HREF}?step=pay&plan=${planId}`,
      });
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setError(result.error || "Could not start checkout.");
    } finally {
      setBusy(false);
    }
  };

  const saveTimezone = async () => {
    setBusy(true);
    await businessService.updateMyBusinessProfile({
      business_timezone: timezone,
    });
    setBusy(false);
    setStep("connect");
  };

  const startConnect = async () => {
    setBusy(true);
    setError("");
    const result = await businessService.createStripeAccountLink("onboarding");
    setBusy(false);
    if (result.success && result.data?.accountLinkUrl) {
      window.location.href = result.data.accountLinkUrl;
      return;
    }
    setError(result.error || "Could not start Stripe Connect.");
  };

  const sampleTime = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(new Date());
    } catch {
      return timezone;
    }
  }, [timezone]);

  const primary = (() => {
    switch (step) {
      case "account":
        return {
          label: "Continue",
          htmlType: "submit",
          form: "onboarding-form",
        };
      case "business":
        return {
          label: "Continue",
          htmlType: "submit",
          form: "onboarding-form",
        };
      case "plan":
        return {
          label: `Continue with ${selectedPlan?.name || "this plan"}`,
          onClick: () => setStep("pay"),
        };
      case "pay":
        return {
          label: "Continue to payment",
          onClick: startCheckout,
        };
      case "timezone":
        return { label: "Save timezone", onClick: saveTimezone };
      case "connect":
        return { label: "Connect Stripe", onClick: startConnect };
      case "preview":
        return { label: "Go to dashboard", onClick: goDashboard };
      default:
        return { label: "Continue" };
    }
  })();

  return (
    <ConfigProvider theme={antdTheme}>
      <Page>
        <Top>
          <Brand href="/">
            <LogoIcon
              size={24}
              isScrolled
              restingColor={t.colors.accent}
              activeColor={t.colors.accent}
            />
            ClassEasily
          </Brand>
          <StepMeta>
            Step {stepIndex + 1} of {STEPS.length} · {current?.label}
          </StepMeta>
          <TopActions>
            {current?.skippable ? (
              <TextLinkBtn type="button" onClick={skip}>
                {IS_DEV && !["timezone", "connect", "preview"].includes(step)
                  ? "Skip (dev)"
                  : "Skip"}
              </TextLinkBtn>
            ) : (
              <span />
            )}
            <Questions href={`mailto:${SUPPORT_EMAIL}`}>Questions?</Questions>
          </TopActions>
        </Top>
        <ProgressTrack>
          <ProgressFill $pct={((stepIndex + 1) / STEPS.length) * 100} />
        </ProgressTrack>
        <Main ref={mainRef}>
          <OnboardAmbient step={step} reduceMotion={reduceMotion} />
          <Shell $wide={step === "plan"}>
            <Story $plain={step === "plan"}>
              <StepSlot>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={step}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, pointerEvents: "none" }}
                    transition={{ duration: 0.2 }}
                    style={{ width: "100%" }}
                  >
                    <StepIntro
                      eyebrow={copy.eyebrow}
                      title={copy.title}
                      paragraphs={copy.paragraphs}
                      reduceMotion={reduceMotion}
                      wide={step === "plan"}
                    />
                  </motion.div>
                </AnimatePresence>
              </StepSlot>
            </Story>
            {step === "plan" ? (
              <PlanPicker planId={planId} onChange={setPlanId} />
            ) : (
              <>
            <ColRule aria-hidden />
            <Panel>
              <PanelMeasure>
              {error && <ErrorText role="alert">{error}</ErrorText>}
              <StepSlot>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={step}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1, pointerEvents: "auto" }}
                  exit={
                    reduceMotion
                      ? { pointerEvents: "none" }
                      : { opacity: 0, pointerEvents: "none" }
                  }
                  transition={{ duration: 0.2 }}
                  style={{ width: "100%" }}
                >
                {step === "account" && (
                  <FormWrap>
                    <ModeSwitch>
                      <ModeBtn
                        type="button"
                        $on={mode === "signup"}
                        aria-pressed={mode === "signup"}
                        onClick={() => setMode("signup")}
                      >
                        Sign up
                      </ModeBtn>
                      <ModeBtn
                        type="button"
                        $on={mode === "login"}
                        aria-pressed={mode === "login"}
                        onClick={() => setMode("login")}
                      >
                        Log in
                      </ModeBtn>
                    </ModeSwitch>
                    <Form
                      id="onboarding-form"
                      layout="vertical"
                      requiredMark={false}
                      scrollToFirstError
                      onFinish={submitAccount}
                    >
                      {mode === "signup" && (
                        <Form.Item
                          label="First name"
                          name="firstName"
                          rules={[
                            { required: true, message: "Enter your first name" },
                          ]}
                        >
                        <Input
                          autoComplete="given-name"
                          size="large"
                          autoFocus
                          placeholder="Jane"
                        />
                        </Form.Item>
                      )}
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                          { required: true, message: "Enter your email" },
                          { type: "email", message: "Enter a valid email" },
                        ]}
                      >
                        <Input
                          type="email"
                          autoComplete="email"
                          size="large"
                          placeholder="you@yourbusiness.com"
                        />
                      </Form.Item>
                      <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                          { required: true, message: "Enter a password" },
                          { min: 8, message: "At least 8 characters" },
                        ]}
                      >
                        <Input.Password
                          autoComplete={
                            mode === "signup"
                              ? "new-password"
                              : "current-password"
                          }
                          size="large"
                          placeholder={
                            mode === "signup"
                              ? "At least 8 characters"
                              : "Your password"
                          }
                        />
                      </Form.Item>
                    </Form>
                    <Divider>or</Divider>
                    <GoogleOAuthWrapper
                      onSuccess={onGoogle}
                      onError={() => setError("Google sign-in failed.")}
                      disabled={busy}
                    />
                    {IS_DEV && (
                      <AntButton
                        type="link"
                        block
                        onClick={() => {
                          setError("");
                          setStep("business");
                        }}
                        style={{ marginTop: 8 }}
                      >
                        Skip login (dev)
                      </AntButton>
                    )}
                  </FormWrap>
                )}

                {step === "business" && (
                  <FormWrap>
                    <Form
                      id="onboarding-form"
                      layout="vertical"
                      requiredMark={false}
                      scrollToFirstError
                      onFinish={submitBusiness}
                    >
                      <Form.Item
                        label="Business name"
                        name="businessName"
                        rules={[
                          {
                            required: true,
                            message: "Enter your business name",
                          },
                        ]}
                      >
                        <Input
                          size="large"
                          placeholder="Northside Clay Co."
                          autoComplete="organization"
                          autoFocus
                        />
                      </Form.Item>
                      <Form.Item
                        label="Website"
                        name="website"
                        extra="Used to whitelist the booking widget so it only loads on your domain."
                        rules={[
                          { required: true, message: "Enter your website" },
                        ]}
                      >
                        <Input
                          placeholder="yourbusiness.com"
                          size="large"
                          autoComplete="url"
                        />
                      </Form.Item>
                      <Form.Item
                        label="Phone"
                        name="phone"
                        rules={[
                          { required: true, message: "Enter a phone number" },
                        ]}
                      >
                        <Input
                          placeholder="+1 555 123 4567"
                          size="large"
                          autoComplete="tel"
                          inputMode="tel"
                        />
                      </Form.Item>
                      <LegalStack>
                        <Form.Item
                          name="terms"
                          valuePropName="checked"
                          style={{ marginBottom: 8 }}
                          rules={[
                            {
                              validator: (_, v) =>
                                v
                                  ? Promise.resolve()
                                  : Promise.reject(
                                      new Error("Please accept the Terms"),
                                    ),
                            },
                          ]}
                        >
                          <Checkbox>
                            I agree to the{" "}
                            <Link
                              href="/terms-of-service"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Terms of Service
                            </Link>
                          </Checkbox>
                        </Form.Item>
                        <Form.Item
                          name="privacy"
                          valuePropName="checked"
                          style={{ marginBottom: 0 }}
                          rules={[
                            {
                              validator: (_, v) =>
                                v
                                  ? Promise.resolve()
                                  : Promise.reject(
                                      new Error(
                                        "Please accept the Privacy Policy",
                                      ),
                                    ),
                            },
                          ]}
                        >
                          <Checkbox>
                            I agree to the{" "}
                            <Link
                              href="/privacy-policy"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Privacy Policy
                            </Link>
                          </Checkbox>
                        </Form.Item>
                      </LegalStack>
                    </Form>
                    <Note>
                      <strong>Why we ask for so little here</strong>
                      <p>
                        Locations, hours, photos, and listing copy belong in the
                        dashboard, where you can change them without redoing
                        signup. We only need enough to create the profile and
                        protect your widget domain.
                      </p>
                    </Note>
                  </FormWrap>
                )}

                {step === "pay" && (
                  <>
                    <InfoCard>
                      <InfoBlock>
                        <RecapTop>
                          <div>
                            <RecapName>{selectedPlan?.name} plan</RecapName>
                            <RecapMeta>
                              Billed monthly in CAD. Change anytime from
                              Settings.
                            </RecapMeta>
                          </div>
                          <RecapPrice>${selectedPlan?.price}/mo</RecapPrice>
                        </RecapTop>
                        <TextLinkBtn
                          type="button"
                          onClick={() => setStep("plan")}
                          style={{ marginLeft: -10, marginTop: 10 }}
                        >
                          Change plan
                        </TextLinkBtn>
                      </InfoBlock>
                      <InfoRule />
                      <InfoBlock>
                        <InfoLabel>Your subscription</InfoLabel>
                        <InfoText>
                          Pays for ClassEasily — software, widget, and
                          dashboard. Plus {selectedPlan?.commission}% on each
                          paid booking.
                        </InfoText>
                      </InfoBlock>
                      <InfoRule />
                      <InfoBlock>
                        <InfoLabel>Booking payouts</InfoLabel>
                        <InfoText>
                          Set up next with Stripe Connect. Those charges go to
                          your bank, not this subscription.
                        </InfoText>
                      </InfoBlock>
                    </InfoCard>
                    {IS_DEV && (
                      <AntButton
                        type="link"
                        block
                        onClick={() => setStep("timezone")}
                        style={{ marginTop: 4 }}
                      >
                        Skip payment (dev)
                      </AntButton>
                    )}
                  </>
                )}

                {step === "timezone" && (
                  <FormWrap>
                    <InfoCard>
                      <InfoBlock>
                        <SampleKicker>Right now in this timezone</SampleKicker>
                        <SampleTime>{sampleTime}</SampleTime>
                        <SampleSub>
                          This is how times will appear on the widget and in
                          reminder emails. If it doesn’t match where you
                          operate, pick a different zone.
                        </SampleSub>
                      </InfoBlock>
                      <InfoRule />
                      <InfoBlock>
                        <Form layout="vertical" requiredMark={false}>
                          <Form.Item
                            label="Timezone"
                            extra={
                              detectedZone === timezone
                                ? "This matches the timezone we detected from your browser. Keep it if this is where you operate."
                                : `Your browser looks like ${tzLabel(detectedZone)}. Change it if you operate somewhere else.`
                            }
                            style={{ marginBottom: 0 }}
                          >
                            <Select
                              showSearch
                              size="large"
                              value={timezone}
                              onChange={setTimezone}
                              optionFilterProp="label"
                              placeholder="Search city or timezone"
                              getPopupContainer={() => document.body}
                              options={TIMEZONES.map((z) => ({
                                value: z,
                                label: tzLabel(z),
                              }))}
                            />
                          </Form.Item>
                        </Form>
                        {timezone !== detectedZone && (
                          <TextLinkBtn
                            type="button"
                            onClick={() => setTimezone(detectedZone)}
                            style={{ margin: "8px 0 0 -10px" }}
                          >
                            Use detected timezone
                          </TextLinkBtn>
                        )}
                      </InfoBlock>
                      <InfoRule />
                      <InfoBlock>
                        <InfoLabel>What this timezone drives</InfoLabel>
                        <UsesList style={{ marginTop: 10 }}>
                          <li>
                            <CalendarClock size={16} />
                            Booking times on the widget and in your dashboard
                            calendar
                          </li>
                          <li>
                            <Check size={16} />
                            Confirmation and reminder emails, so 10:00 AM is the
                            same clock everywhere
                          </li>
                          <li>
                            <Building2 size={16} />
                            How a multi-location business should start: primary
                            location now, exceptions on individual listings later
                          </li>
                        </UsesList>
                      </InfoBlock>
                    </InfoCard>
                  </FormWrap>
                )}

                {step === "connect" && (
                  <>
                    <PayoutFlowScene reduceMotion={reduceMotion} />
                    <InfoCard>
                      <InfoBlock>
                        <InfoLabel>What you’ll need on Stripe’s screens</InfoLabel>
                        <InfoText>
                          Legal name and address, a bank account for deposits,
                          and sometimes a photo ID. That’s Stripe’s compliance
                          flow. Have those nearby and it usually takes a few
                          minutes.
                        </InfoText>
                      </InfoBlock>
                      <InfoRule />
                      <InfoBlock>
                        <InfoLabel>If you skip for now</InfoLabel>
                        <InfoText>
                          You can still add listings and embed the widget.
                          Payouts stay on hold until Connect is finished —
                          nothing is lost, just paused until the bank account is
                          linked.
                        </InfoText>
                      </InfoBlock>
                    </InfoCard>
                  </>
                )}

                {step === "preview" && (
                  <>
                    <WidgetMock>
                      <WidgetBar>{businessName || "Your business"}</WidgetBar>
                      <WidgetBody>
                        <WidgetClass>Intro booking</WidgetClass>
                        <WidgetMeta>
                          Saturday · 10:00–11:30 AM
                          <br />
                          4 spots left · Your business
                        </WidgetMeta>
                        <WidgetRow>
                          <WidgetPrice>$45</WidgetPrice>
                          <Reserve>
                            <Check size={14} /> Reserve
                          </Reserve>
                        </WidgetRow>
                      </WidgetBody>
                    </WidgetMock>
                    <Note>
                      <strong>Three things left in the dashboard</strong>
                      <NextList style={{ marginTop: 12 }}>
                        <NextItem>
                          <div>
                            <strong>Add your first listing</strong>
                            <span>
                              Title, duration, capacity, and price. That’s what
                              turns this preview into a real booking.
                            </span>
                          </div>
                        </NextItem>
                        <NextItem>
                          <div>
                            <strong>Copy the embed snippet</strong>
                            <span>
                              A short script from Settings. Paste it on your
                              site as a button, a page, or both.
                            </span>
                          </div>
                        </NextItem>
                        <NextItem>
                          <div>
                            <strong>Finish payouts if you skipped</strong>
                            <span>
                              Stripe Connect lives in Settings. Until it’s done,
                              booking revenue waits safely to be deposited.
                            </span>
                          </div>
                        </NextItem>
                      </NextList>
                    </Note>
                  </>
                )}
                </motion.div>
              </AnimatePresence>
              </StepSlot>
              </PanelMeasure>
            </Panel>
              </>
            )}
          </Shell>
        </Main>
        <Footer>
          <BackBtn
            type="button"
            onClick={goBack}
            disabled={!canBack}
            aria-hidden={!canBack}
            tabIndex={canBack ? 0 : -1}
          >
            <ChevronLeft size={18} />
            Back
          </BackBtn>
          <FooterRight>
            {step === "connect" && (
              <TextLinkBtn type="button" onClick={() => setStep("preview")}>
                Skip for now
              </TextLinkBtn>
            )}
            <PrimaryBtn
              type="primary"
              htmlType={primary.htmlType || "button"}
              form={primary.form}
              loading={busy}
              onClick={primary.onClick}
              aria-label={primary.label}
            >
              {primary.label} <ArrowRight size={16} aria-hidden />
            </PrimaryBtn>
          </FooterRight>
        </Footer>
      </Page>
    </ConfigProvider>
  );
}
