"use client";
import React, { useEffect } from "react";
import styled from "styled-components";
import { captureRouteError } from "@/lib/capture-route-error";

const ErrorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
`;

const ErrorTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.p`
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 2rem;
`;

const RetryButton = styled.button`
  background: #e63946;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background: #d62828;
  }
`;

export default function Error({ error, reset }) {
  useEffect(() => {
    captureRouteError(error, "Blog error:");
  }, [error]);

  return (
    <ErrorWrapper>
      <ErrorTitle>Something went wrong!</ErrorTitle>
      <ErrorMessage>
        {error.message || "Failed to load blog posts. Please try again later."}
      </ErrorMessage>
      <RetryButton onClick={() => reset()}>Try again</RetryButton>
    </ErrorWrapper>
  );
}
