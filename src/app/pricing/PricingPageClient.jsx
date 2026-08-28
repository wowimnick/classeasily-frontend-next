"use client";

import { useMemo } from "react";
import Link from "next/link";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { WIDGET_PLAN_COMPARISON_ROWS } from "@/lib/subscriptionPlans";
import PlanCards, { PlanCtaButton } from "@/components/plans/PlanCards";
import { SubscriptionProvider, useSubscription } from "@/context/SubscriptionContext";
import {
  marketingTheme as t,
  REGISTER_HREF,
  SUPPORT_EMAIL,
} from "@/components/marketing/tokens";
import MarketingHeader, { MarketingSheet } from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import AnimatedHeadline from "@/components/marketing/AnimatedHeadline";
import AnimatedFaq from "@/components/marketing/AnimatedFaq";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const Page = styled.div`
  font-family: ${t.fonts.body};
  background: #f2f2f4;
  color: #000;
  min-height: 100vh;
`;

const Hero = styled.section`
  padding: 40px 24px 48px;
  text-align: center;
  background: #fff;
  background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23000000' fill-opacity='0.06'/%3E%3C/svg%3E");
  background-size: 24px 24px;
`;

const Kicker = styled.p`
  color: ${t.colors.primary};
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 10px;
`;

const Display = styled.h2`
  font-size: 40px;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: #000;
  font-weight: 800;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const Lead = styled.p`
  font-size: 18px;
  line-height: 1.6;
  color: #000;
  margin: 0 auto;
  max-width: 560px;
`;

const Container = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
  width: 100%;
`;

const Section = styled.section`
  padding: ${(p) => p.$pad || "72px 0"};
  background: ${(p) => p.$bg || "#fff"};
`;

const PlansWrap = styled.div`
  margin-top: 8px;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  margin-top: 32px;
  border: 1px solid ${t.colors.border};
  border-radius: 16px;
  background: #fff;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 560px;
  th,
  td {
    padding: 14px 16px;
    text-align: left;
    border-bottom: 1px solid ${t.colors.border};
    color: #000;
  }
  th {
    background: ${t.colors.bgLight};
    font-weight: 700;
  }
  td:not(:first-child),
  th:not(:first-child) {
    text-align: center;
  }
  tr:last-child td {
    border-bottom: none;
  }
`;

const Included = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 32px;
  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const IncludedCard = styled(motion.div)`
  background: #fff;
  border: 1px solid ${t.colors.border};
  border-radius: 16px;
  padding: 20px;
  h3 {
    margin: 0 0 8px;
    font-size: 16px;
    color: #000;
  }
  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #000;
  }
`;

const FaqWrap = styled.div`
  max-width: 760px;
  margin: 32px auto 0;
`;

const HeroH1 = styled.h1`
  font-family: ${t.fonts.body};
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.08;
  color: #000;
  margin: 0 0 16px;
`;

const FAQS = [
  {
    q: "Can I embed on Wix, Shopify, or Squarespace?",
    a: "Yes. The booking widget is a snippet you paste on Wix, Shopify, Squarespace, WordPress, or a custom site. Customers book without leaving your brand.",
  },
  {
    q: "Is there a setup fee?",
    a: "No. You pick a monthly plan and a small per-booking commission. Stripe’s card processing fees are separate and paid to Stripe.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes. Upgrade or downgrade any time from billing in your dashboard. Changes apply to the current or next billing period depending on the change.",
  },
  {
    q: "What is the commission vs Stripe processing?",
    a: "The ClassEasily commission (2–4% depending on plan) is our per-booking fee. Stripe processing is charged by Stripe on the card payment and is not the same thing.",
  },
  {
    q: "Do my customers book on my site or on ClassEasily?",
    a: "On your site. The widget lives on your pages. You manage bookings, customers, and payouts from the ClassEasily dashboard.",
  },
  {
    q: "How long does setup take?",
    a: "Create an account, pick a plan, embed the widget — you can take bookings the same day.",
  },
];

function PlanCta({ plan, Cta, dark }) {
  const { hasWidgetAccess, loading } = useSubscription();
  const Button = Cta || PlanCtaButton;
  if (!loading && hasWidgetAccess) {
    return (
      <Button as={Link} href="/business/dashboard/settings?tab=billing" $dark={dark}>
        Manage plan
      </Button>
    );
  }
  return (
    <Button as={Link} href={`${REGISTER_HREF}?plan=${plan.id}`} $dark={dark}>
      {plan.featured ? "Get started" : `Choose ${plan.name}`}
    </Button>
  );
}

function Cell({ row, planId }) {
  if (row.valueType === "text") {
    return row.text?.[planId] || "—";
  }
  if (row.plans?.[planId]) {
    return <Check size={18} color="#fc4056" aria-label="Included" />;
  }
  return <Minus size={16} color="#000" aria-label="Not included" />;
}

function PricingInner() {
  const rows = useMemo(
    () => WIDGET_PLAN_COMPARISON_ROWS.filter((row) => row.id !== "marketplace"),
    [],
  );

  return (
    <Page>
      <MarketingHeader />
      <MarketingSheet>
      <main>
        <Hero>
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeUp}>
              <Kicker>Pricing</Kicker>
            </motion.div>
            <AnimatedHeadline as={HeroH1} text="Priced for small teams." />
            <motion.div variants={fadeUp}>
              <Lead>
                A flat monthly fee plus a small commission per booking. No setup
                fee. Cancel anytime.
              </Lead>
            </motion.div>
          </motion.div>
        </Hero>

        <Section $pad="24px 0 72px">
          <Container>
            <PlansWrap>
              <PlanCards
                renderCta={(plan, { Cta, dark }) => (
                  <PlanCta plan={plan} Cta={Cta} dark={dark} />
                )}
              />
            </PlansWrap>
          </Container>
        </Section>

        <Section $bg={t.colors.bgLight}>
          <Container>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Kicker>Compare</Kicker>
              <Display>What’s on each plan</Display>
            </motion.div>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Basic</th>
                    <th>Growth</th>
                    <th>Advanced</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.label}</td>
                      {["basic", "growth", "advanced"].map((id) => (
                        <td key={id}>
                          <Cell row={row} planId={id} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Container>
        </Section>

        <Section>
          <Container>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              style={{ textAlign: "center" }}
            >
              <Kicker>Every plan</Kicker>
              <Display>Included from day one</Display>
            </motion.div>
            <Included
              as={motion.div}
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <IncludedCard variants={fadeUp}>
                <h3>Widget on your site</h3>
                <p>
                  Embed on Wix, Shopify, Squarespace, WordPress, or a custom
                  site. Customers book without leaving your brand.
                </p>
              </IncludedCard>
              <IncludedCard variants={fadeUp}>
                <h3>Payments to your bank</h3>
                <p>
                  Apple Pay, Google Pay, and cards through Stripe. ClassEasily
                  commission is separate from Stripe processing.
                </p>
              </IncludedCard>
              <IncludedCard variants={fadeUp}>
                <h3>Customer list</h3>
                <p>
                  Every booker lands in your dashboard. Follow up, run
                  memberships, and see history in one place.
                </p>
              </IncludedCard>
            </Included>
          </Container>
        </Section>

        <Section $bg={t.colors.bgLight}>
          <Container>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              style={{ textAlign: "center" }}
            >
              <Kicker>FAQ</Kicker>
              <Display>Questions</Display>
            </motion.div>
            <FaqWrap>
              <AnimatedFaq items={FAQS} boxed />
            </FaqWrap>
            <p style={{ marginTop: 28, textAlign: "center", color: "#000" }}>
              Still deciding?{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: t.colors.primary }}>
                Talk to us
              </a>
              .
            </p>
          </Container>
        </Section>
      </main>
      <MarketingFooter />
      </MarketingSheet>
    </Page>
  );
}

export default function PricingPageClient() {
  return (
    <SubscriptionProvider>
      <PricingInner />
    </SubscriptionProvider>
  );
}
