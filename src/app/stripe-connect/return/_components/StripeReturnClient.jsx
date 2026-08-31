"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { Typography } from "antd";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";

const { Text, Title } = Typography;

const ReturnPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 20px;
  text-align: center;
`;

function StripeReturnClientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const stripeReturn = searchParams.get("stripe_return");
    const stripeRefresh = searchParams.get("stripe_refresh");
    const originalIntent = searchParams.get("original_intent");

    console.log("StripeReturnPage: Processing. Params:", {
      stripeReturn,
      stripeRefresh,
      originalIntent,
    });

    if (stripeReturn === "true" || stripeRefresh === "true") {
      if (originalIntent === "onboarding") {
        router.replace("/business/register?step=about-industry");
        return;
      }
      if (originalIntent === "dashboard_settings") {
        sessionStorage.setItem("forceOpenSettingsTab", "preferences");
        localStorage.setItem(
          "stripeOnboardingStatus",
          stripeReturn ? "returned" : "refreshed"
        );
        console.log(
          "StripeReturnPage: Setting forceOpenSettingsTab to 'preferences'"
        );
      } else {
        console.log(
          "StripeReturnPage: Stripe action detected but original_intent is not 'dashboard_settings'."
        );
      }
    } else {
      console.log(
        "StripeReturnPage: No specific Stripe action or relevant intent detected in query params."
      );
    }

    const dashboardPath = "/business/dashboard/overview";
    console.log(`StripeReturnPage: Navigating to ${dashboardPath}`);
    router.replace(dashboardPath);
  }, [router, searchParams]);

  return (
    <ReturnPageWrapper>
      <GlobalLoaderWithoutInlineStyles />
      <Title level={4} style={{ marginBottom: 8, marginTop: 20 }}>
        Finalizing Stripe Setup
      </Title>
      <Text type="secondary">
        Please wait, you are being redirected to your dashboard...
      </Text>
    </ReturnPageWrapper>
  );
}

export default function StripeReturnClient() {
  return (
    <Suspense fallback={<GlobalLoaderWithoutInlineStyles />}>
      <StripeReturnClientContent />
    </Suspense>
  );
}
