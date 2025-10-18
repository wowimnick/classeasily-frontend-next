"use client";

import { useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";
import { Alert, Button } from "antd";

// Dynamically import ExploreHeader with no SSR
const ExploreHeader = dynamic(
  () => import("@/components/explore/ExploreHeader"),
  { ssr: false }
);

const OverallContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${(props) => props.theme?.token?.colorBgLayout || "#f5f5f5"};
`;

const ErrorContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const HeaderFallback = styled.div`
  height: 80px;
  border-bottom: 1px solid #f1f1f1;
  background: #fff;
`;

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Registration page error:", error);
  }, [error]);

  return (
    <OverallContainer>
      <Suspense fallback={<HeaderFallback />}>
        <ExploreHeader showOptionsWrapper={false} />
      </Suspense>
      <ErrorContent>
        <Alert
          type="error"
          message="Something went wrong"
          description="We encountered an error loading the registration page. Please try again."
          action={
            <Button type="primary" onClick={reset}>
              Try Again
            </Button>
          }
          style={{ maxWidth: "600px" }}
        />
      </ErrorContent>
    </OverallContainer>
  );
}
