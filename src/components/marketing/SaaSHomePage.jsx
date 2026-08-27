"use client";

import styled from "styled-components";
import {
  Calendar,
  CreditCard,
  LayoutDashboard,
  Puzzle,
  Users,
  Code2,
  MousePointerClick,
  LineChart,
} from "lucide-react";
import { PLANS } from "@/lib/subscriptionPlans";
import {
  marketingTheme as t,
  REGISTER_HREF,
  PRICING_HREF,
  SUPPORT_EMAIL,
} from "./tokens";
import {
  Container,
  Section,
  ButtonLink,
  Eyebrow,
  H1,
  H2,
  Lead,
} from "./primitives";
import MarketingHeader, { MarketingHeaderSpacer } from "./MarketingHeader";
import MarketingFooter from "./MarketingFooter";

const Page = styled.div`
  font-family: ${t.fonts.body};
  color: ${t.colors.text};
  background: ${t.colors.white};
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 48px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 36px;
  }
`;

const CtaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: 28px;
`;

const TextLink = styled.a`
  font-weight: 600;
  color: ${t.colors.dark};
  text-decoration: none;
  &:hover {
    color: ${t.colors.primary};
  }
`;

const WidgetMock = styled.div`
  background: ${t.colors.bgLight};
  border: 1px solid ${t.colors.border};
  border-radius: 16px;
  padding: 16px;
  box-shadow: ${t.shadows.lg};
`;

const BrowserChrome = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d1d5db;
  }
`;

const MockSite = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const MockCopy = styled.div`
  h3 {
    margin: 0 0 8px;
    color: ${t.colors.dark};
    font-size: 16px;
  }
  p {
    margin: 0;
    font-size: 13px;
    color: ${t.colors.textLight};
    line-height: 1.5;
  }
`;

const MockWidget = styled.div`
  border: 1px solid ${t.colors.border};
  border-radius: 12px;
  padding: 14px;
  background: #fff;
  box-shadow: ${t.shadows.sm};
`;

const Slot = styled.button`
  width: 100%;
  margin-top: 8px;
  border: 1px solid ${t.colors.border};
  background: ${(p) => (p.$primary ? t.colors.primary : "#fff")};
  color: ${(p) => (p.$primary ? "#fff" : t.colors.dark)};
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
`;

const LogoStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
`;

const LogoChip = styled.div`
  padding: 10px 18px;
  border-radius: 999px;
  background: ${t.colors.bgLight};
  border: 1px solid ${t.colors.border};
  color: ${t.colors.textLight};
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.02em;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 40px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.article`
  background: ${t.colors.white};
  border: 1px solid ${t.colors.border};
  border-radius: 16px;
  padding: 24px;
  box-shadow: ${t.shadows.sm};

  h3 {
    margin: 12px 0 8px;
    color: ${t.colors.dark};
    font-size: 18px;
  }
  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.55;
    color: ${t.colors.text};
  }
`;

const IconWrap = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #fff0f3;
  color: ${t.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Steps = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 40px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const Step = styled.div`
  padding: 24px;
  border-radius: 16px;
  background: ${t.colors.white};
  border: 1px solid ${t.colors.border};
`;

const StepNum = styled.div`
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${t.colors.primary};
  margin-bottom: 10px;
`;

const PriceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 36px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const PriceCard = styled.article`
  border: 1px solid ${(p) => (p.$featured ? t.colors.primary : t.colors.border)};
  border-radius: 16px;
  padding: 24px;
  background: ${t.colors.white};
  box-shadow: ${(p) => (p.$featured ? t.shadows.md : "none")};
  position: relative;
`;

const Badge = styled.span`
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: #fff0f3;
  color: ${t.colors.primary};
  padding: 4px 8px;
  border-radius: 999px;
`;

const Price = styled.div`
  font-size: 36px;
  font-weight: 800;
  color: ${t.colors.dark};
  letter-spacing: -0.03em;
  span {
    font-size: 15px;
    font-weight: 600;
    color: ${t.colors.textLight};
  }
`;

const Quotes = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 36px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const Quote = styled.blockquote`
  margin: 0;
  padding: 24px;
  border-radius: 16px;
  background: ${t.colors.white};
  border: 1px solid ${t.colors.border};
  p {
    margin: 0 0 16px;
    color: ${t.colors.dark};
    font-size: 16px;
    line-height: 1.5;
  }
  footer {
    font-size: 13px;
    color: ${t.colors.textLight};
    font-weight: 600;
  }
`;

const FinalBand = styled.div`
  text-align: center;
  max-width: 640px;
  margin: 0 auto;
`;

const Centered = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FEATURES = [
  {
    icon: Puzzle,
    title: "Booking widget embed",
    body: "Add a booking button or inline calendar to Wix, Shopify, Squarespace, or your own site. Customers never leave your brand.",
  },
  {
    icon: Calendar,
    title: "Scheduling and capacity",
    body: "Set session times, caps, and availability in one place. Stop overbooking without a spreadsheet.",
  },
  {
    icon: CreditCard,
    title: "Online payments",
    body: "Collect payment when they book. Payouts go to you via Stripe — you keep your own customer relationship.",
  },
  {
    icon: Users,
    title: "Customer list",
    body: "Every booker lands in a simple CRM so you can see history, follow up, and recognize regulars.",
  },
  {
    icon: LayoutDashboard,
    title: "Memberships and promo codes",
    body: "Sell recurring plans and discounts without a second tool. Manage it from the same dashboard as bookings.",
  },
];

const HOW = [
  {
    n: "01",
    icon: Code2,
    title: "Embed the widget",
    body: "Paste one snippet on your site. Style it to match your brand.",
  },
  {
    n: "02",
    icon: MousePointerClick,
    title: "Customers book",
    body: "They pick a time and pay on your website. Confirmations go out automatically.",
  },
  {
    n: "03",
    icon: LineChart,
    title: "You run the business",
    body: "Capacity, customers, and payouts live in one dashboard — not five tabs.",
  },
];

const LOGOS = ["North Clay", "Atelier", "River Fit", "Kindred", "Oak & Iron", "Lumen"];

const QUOTES = [
  {
    quote: "We stopped sending people off-site to book. It just lives on our website now.",
    name: "Maya, studio owner",
  },
  {
    quote: "Setup was the part I was dreading. It was not that. We were taking bookings the same day.",
    name: "James, tutor",
  },
  {
    quote: "I needed payments, memberships, and a customer list — without an enterprise contract.",
    name: "Priya, salon owner",
  },
];

export default function SaaSHomePage() {
  return (
    <Page>
      <MarketingHeader />
      <MarketingHeaderSpacer />
      <main>
        <Section $pad="72px 0 56px">
          <Container>
            <HeroGrid>
              <div>
                <Eyebrow>Booking + CRM</Eyebrow>
                <H1>Booking and CRM software for small businesses.</H1>
                <Lead>
                  Easy to set up, priced for small teams, without the bloat of
                  enterprise tools. Embed a widget on your site and manage
                  bookings, capacity, payments, and customers from one dashboard.
                </Lead>
                <CtaRow>
                  <ButtonLink href={REGISTER_HREF} $variant="primary" $size="lg">
                    Get started
                  </ButtonLink>
                  <TextLink href={PRICING_HREF}>See pricing</TextLink>
                </CtaRow>
              </div>
              <WidgetMock aria-hidden="true">
                <BrowserChrome>
                  <span />
                  <span />
                  <span />
                </BrowserChrome>
                <MockSite>
                  <MockCopy>
                    <h3>Saturday pottery</h3>
                    <p>
                      Your site. Your brand. Customers book without leaving the
                      page.
                    </p>
                  </MockCopy>
                  <MockWidget>
                    <strong style={{ color: t.colors.dark, fontSize: 13 }}>
                      Book a spot
                    </strong>
                    <Slot>Sat 10:00 · 4 left</Slot>
                    <Slot>Sat 14:00 · 2 left</Slot>
                    <Slot $primary>Reserve · $65</Slot>
                  </MockWidget>
                </MockSite>
              </WidgetMock>
            </HeroGrid>
          </Container>
        </Section>

        <Section $bg={t.colors.bgLight} $pad="40px 0">
          <Container>
            <Centered>
              <Eyebrow>Social proof</Eyebrow>
              <Lead $max="640px" style={{ textAlign: "center", marginBottom: 24 }}>
                Trusted by local studios and small businesses.
              </Lead>
              <LogoStrip>
                {LOGOS.map((name) => (
                  <LogoChip key={name}>{name}</LogoChip>
                ))}
              </LogoStrip>
            </Centered>
          </Container>
        </Section>

        <Section id="features">
          <Container>
            <Centered>
              <Eyebrow>Product</Eyebrow>
              <H2>The tools you actually use.</H2>
              <Lead $max="560px" style={{ textAlign: "center" }}>
                Widget, schedule, payments, and a customer list — without a six-month
                implementation.
              </Lead>
            </Centered>
            <FeatureGrid>
              {FEATURES.map((f) => (
                <FeatureCard key={f.title}>
                  <IconWrap>
                    <f.icon size={20} />
                  </IconWrap>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </FeatureCard>
              ))}
            </FeatureGrid>
          </Container>
        </Section>

        <Section $bg={t.colors.bgLight} id="how-it-works">
          <Container>
            <Centered>
              <Eyebrow>How it works</Eyebrow>
              <H2>Live in three steps.</H2>
            </Centered>
            <Steps>
              {HOW.map((s) => (
                <Step key={s.n}>
                  <StepNum>{s.n}</StepNum>
                  <s.icon size={22} color={t.colors.dark} />
                  <h3 style={{ color: t.colors.dark, margin: "12px 0 8px" }}>
                    {s.title}
                  </h3>
                  <p style={{ margin: 0, lineHeight: 1.55 }}>{s.body}</p>
                </Step>
              ))}
            </Steps>
          </Container>
        </Section>

        <Section id="pricing-preview">
          <Container>
            <Centered>
              <Eyebrow>Pricing</Eyebrow>
              <H2>Simple plans. Shown up front.</H2>
              <Lead $max="520px" style={{ textAlign: "center" }}>
                A monthly fee plus a small per-booking commission. No setup fee.
              </Lead>
            </Centered>
            <PriceGrid>
              {PLANS.map((plan) => (
                <PriceCard key={plan.id} $featured={plan.featured}>
                  {plan.featured && <Badge>Most popular</Badge>}
                  <div style={{ fontWeight: 700, color: t.colors.dark }}>
                    {plan.name}
                  </div>
                  <Price>
                    ${plan.price}
                    <span>/mo</span>
                  </Price>
                  <p style={{ fontSize: 14, margin: "8px 0 20px" }}>
                    {plan.commission}% per booking
                  </p>
                  <ButtonLink
                    href={`${REGISTER_HREF}?plan=${plan.id}`}
                    $variant={plan.featured ? "primary" : "secondary"}
                    style={{ width: "100%" }}
                  >
                    Get started
                  </ButtonLink>
                </PriceCard>
              ))}
            </PriceGrid>
            <Centered style={{ marginTop: 24 }}>
              <TextLink href={PRICING_HREF}>See full plan comparison</TextLink>
            </Centered>
          </Container>
        </Section>

        <Section $bg={t.colors.bgLight}>
          <Container>
            <Centered>
              <Eyebrow>Customers</Eyebrow>
              <H2>What owners say.</H2>
            </Centered>
            <Quotes>
              {QUOTES.map((q) => (
                <Quote key={q.name}>
                  <p>“{q.quote}”</p>
                  <footer>{q.name}</footer>
                </Quote>
              ))}
            </Quotes>
          </Container>
        </Section>

        <Section $pad="80px 0">
          <Container>
            <FinalBand>
              <H2>Ready when you are.</H2>
              <Lead $max="520px" style={{ margin: "0 auto 28px" }}>
                Create an account, pick a plan, embed the widget. You can take
                bookings the same day.
              </Lead>
              <CtaRow style={{ justifyContent: "center" }}>
                <ButtonLink href={REGISTER_HREF} $variant="primary" $size="lg">
                  Get started
                </ButtonLink>
                <TextLink href={`mailto:${SUPPORT_EMAIL}`}>Talk to us</TextLink>
              </CtaRow>
            </FinalBand>
          </Container>
        </Section>
      </main>
      <MarketingFooter />
    </Page>
  );
}
