"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Button, Typography } from "antd";
import { Sparkles } from "lucide-react";
import { MARKETING_BILLING_PATH } from "./marketingLayout";

const { Title, Text } = Typography;

const Card = styled.div`
  max-width: 520px;
  margin-top: 8px;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: linear-gradient(180deg, #fafafa 0%, #fff 48%);
`;

const List = styled.ul`
  margin: 12px 0 16px;
  padding-left: 20px;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
`;

export default function MarketingFeatureUpsell({ title, bullets, minPlanLabel }) {
  const router = useRouter();

  return (
    <Card>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Sparkles size={28} color="#6366f1" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
            {title}
          </Title>
          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
            Included on the <strong>{minPlanLabel}</strong> email marketing plan and above.
          </Text>
          <List>
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </List>
          <Button type="primary" onClick={() => router.push(MARKETING_BILLING_PATH)}>
            View plans
          </Button>
          <Text type="secondary" style={{ display: "block", marginTop: 12, fontSize: 13 }}>
            Or open{" "}
            <Link href="/business/dashboard/settings?tab=plan-billing">Plans &amp; billing</Link> directly.
          </Text>
        </div>
      </div>
    </Card>
  );
}
