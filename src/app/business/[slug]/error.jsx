"use client";

import { useEffect } from "react";
import { Alert } from "antd";
import { captureRouteError } from "@/lib/capture-route-error";
import styled from "styled-components";

const ErrorWrapper = styled.div`
  max-width: 600px;
  margin: 4rem auto;
  padding: 0 1.5rem;
`;

export default function Error({ error, reset }) {
  useEffect(() => {
    captureRouteError(error, "Business page error:");
  }, [error]);

  return (
    <ErrorWrapper>
      <Alert
        message="Error"
        description={error.message || "An unexpected error occurred."}
        type="error"
        showIcon
      />
      <button onClick={() => reset()} style={{ marginTop: "1rem" }}>
        Try again
      </button>
    </ErrorWrapper>
  );
}
