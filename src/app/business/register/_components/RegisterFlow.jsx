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
  HelpCircle,
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
  BP,
} from "@/components/marketing/tokens";
import dynamic from "next/dynamic";
import OnboardAmbient from "./OnboardAmbient";
import OnboardSurvey, { SURVEY_STEPS } from "./OnboardSurvey";
import PayoutFlowScene from "./PayoutFlowScene";
import PlanPicker from "./PlanPicker";
import StepTitleReveal from "./StepTitleReveal";

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
];

const SURVEY_PENDING_KEY = "ce-onboard-survey";

const antdTheme = {
  token: {
    colorPrimary: "#fc4056",
    colorText: "#222222",
    colorTextBase: "#222222",
    colorTextHeading: "#222222",
    colorTextSecondary: "#111111",
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
        eyebrow: "Welcome to ClassEasily",
        title: "Create your account",
        paragraphs: [
          "You’ll use this login to manage bookings, customers, schedules, and payouts.",
          "If you already have an account, log in and we’ll continue from where you left off.",
        ],
      };
    case "business":
      return {
        eyebrow: "Your public details",
        title: "Tell us about your business",
        paragraphs: [
          `This is the name ${business === "your business" ? "your customers already know" : `people know as ${business}`}. It appears on your widget, receipts, and confirmation emails.`,
          "We also use your website so the booking widget only loads on your domain.",
        ],
      };
    case "plan":
      return {
        eyebrow: "Pricing that scales with you",
        title: "Choose a plan",
        paragraphs: [
          "Estimate a typical month and we’ll highlight the lowest-cost option. You can still choose any of the three.",
        ],
      };
    case "pay":
      return {
        eyebrow: "Activate your subscription",
        title: "Confirm your plan",
        paragraphs: [
          `You’re starting the ${plan?.name || "selected"} plan at $${plan?.price || "—"}/mo CAD, plus ${plan?.commission ?? "—"}% per paid booking. This is your ClassEasily subscription — booking payouts are set up separately.`,
          "You can change or cancel from the dashboard at any time.",
        ],
      };
    case "timezone":
      return {
        eyebrow: "One clock for bookings and emails",
        title: "Set your timezone",
        paragraphs: [
          "We’ve selected this from your browser. The calendar, widget, and reminder emails all use it, so times stay consistent.",
          "If you operate in more than one city, choose your primary location. You can change this later in Settings.",
        ],
      };
    case "about-industry":
      return {
        eyebrow: "Optional — 1 of 3",
        title: "One last thing",
        paragraphs: [
          "What do you offer? This helps us set up your first listing. You can skip any of these.",
        ],
      };
    case "about-booking":
      return {
        eyebrow: "Optional — 2 of 3",
        title: "How do you take bookings today?",
        paragraphs: [
          "The system you use now — or the one you plan to replace.",
        ],
      };
    case "about-attribution":
      return {
        eyebrow: "Optional — 3 of 3",
        title: "How did you find ClassEasily?",
        paragraphs: [
          "This helps us reach other businesses like yours.",
        ],
      };
    case "connect":
      return {
        eyebrow: "Optional — you can do this later",
        title: "Set up payouts",
        paragraphs: [
          "Stripe Connect deposits booking revenue to your bank, usually a day or two after a class. ClassEasily doesn’t hold that money.",
          "You’ll need a legal name, address, and bank details. You can skip this and finish it from Settings — payouts stay paused until then.",
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

  @media (max-width: ${BP.phone}px) {
    height: 56px;
    padding: 0 16px;
    grid-template-columns: auto 1fr auto;
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

const BrandName = styled.span`
  @media (max-width: ${BP.phone}px) {
    display: none;
  }
`;

const StepMeta = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #111;
  text-align: center;

  @media (max-width: ${BP.mobile}px) {
    display: none;
  }
`;

const StepDots = styled.ol`
  display: none;
  margin: 0;
  padding: 0;
  list-style: none;
  justify-content: center;
  align-items: center;
  gap: 6px;

  @media (max-width: ${BP.mobile}px) {
    display: ${(p) => (p.$hide ? "none" : "flex")};
  }
`;

const StepDot = styled.li`
  width: ${(p) => (p.$on ? "16px" : "7px")};
  height: 7px;
  border-radius: 99px;
  background: ${(p) => (p.$on ? t.colors.primary : "#e4e4e4")};
  transition:
    width 0.2s ease,
    background 0.2s ease;
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

  .q-icon {
    display: none;
  }

  @media (max-width: ${BP.phone}px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    text-decoration: none;

    .q-label {
      display: none;
    }

    .q-icon {
      display: block;
    }
  }
`;

const ProgressTrack = styled.div`
  height: 4px;
  background: #ebebeb;
  flex-shrink: 0;
  opacity: ${(p) => (p.$hide ? 0 : 1)};
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
    margin-bottom: 16px;
  `
      : ""}

  @media (max-width: 860px) {
    position: static;
  }
`;

const StepSlot = styled.div`
  position: relative;
`;

const ContentSlot = styled.div`
  min-width: 0;
`;

const Panel = styled.div`
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 20px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  min-width: 0;

  @media (max-width: ${BP.mobile}px) {
    background: transparent;
    border: none;
    box-shadow: none;
    border-radius: 0;
    overflow: visible;
  }
`;

const PanelMeasure = styled.div`
  padding: 28px;

  @media (max-width: ${BP.phone}px) {
    padding: 0;
  }
`;

const Eyebrow = styled.p`
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #111;
  min-height: 1.15em;
  opacity: ${(p) => (p.$on ? 1 : 0)};
  transition: opacity 0.35s ease;
`;

const Lead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: ${(p) => (p.$wide ? "40em" : "460px")};

  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.45;
    color: #111;
  }

  @media (max-width: ${BP.mobile}px) {
    max-width: none;
    gap: 4px;

    p {
      font-size: 14px;
      line-height: 1.4;
    }
  }
`;

const LeadRest = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  @media (max-width: ${BP.mobile}px) {
    display: none;
  }
`;

const StoryRule = styled.div`
  width: 100%;
  max-width: ${(p) => (p.$wide ? "40em" : "460px")};
  height: 1px;
  margin-top: 20px;
  background: #e8e8e8;

  @media (max-width: ${BP.mobile}px) {
    max-width: none;
    margin-top: 16px;
  }
`;

const Why = styled.details`
  display: none;

  @media (max-width: ${BP.mobile}px) {
    display: block;
  }

  summary {
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    color: #111;
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  p {
    margin: 8px 0 0;
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
    color: #111;
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

  @media (max-width: ${BP.mobile}px) {
    .ant-form-item-label > label {
      font-size: 13px;
    }

    .ant-input,
    .ant-input-affix-wrapper,
    .ant-input-affix-wrapper input,
    .ant-select-selector,
    .ant-select-selection-search-input {
      font-size: 16px !important;
    }
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
  color: #111;
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
    color: #111;
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
  color: #111;
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
  color: #111;
`;

const SampleKicker = styled.div`
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #111;
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
  color: #111;
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
  opacity: ${(p) => (p.$hidden ? 0 : 1)};
  pointer-events: ${(p) => (p.$hidden ? "none" : "auto")};
  transition: opacity 0.35s ease;

  @media (max-width: ${BP.phone}px) {
    padding: 12px 16px max(12px, env(safe-area-inset-bottom, 0px));
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
  min-width: 0;

  @media (max-width: ${BP.phone}px) {
    flex: 1;
    ${(p) =>
      p.$stack
        ? `
      flex-direction: column-reverse;
      align-items: stretch;
    `
        : ""}
  }
`;

const PrimaryBtn = styled(AntButton)`
  && {
    height: 48px;
    padding: 0 28px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 16px;
  }

  @media (max-width: ${BP.phone}px) {
    && {
      width: 100%;
      padding: 0 20px;
    }
  }
`;

function StepIntro({
  eyebrow,
  title,
  paragraphs,
  reduceMotion,
  wide,
  stepKey,
  onSettled,
  showRest,
  skipAnimation,
}) {
  return (
    <>
      <Eyebrow $on={reduceMotion || showRest}>{eyebrow}</Eyebrow>
      <StepTitleReveal
        title={title}
        stepKey={stepKey}
        reduceMotion={reduceMotion}
        onSettled={onSettled}
        align="left"
        skipAnimation={skipAnimation}
      />
      <Lead
        $wide={wide}
        as={motion.div}
        initial={false}
        animate={
          reduceMotion || showRest
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 12 }
        }
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        style={{ pointerEvents: showRest || reduceMotion ? "auto" : "none" }}
      >
        {paragraphs[0] ? <p>{paragraphs[0]}</p> : null}
        {paragraphs.length > 1 ? (
          <>
            <LeadRest>
              {paragraphs.slice(1).map((text) => (
                <p key={text.slice(0, 48)}>{text}</p>
              ))}
            </LeadRest>
            <Why>
              <summary>Why this matters</summary>
              {paragraphs.slice(1).map((text) => (
                <p key={text.slice(0, 48)}>{text}</p>
              ))}
            </Why>
          </>
        ) : null}
      </Lead>
      <StoryRule $wide={wide} aria-hidden />
    </>
  );
}

export default function RegisterFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuthUser();
  const reduceMotion = useReducedMotion() === true;
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
  const [survey, setSurvey] = useState({});
  const [monthlyVolume, setMonthlyVolume] = useState(2500);
  const [phase, setPhase] = useState("flow");
  const [contentVisible, setContentVisible] = useState(true);
  const seenIntros = useRef(new Set());

  const isSurvey = phase === "survey";
  const isLoadingPhase = phase === "loading";
  const aboutIndex = SURVEY_STEPS.findIndex((s) => s.id === step);
  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const minIndex = STEPS.findIndex((s) => s.id === minStep);
  const selectedPlan = PLANS.find((p) => p.id === planId);
  const copy = stepCopy(step, businessName, selectedPlan);
  const canBack = isSurvey
    ? aboutIndex > 0
    : !isLoadingPhase && stepIndex > Math.max(0, minIndex);
  const current = STEPS[stepIndex];
  const introKey = isLoadingPhase ? "loading" : step;
  const skipIntro = seenIntros.current.has(introKey);
  const wide = step === "plan" || isSurvey;

  const detectedZone = useMemo(
    () =>
      (typeof Intl !== "undefined" &&
        Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      "America/Toronto",
    [],
  );

  const persistSurvey = useCallback(
    async (nextSurvey = survey) => {
      const payload = { ...nextSurvey };
      if (monthlyVolume) payload.estimated_monthly_volume = monthlyVolume;
      const hasAnswers = Object.values(payload).some(
        (v) => v !== "" && v !== null && v !== undefined,
      );
      if (!hasAnswers) return;
      await businessService.updateMyBusinessProfile({
        onboarding_survey: payload,
      });
    },
    [monthlyVolume, survey],
  );

  const leaveToDashboard = useCallback(async () => {
    setBusy(true);
    try {
      sessionStorage.removeItem(SURVEY_PENDING_KEY);
    } catch {
      /* ignore */
    }
    await persistSurvey();
    await businessService.completeOnboarding();
    router.replace("/business/dashboard");
  }, [persistSurvey, router]);

  const beginPostOnboarding = useCallback(() => {
    try {
      sessionStorage.setItem(SURVEY_PENDING_KEY, "1");
    } catch {
      /* ignore */
    }
    setError("");
    setContentVisible(true);
    setStep("about-industry");
    setPhase("survey");
  }, []);

  const skip = useCallback(async () => {
    if (isSurvey) {
      setBusy(true);
      await leaveToDashboard();
      return;
    }
    const next = STEPS[stepIndex + 1];
    if (!next) {
      beginPostOnboarding();
      return;
    }
    setError("");
    setStep(next.id);
  }, [beginPostOnboarding, isSurvey, leaveToDashboard, stepIndex]);

  const pickSurvey = useCallback(
    async (id) => {
      const currentAbout = SURVEY_STEPS[aboutIndex];
      if (!currentAbout) return;
      const nextSurvey = { ...survey, [currentAbout.key]: id };
      setSurvey(nextSurvey);
      persistSurvey(nextSurvey);
      const nextAbout = SURVEY_STEPS[aboutIndex + 1];
      setError("");
      if (!nextAbout) {
        setBusy(true);
        await persistSurvey(nextSurvey);
        await businessService.completeOnboarding();
        try {
          sessionStorage.removeItem(SURVEY_PENDING_KEY);
        } catch {
          /* ignore */
        }
        router.replace("/business/dashboard");
        return;
      }
      setStep(nextAbout.id);
    },
    [aboutIndex, persistSurvey, router, survey],
  );

  const goBack = useCallback(() => {
    if (!canBack) return;
    setError("");
    if (isSurvey) {
      setStep(SURVEY_STEPS[aboutIndex - 1].id);
      return;
    }
    setStep(STEPS[stepIndex - 1].id);
  }, [aboutIndex, canBack, isSurvey, stepIndex]);

  useEffect(() => {
    setContentVisible(true);
  }, [introKey]);

  const onTitleSettled = useCallback(() => {
    seenIntros.current.add(introKey);
    setContentVisible(true);
  }, [introKey]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [step]);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return undefined;
    const onFocus = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches("input, textarea, select, .ant-select-selector")) {
        return;
      }
      window.setTimeout(() => {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 280);
    };
    main.addEventListener("focusin", onFocus);
    return () => main.removeEventListener("focusin", onFocus);
  }, []);

  useEffect(() => {
    const qStep = searchParams.get("step");
    if (qStep === "about" || qStep === "preview" || qStep?.startsWith("about-")) {
      setPhase("survey");
      setStep(qStep?.startsWith("about-") ? qStep : "about-industry");
    } else if (qStep && STEPS.some((s) => s.id === qStep)) {
      setPhase("flow");
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
      if (d.onboarding_survey && typeof d.onboarding_survey === "object") {
        setSurvey(d.onboarding_survey);
        if (d.onboarding_survey.estimated_monthly_volume) {
          setMonthlyVolume(d.onboarding_survey.estimated_monthly_volume);
        }
      }
      if (d.has_paid_subscription && d.onboarding_completed) {
        router.replace("/business/dashboard");
        return;
      }
      if (d.has_paid_subscription) {
        setMinStep("timezone");
        const qStep = searchParams.get("step");
        let pending = false;
        try {
          pending = sessionStorage.getItem(SURVEY_PENDING_KEY) === "1";
        } catch {
          pending = false;
        }
        if (qStep === "about" || qStep === "preview" || qStep?.startsWith("about-")) {
          setPhase("survey");
          setStep(qStep?.startsWith("about-") ? qStep : "about-industry");
          return;
        }
        if (pending && !qStep) {
          setPhase("survey");
          setStep("about-industry");
          return;
        }
        if (!qStep || ["account", "business", "plan", "pay"].includes(qStep)) {
          setPhase("flow");
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
      case "about-industry":
      case "about-booking":
      case "about-attribution":
        return { label: "Skip", onClick: skip };
      case "connect":
        return { label: "Connect Stripe", onClick: startConnect };
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
            <BrandName>ClassEasily</BrandName>
          </Brand>
          <StepMeta>
            {isSurvey
              ? `Optional · ${aboutIndex + 1} of ${SURVEY_STEPS.length}`
              : `Step ${stepIndex + 1} of ${STEPS.length} · ${current?.label}`}
          </StepMeta>
          <StepDots
            aria-label={
              isSurvey
                ? `Question ${aboutIndex + 1} of ${SURVEY_STEPS.length}`
                : `Step ${stepIndex + 1} of ${STEPS.length}`
            }
          >
            {(isSurvey ? SURVEY_STEPS : STEPS).map((s, i) => (
              <StepDot
                key={s.id}
                $on={i === (isSurvey ? aboutIndex : stepIndex)}
                aria-current={
                  i === (isSurvey ? aboutIndex : stepIndex) ? "step" : undefined
                }
              />
            ))}
          </StepDots>
          <TopActions>
            {isSurvey || current?.skippable ? (
              <TextLinkBtn type="button" onClick={skip}>
                {IS_DEV &&
                !isSurvey &&
                !["timezone", "connect"].includes(step)
                  ? "Skip (dev)"
                  : "Skip"}
              </TextLinkBtn>
            ) : (
              <span />
            )}
            <Questions href={`mailto:${SUPPORT_EMAIL}`} aria-label="Questions">
              <span className="q-label">Questions?</span>
              <HelpCircle className="q-icon" size={20} strokeWidth={2.2} />
            </Questions>
          </TopActions>
        </Top>
        <ProgressTrack $hide={isSurvey}>
          <ProgressFill
            $pct={
              isSurvey
                ? ((aboutIndex + 1) / SURVEY_STEPS.length) * 100
                : ((Math.max(stepIndex, 0) + 1) / STEPS.length) * 100
            }
          />
        </ProgressTrack>
        <Main ref={mainRef}>
          <OnboardAmbient step={step} reduceMotion={reduceMotion} />
          <Shell $wide={wide}>
            <Story $plain={wide}>
              <StepSlot>
                <StepIntro
                  key={introKey}
                  stepKey={introKey}
                  eyebrow={copy.eyebrow}
                  title={copy.title}
                  paragraphs={copy.paragraphs}
                  reduceMotion={reduceMotion}
                  wide={wide}
                  showRest={contentVisible}
                  skipAnimation={skipIntro}
                  onSettled={onTitleSettled}
                />
              </StepSlot>
            </Story>
            {wide ? (
              <ContentSlot
                as={motion.div}
                initial={false}
                animate={
                  contentVisible || reduceMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 18 }
                }
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  pointerEvents:
                    contentVisible || reduceMotion ? "auto" : "none",
                }}
              >
                {step === "plan" ? (
                  <PlanPicker
                    planId={planId}
                    onChange={setPlanId}
                    onVolumeChange={setMonthlyVolume}
                  />
                ) : (
                  <OnboardSurvey
                    stepId={step}
                    value={survey[SURVEY_STEPS[aboutIndex]?.key]}
                    onSelect={pickSurvey}
                  />
                )}
              </ContentSlot>
            ) : (
              <>
            <ColRule aria-hidden />
            <ContentSlot
              as={motion.div}
              initial={false}
              animate={
                contentVisible || reduceMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 18 }
              }
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{
                pointerEvents: contentVisible || reduceMotion ? "auto" : "none",
              }}
            >
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

                </motion.div>
              </AnimatePresence>
              </StepSlot>
              </PanelMeasure>
            </Panel>
            </ContentSlot>
              </>
            )}
          </Shell>
        </Main>
        <Footer
          $hidden={!contentVisible}
          aria-hidden={!contentVisible}
        >
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
          <FooterRight $stack={step === "connect"}>
            {step === "connect" && (
              <TextLinkBtn type="button" onClick={beginPostOnboarding}>
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
