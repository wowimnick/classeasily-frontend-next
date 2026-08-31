"use client";

import { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import PlanCards, { PlanCtaButton } from "@/components/plans/PlanCards";
import {
  SubscriptionProvider,
  useSubscription,
} from "@/context/SubscriptionContext";
import {
  marketingTheme as t,
  REGISTER_HREF,
  SUPPORT_EMAIL,
  BP,
} from "@/components/marketing/tokens";
import MarketingHeader, {
  MarketingSheet,
} from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MobileStickyCta from "@/components/marketing/MobileStickyCta";
import AnimatedFaq from "@/components/marketing/AnimatedFaq";
import PricingPlayground from "./_components/PricingPlayground";
import PlanComparison from "./_components/PlanComparison";
import MobilePlanCompare from "./_components/MobilePlanCompare";
import { PLANS } from "@/lib/subscriptionPlans";

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const Page = styled.div`
  font-family: ${t.fonts.body};
  background: #f2f2f4;
  color: #111;
  min-height: 100vh;
`;

const Container = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
`;

const Section = styled.section`
  background: ${(p) => p.$bg || "#fff"};
  padding: ${(p) => `${p.$top ?? 72}px 0 ${p.$bottom ?? 72}px`};

  @media (max-width: 768px) {
    padding: ${(p) => `${p.$topSm ?? 48}px 0 ${p.$bottomSm ?? 48}px`};
  }
`;

const Hero = styled.section`
  background: #fff;
  margin-top: -4.25rem;
  padding: calc(4.25rem + 52px) 0 72px;

  @media (max-width: 768px) {
    padding: calc(4.25rem + 36px) 0 52px;
  }
`;

const PlansInHero = styled.div`
  margin-top: 56px;
  padding-top: 8px;

  @media (max-width: 768px) {
    margin-top: 40px;
  }
`;

const SectionHead = styled.div`
  text-align: center;
  margin-bottom: 28px;
`;

const QuietTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 650;
  letter-spacing: -0.025em;
  line-height: 1.25;
  color: #111;
`;

const QuietLead = styled.p`
  margin: 0 auto;
  font-size: 15px;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.58);
  max-width: 36em;

  a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (max-width: ${BP.mobile}px) {
    display: ${(p) => (p.$mobileHide ? "none" : "block")};
  }
`;

const Footnote = styled.p`
  margin: 20px auto 0;
  font-size: 13px;
  line-height: 1.55;
  color: rgba(0, 0, 0, 0.48);
  text-align: center;
  max-width: 36em;

  a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;

const FaqWrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
`;

const TableCta = styled(PlanCtaButton)`
  height: 40px;
  font-size: 13px;
  max-width: 150px;
  margin: 0 auto;
`;

const Close = styled.div`
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
`;

const CloseTitle = styled.h2`
  margin: 0 0 10px;
  font-size: 22px;
  font-weight: 650;
  letter-spacing: -0.025em;
`;

const CloseCopy = styled.p`
  margin: 0 auto 22px;
  font-size: 15px;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.58);
  max-width: 34em;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  flex-wrap: wrap;

  @media (max-width: ${BP.mobile}px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const PrimaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: 999px;
  background: ${t.colors.primary};
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    color: #fff;
    background: ${t.colors.primaryHover};
  }

  @media (max-width: ${BP.mobile}px) {
    width: 100%;
    justify-content: center;
    min-height: 48px;
  }
`;

const GhostLink = styled.a`
  font-size: 15px;
  font-weight: 600;
  color: #111;
  text-decoration: none;

  &:hover {
    color: ${t.colors.primary};
  }

  @media (max-width: ${BP.mobile}px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    width: 100%;
  }
`;

const FAQS = [
  {
    q: "What do I pay each month?",
    a: "Your plan fee ($29, $49, or $89 CAD) plus a percentage of bookings you actually collected — 4% on Basic, 3% on Growth, 2% on Advanced. If nobody books, you pay only the plan fee.",
  },
  {
    q: "How is the commission different from Stripe?",
    a: "Two separate charges. Our commission is for the booking software. Stripe’s processing fee is what Stripe charges to move the card payment, billed by Stripe.",
  },
  {
    q: "What does the first-three-months offer include?",
    a: "You pay the plan fee and no per-booking commission. You keep every feature on the plan you picked — it is not a limited trial.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes. Upgrade or downgrade any time from billing in your dashboard. Changes apply to the current or next billing period depending on the direction of the change.",
  },
  {
    q: "Is there a setup fee or a contract?",
    a: "No. Plans are billed monthly and you can cancel from your dashboard.",
  },
  {
    q: "When do I get paid?",
    a: "Funds go to your connected Stripe balance at checkout, then to your bank on the payout schedule you choose — daily, weekly, monthly, or manual. Instant payouts are also available from Stripe for about 1% extra.",
  },
  {
    q: "Can I embed on Wix, Shopify, or Squarespace?",
    a: "Yes. The booking widget is a snippet you paste on Wix, Shopify, Squarespace, WordPress, Webflow, or a custom site. Customers book without leaving your brand.",
  },
];

function PlanCta({ plan, Cta, dark }) {
  const { hasWidgetAccess, loading } = useSubscription();
  const Button = Cta || PlanCtaButton;

  if (!loading && hasWidgetAccess) {
    return (
      <Button
        as={Link}
        href="/business/dashboard/settings?tab=billing"
        $dark={dark}
      >
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

function PricingInner() {
  const [planId, setPlanId] = useState("growth");
  const selected = PLANS.find((p) => p.id === planId) || PLANS[1];

  return (
    <Page>
      <MarketingHeader />
      <MarketingSheet>
        <main>
          <Hero>
            <Container>
              <motion.div initial="hidden" animate="visible" variants={fade}>
                <PricingPlayground planId={planId} onPlanChange={setPlanId} />
              </motion.div>
              <span id="mobile-hero-end" aria-hidden />
              <PlansInHero id="plans">
                <PlanCards
                  layout="snap"
                  renderCta={(plan, { Cta, dark }) => (
                    <PlanCta plan={plan} Cta={Cta} dark={dark} />
                  )}
                />
                <Footnote>
                  Billed monthly in CAD. Change or cancel any time.{" "}
                  <Link href="/fees">Full fee breakdown</Link>.
                </Footnote>
              </PlansInHero>
            </Container>
          </Hero>

          <Section $bg="#fafbfc" $top={64} $bottom={72} id="compare">
            <Container>
              <SectionHead>
                <QuietTitle>What’s on each plan</QuietTitle>
                <QuietLead $mobileHide>
                  Tap the plus next to a row if you want the longer explanation.
                </QuietLead>
              </SectionHead>
              <PlanComparison
                renderCta={(plan) => (
                  <PlanCta plan={plan} Cta={TableCta} dark={plan.featured} />
                )}
              />
              <MobilePlanCompare
                planId={planId}
                onPlanChange={setPlanId}
                renderCta={(plan) => (
                  <PlanCta plan={plan} Cta={PlanCtaButton} dark={plan.featured} />
                )}
              />
            </Container>
          </Section>

          <Section $top={64} $bottom={56}>
            <Container>
              <SectionHead>
                <QuietTitle>Questions</QuietTitle>
                <QuietLead>
                  If yours is not here, email{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
                </QuietLead>
              </SectionHead>
              <FaqWrap>
                <AnimatedFaq items={FAQS} boxed />
              </FaqWrap>
            </Container>
          </Section>

          <Section $top={8} $bottom={88} $topSm={8} $bottomSm={56}>
            <Container>
              <Close>
                <CloseTitle>Start on any plan. Switch later.</CloseTitle>
                <CloseCopy>
                  Create an account, connect payouts, and paste the widget on
                  your site. The first three months have no booking commission.
                </CloseCopy>
                <Actions>
                  <PrimaryLink href={REGISTER_HREF}>
                    Get started <ArrowRight size={16} />
                  </PrimaryLink>
                  <GhostLink href={`mailto:${SUPPORT_EMAIL}`}>
                    Talk to our team
                  </GhostLink>
                </Actions>
              </Close>
            </Container>
          </Section>
        </main>
        <MarketingFooter />
      </MarketingSheet>
      <MobileStickyCta
        href={`${REGISTER_HREF}?plan=${selected.id}`}
        label={selected.name}
        teaser={`$${selected.price}/mo · ${selected.commission}% per booking`}
      />
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
