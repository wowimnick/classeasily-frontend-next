"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { ArrowRight, Check } from "lucide-react";
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
} from "@/components/marketing/tokens";
import { Button } from "@/components/marketing/primitives";
import dynamic from "next/dynamic";

const LogoIcon = dynamic(() => import("@/components/common/logoIcon"), {
  ssr: false,
});

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "",
);

const STEPS = [
  { id: "account", label: "Account", skippable: false },
  { id: "business", label: "Business", skippable: false },
  { id: "plan", label: "Plan", skippable: false },
  { id: "pay", label: "Pay", skippable: false },
  { id: "timezone", label: "Timezone", skippable: true },
  { id: "connect", label: "Payouts", skippable: true },
  { id: "preview", label: "Widget", skippable: true },
];

const Page = styled.div`
  min-height: 100vh;
  background: ${t.colors.bgLight};
  font-family: ${t.fonts.body};
  color: ${t.colors.text};
`;

const Top = styled.header`
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid ${t.colors.border};
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: ${t.colors.dark};
  font-weight: 800;
`;

const Progress = styled.div`
  display: flex;
  gap: 6px;
  flex: 1;
  max-width: 420px;
  margin: 0 24px;
`;

const Pip = styled.div`
  flex: 1;
  height: 4px;
  border-radius: 99px;
  background: ${(p) => (p.$on ? t.colors.primary : t.colors.border)};
`;

const Shell = styled.div`
  max-width: 1040px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 48px;
  align-items: start;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    padding-top: 28px;
    gap: 20px;
  }
`;

const Story = styled.div`
  h1 {
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: ${t.colors.dark};
    margin: 0 0 12px;
  }
  p {
    margin: 0;
    font-size: 17px;
    line-height: 1.55;
  }
`;

const Panel = styled.div`
  background: #fff;
  border: 1px solid ${t.colors.border};
  border-radius: 16px;
  padding: 28px;
  box-shadow: ${t.shadows.md};
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 13px;
  font-weight: 600;
  color: ${t.colors.dark};
  input {
    height: 44px;
    border: 1px solid ${t.colors.border};
    border-radius: 10px;
    padding: 0 12px;
    font-size: 15px;
    font-family: inherit;
  }
`;

const ErrorText = styled.p`
  color: #df1b41;
  font-size: 13px;
  margin: 0 0 12px;
`;

const PlanGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PlanBtn = styled.button`
  text-align: left;
  border: 1.5px solid ${(p) => (p.$on ? t.colors.primary : t.colors.border)};
  background: ${(p) => (p.$on ? "#fff7f8" : "#fff")};
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  font-family: inherit;
`;

const TIMEZONES = (() => {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["America/Toronto", "America/New_York", "America/Los_Angeles", "UTC"];
  }
})();

function storyCopy(step, name) {
  switch (step) {
    case "account":
      return {
        t: "Start with your account.",
        d: "One login for bookings, customers, and payouts. No marketplace listing required.",
      };
    case "business":
      return {
        t: "Tell us about the business.",
        d: "Just a name, site, and phone. You can add locations and hours later.",
      };
    case "plan":
      return {
        t: "Pick a plan.",
        d: "A monthly fee plus a small commission. You can change this later.",
      };
    case "pay":
      return {
        t: "Activate ClassEasily.",
        d: "This is your ClassEasily subscription — not the card your customers pay with.",
      };
    case "timezone":
      return {
        t: "When is class time?",
        d: "Schedules display in this timezone. You can change it anytime.",
      };
    case "connect":
      return {
        t: "Get paid for bookings.",
        d: "Connect Stripe so customer payments go to your bank. You can skip and do this later.",
      };
    case "preview":
      return {
        t: `${name || "Your widget"} is ready to embed.`,
        d: "This is how booking looks on your site. Copy the snippet from the dashboard when you have a class live.",
      };
    default:
      return { t: "Get started", d: "" };
  }
}

export default function RegisterFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuthUser();
  const [step, setStep] = useState("account");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [planId, setPlanId] = useState(
    searchParams.get("plan") || "growth",
  );
  const [clientSecret, setClientSecret] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [timezone, setTimezone] = useState(
    (typeof Intl !== "undefined" &&
      Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      "America/Toronto",
  );
  const [account, setAccount] = useState({
    firstName: "",
    email: "",
    password: "",
    mode: "signup",
  });
  const [biz, setBiz] = useState({
    businessName: "",
    website: "",
    phone: "",
    terms: false,
    privacy: false,
  });
  const [tzQuery, setTzQuery] = useState("");

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const copy = storyCopy(step, businessName);

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
    setStep(next.id);
  }, [goDashboard, stepIndex]);

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
        const qStep = searchParams.get("step");
        if (!qStep || ["account", "business", "plan", "pay"].includes(qStep)) {
          setStep("timezone");
        }
        return;
      }
      if (d.has_business) {
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

  const submitAccount = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (account.mode === "signup") {
        await signUpWithDjango({
          email: account.email,
          password1: account.password,
          password2: account.password,
          first_name: account.firstName,
        });
      }
      await signInWithDjango(account.email, account.password, null);
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

  const submitBusiness = async (e) => {
    e.preventDefault();
    setError("");
    if (!biz.terms || !biz.privacy) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }
    setBusy(true);
    try {
      const result = await businessService.registerBusiness({
        businessName: biz.businessName,
        website: biz.website,
        studentContactPhone: biz.phone,
        termsAccepted: true,
        privacyAccepted: true,
        plan_id: planId,
      });
      if (!result.success) {
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
      setBusinessName(biz.businessName);
      setStep("plan");
    } finally {
      setBusy(false);
    }
  };

  const startCheckout = async () => {
    setError("");
    setBusy(true);
    setClientSecret(null);
    try {
      const origin = window.location.origin;
      const result = await businessService.createWidgetSubscriptionCheckout({
        plan_id: planId,
        billing_interval: "month",
        ui_mode: "embedded",
        success_url: `${origin}${REGISTER_HREF}?step=timezone`,
        cancel_url: `${origin}${REGISTER_HREF}?step=pay&plan=${planId}`,
      });
      if (result.client_secret) {
        setClientSecret(result.client_secret);
        setBusy(false);
        return;
      }
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

  const tzOptions = useMemo(() => {
    const q = tzQuery.toLowerCase();
    return TIMEZONES.filter((z) => z.toLowerCase().includes(q)).slice(0, 12);
  }, [tzQuery]);

  const sampleTime = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date());
    } catch {
      return timezone;
    }
  }, [timezone]);

  return (
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
        <Progress aria-hidden>
          {STEPS.map((s, i) => (
            <Pip key={s.id} $on={i <= stepIndex} />
          ))}
        </Progress>
        {STEPS[stepIndex]?.skippable ? (
          <Button type="button" $variant="ghost" onClick={skip}>
            Skip
          </Button>
        ) : (
          <span />
        )}
      </Top>
      <Shell>
        <Story>
          <h1>{copy.t}</h1>
          <p>{copy.d}</p>
        </Story>
        <Panel>
          {error && <ErrorText>{error}</ErrorText>}

          {step === "account" && (
            <form onSubmit={submitAccount}>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <Button
                  type="button"
                  $variant={account.mode === "signup" ? "primary" : "secondary"}
                  onClick={() => setAccount((a) => ({ ...a, mode: "signup" }))}
                >
                  Sign up
                </Button>
                <Button
                  type="button"
                  $variant={account.mode === "login" ? "primary" : "secondary"}
                  onClick={() => setAccount((a) => ({ ...a, mode: "login" }))}
                >
                  Log in
                </Button>
              </div>
              {account.mode === "signup" && (
                <Field>
                  First name
                  <input
                    required
                    value={account.firstName}
                    onChange={(e) =>
                      setAccount((a) => ({ ...a, firstName: e.target.value }))
                    }
                  />
                </Field>
              )}
              <Field>
                Email
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={account.email}
                  onChange={(e) =>
                    setAccount((a) => ({ ...a, email: e.target.value }))
                  }
                />
              </Field>
              <Field>
                Password
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete={
                    account.mode === "signup" ? "new-password" : "current-password"
                  }
                  value={account.password}
                  onChange={(e) =>
                    setAccount((a) => ({ ...a, password: e.target.value }))
                  }
                />
              </Field>
              <Button type="submit" $variant="primary" disabled={busy} style={{ width: "100%" }}>
                Continue <ArrowRight size={16} />
              </Button>
              <div style={{ margin: "16px 0 8px", textAlign: "center", fontSize: 13 }}>
                or
              </div>
              <GoogleOAuthWrapper
                onSuccess={onGoogle}
                onError={() => setError("Google sign-in failed.")}
                disabled={busy}
              />
            </form>
          )}

          {step === "business" && (
            <form onSubmit={submitBusiness}>
              <Field>
                Business name
                <input
                  required
                  value={biz.businessName}
                  onChange={(e) =>
                    setBiz((b) => ({ ...b, businessName: e.target.value }))
                  }
                />
              </Field>
              <Field>
                Website
                <input
                  required
                  placeholder="yourstudio.com"
                  value={biz.website}
                  onChange={(e) =>
                    setBiz((b) => ({ ...b, website: e.target.value }))
                  }
                />
              </Field>
              <Field>
                Phone
                <input
                  required
                  placeholder="+1 555 123 4567"
                  value={biz.phone}
                  onChange={(e) => setBiz((b) => ({ ...b, phone: e.target.value }))}
                />
              </Field>
              <label style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={biz.terms}
                  onChange={(e) => setBiz((b) => ({ ...b, terms: e.target.checked }))}
                />
                I agree to the <Link href="/terms-of-service">Terms of Service</Link>
              </label>
              <label style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 16 }}>
                <input
                  type="checkbox"
                  checked={biz.privacy}
                  onChange={(e) =>
                    setBiz((b) => ({ ...b, privacy: e.target.checked }))
                  }
                />
                I agree to the <Link href="/privacy-policy">Privacy Policy</Link>
              </label>
              <Button type="submit" $variant="primary" disabled={busy} style={{ width: "100%" }}>
                Continue
              </Button>
            </form>
          )}

          {step === "plan" && (
            <div>
              <PlanGrid>
                {PLANS.map((p) => (
                  <PlanBtn
                    key={p.id}
                    type="button"
                    $on={planId === p.id}
                    onClick={() => setPlanId(p.id)}
                  >
                    <strong style={{ color: t.colors.dark }}>
                      {p.name} · ${p.price}/mo
                    </strong>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      {p.commission}% per booking
                      {p.featured ? " · Most popular" : ""}
                    </div>
                  </PlanBtn>
                ))}
              </PlanGrid>
              <Button
                type="button"
                $variant="primary"
                style={{ width: "100%", marginTop: 16 }}
                onClick={() => setStep("pay")}
              >
                Continue with {PLANS.find((p) => p.id === planId)?.name}
              </Button>
            </div>
          )}

          {step === "pay" && (
            <div>
              <p style={{ marginTop: 0 }}>
                {PLANS.find((p) => p.id === planId)?.name} · $
                {PLANS.find((p) => p.id === planId)?.price}/mo CAD plus{" "}
                {PLANS.find((p) => p.id === planId)?.commission}% per booking.
              </p>
              {!clientSecret && (
                <Button
                  type="button"
                  $variant="primary"
                  disabled={busy}
                  onClick={startCheckout}
                  style={{ width: "100%" }}
                >
                  Continue to payment
                </Button>
              )}
              {clientSecret && (
                <div style={{ marginTop: 12 }}>
                  <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{ clientSecret }}
                  >
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              )}
            </div>
          )}

          {step === "timezone" && (
            <div>
              <Field>
                Search timezone
                <input
                  value={tzQuery}
                  onChange={(e) => setTzQuery(e.target.value)}
                  placeholder="Toronto, New York…"
                />
              </Field>
              <PlanGrid>
                {tzOptions.map((z) => (
                  <PlanBtn
                    key={z}
                    type="button"
                    $on={timezone === z}
                    onClick={() => setTimezone(z)}
                  >
                    {z.replace(/_/g, " ")}
                  </PlanBtn>
                ))}
              </PlanGrid>
              <p style={{ fontSize: 14 }}>
                Sample: Saturday class would show as <strong>{sampleTime}</strong>
              </p>
              <Button
                type="button"
                $variant="primary"
                disabled={busy}
                onClick={saveTimezone}
                style={{ width: "100%" }}
              >
                Save timezone
              </Button>
            </div>
          )}

          {step === "connect" && (
            <div>
              <p>
                Stripe Connect is how <em>your customers</em> pay you. Separate from
                the ClassEasily plan you just subscribed to.
              </p>
              <Button
                type="button"
                $variant="primary"
                disabled={busy}
                onClick={startConnect}
                style={{ width: "100%" }}
              >
                Connect Stripe
              </Button>
              <Button
                type="button"
                $variant="ghost"
                onClick={() => setStep("preview")}
                style={{ width: "100%", marginTop: 8 }}
              >
                Skip for now
              </Button>
            </div>
          )}

          {step === "preview" && (
            <div>
              <div
                style={{
                  border: `1px solid ${t.colors.border}`,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 800, color: t.colors.dark }}>
                  {businessName || "Your business"}
                </div>
                <div style={{ fontSize: 13, margin: "8px 0" }}>Book a session</div>
                <div
                  style={{
                    background: t.colors.primary,
                    color: "#fff",
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontWeight: 700,
                    fontSize: 14,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Check size={14} /> Reserve
                </div>
              </div>
              <Button
                type="button"
                $variant="primary"
                onClick={goDashboard}
                style={{ width: "100%" }}
              >
                Go to dashboard
              </Button>
            </div>
          )}
        </Panel>
      </Shell>
    </Page>
  );
}
