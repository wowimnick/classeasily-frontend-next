"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";
import { Check, ChevronDown } from "lucide-react";
import {
  PLANS,
  WIDGET_PLAN_COMPARISON_ROWS,
} from "@/lib/subscriptionPlans";
import { SubscriptionProvider, useSubscription } from "@/context/SubscriptionContext";
import {
  marketingTheme as t,
  REGISTER_HREF,
  SUPPORT_EMAIL,
} from "@/components/marketing/tokens";
import {
  Container,
  Section,
  ButtonLink,
  Eyebrow,
  H1,
  H2,
  Lead,
} from "@/components/marketing/primitives";
import MarketingHeader, {
  MarketingHeaderSpacer,
} from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";

const Page = styled.div`
  font-family: ${t.fonts.body};
  background: ${t.colors.white};
  color: ${t.colors.text};
  min-height: 100vh;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 40px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.article`
  border: 1px solid ${(p) => (p.$featured ? t.colors.primary : t.colors.border)};
  border-radius: 16px;
  padding: 28px 24px;
  position: relative;
  background: #fff;
  box-shadow: ${(p) => (p.$featured ? t.shadows.md : "none")};
  display: flex;
  flex-direction: column;
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
  font-size: 40px;
  font-weight: 800;
  color: ${t.colors.dark};
  letter-spacing: -0.03em;
  margin: 8px 0;
  span {
    font-size: 15px;
    font-weight: 600;
    color: ${t.colors.textLight};
  }
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 16px 0 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  li {
    display: flex;
    gap: 8px;
    font-size: 14px;
    line-height: 1.4;
    color: ${t.colors.dark};
  }
`;

const TableWrap = styled.div`
  overflow-x: auto;
  margin-top: 32px;
  border: 1px solid ${t.colors.border};
  border-radius: 16px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  th,
  td {
    padding: 14px 16px;
    text-align: left;
    border-bottom: 1px solid ${t.colors.border};
  }
  th {
    background: ${t.colors.bgLight};
    color: ${t.colors.dark};
    font-weight: 700;
  }
  td:not(:first-child),
  th:not(:first-child) {
    text-align: center;
  }
`;

const FaqItem = styled.div`
  border-bottom: 1px solid ${t.colors.border};
`;

const FaqBtn = styled.button`
  width: 100%;
  background: none;
  border: 0;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  text-align: left;
  padding: 18px 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  color: ${t.colors.dark};
`;

const FaqBody = styled.p`
  margin: 0 0 18px;
  color: ${t.colors.text};
  line-height: 1.6;
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

function PlanCta({ plan }) {
  const { hasWidgetAccess, loading } = useSubscription();
  if (!loading && hasWidgetAccess) {
    return (
      <ButtonLink
        href="/business/dashboard/settings?tab=billing"
        $variant={plan.featured ? "primary" : "secondary"}
        style={{ width: "100%" }}
      >
        Manage plan
      </ButtonLink>
    );
  }
  return (
    <ButtonLink
      href={`${REGISTER_HREF}?plan=${plan.id}`}
      $variant={plan.featured ? "primary" : "secondary"}
      style={{ width: "100%" }}
    >
      Get started
    </ButtonLink>
  );
}

function PricingInner() {
  const [openFaq, setOpenFaq] = useState(0);

  const rows = useMemo(
    () => WIDGET_PLAN_COMPARISON_ROWS.filter((row) => row.id !== "marketplace"),
    [],
  );

  return (
    <Page>
      <MarketingHeader />
      <MarketingHeaderSpacer />
      <main>
        <Section $pad="64px 0 24px">
          <Container style={{ textAlign: "center" }}>
            <Eyebrow>Pricing</Eyebrow>
            <H1>Priced for small teams.</H1>
            <Lead $max="560px" style={{ margin: "0 auto" }}>
              A flat monthly fee plus a small commission per booking. No setup
              fee. Cancel anytime.
            </Lead>
          </Container>
        </Section>

        <Section $pad="24px 0 64px">
          <Container>
            <Grid>
              {PLANS.map((plan) => (
                <Card key={plan.id} $featured={plan.featured}>
                  {plan.featured && <Badge>Most popular</Badge>}
                  <div style={{ fontWeight: 800, color: t.colors.dark, fontSize: 20 }}>
                    {plan.name}
                  </div>
                  <Price>
                    ${plan.price}
                    <span>/mo CAD</span>
                  </Price>
                  <div style={{ color: t.colors.text, fontSize: 14 }}>
                    {plan.commission}% per booking
                  </div>
                  <List>
                    {(plan.features || []).slice(0, 7).map((f) => (
                      <li key={f.label}>
                        <Check size={16} color={t.colors.primary} />
                        {f.label}
                      </li>
                    ))}
                  </List>
                  <PlanCta plan={plan} />
                </Card>
              ))}
            </Grid>
          </Container>
        </Section>

        <Section $bg={t.colors.bgLight}>
          <Container>
            <H2>Compare plans</H2>
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
                          {row.valueType === "text"
                            ? row.text?.[id]
                            : row.plans?.[id]
                              ? "Yes"
                              : "—"}
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
          <Container style={{ maxWidth: 760 }}>
            <H2>Questions</H2>
            {FAQS.map((item, i) => (
              <FaqItem key={item.q}>
                <FaqBtn
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  aria-expanded={openFaq === i}
                >
                  {item.q}
                  <ChevronDown
                    size={18}
                    style={{
                      transform: openFaq === i ? "rotate(180deg)" : "none",
                      transition: "transform 0.15s",
                    }}
                  />
                </FaqBtn>
                {openFaq === i && <FaqBody>{item.a}</FaqBody>}
              </FaqItem>
            ))}
            <p style={{ marginTop: 28 }}>
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
