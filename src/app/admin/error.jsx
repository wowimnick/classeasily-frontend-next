"use client";

import { useEffect } from "react";
import styled from "styled-components";
import { Button, Result } from "antd";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: #f8fafc;
`;

const StyledResult = styled(Result)`
  .ant-result-icon {
    margin-bottom: 24px;
  }
`;

export default function AdminError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Admin page error:", error);
  }, [error]);

  return (
    <ErrorContainer>
      <StyledResult
        status="error"
        icon={<AlertTriangle size={72} color="#ef4444" />}
        title="Something went wrong"
        subTitle={
          error?.message ||
          "An unexpected error occurred while loading the admin dashboard."
        }
        extra={[
          <Button
            key="retry"
            type="primary"
            icon={<RefreshCw size={16} />}
            onClick={() => reset()}
          >
            Try Again
          </Button>,
          <Button
            key="home"
            icon={<Home size={16} />}
            onClick={() => router.push("/")}
          >
            Go Home
          </Button>,
        ]}
      />
    </ErrorContainer>
  );
}
