// app/explore/[...slug]/error.jsx
"use client";

import { useEffect } from "react";
import { captureRouteError } from "@/lib/capture-route-error";
import styled from "styled-components";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
`;

const ErrorIcon = styled.div`
  color: #ff385c;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #222;
`;

const ErrorMessage = styled.p`
  color: #717171;
  margin-bottom: 2rem;
`;

const RetryButton = styled.button`
  padding: 12px 24px;
  background: #ff385c;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #e31c5f;
  }
`;

export default function Error({ error, reset }) {
  useEffect(() => {
    captureRouteError(error, "Explore page error:");
  }, [error]);

  return (
    <ErrorContainer>
      <ErrorIcon>
        <AlertCircle size={64} />
      </ErrorIcon>
      <ErrorTitle>Something went wrong</ErrorTitle>
      <ErrorMessage>
        We couldn't load the classes. Please try again.
      </ErrorMessage>
      <RetryButton onClick={() => reset()}>Try again</RetryButton>
      <Link href="/" style={{ marginTop: "1rem", color: "#717171" }}>
        Go back home
      </Link>
    </ErrorContainer>
  );
}
