"use client";

import styled from "styled-components";
import { useEffect } from "react";

const ErrorWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  background: #ffffff;
`;

const ErrorTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.p`
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 2rem;
  max-width: 500px;
`;

const RetryButton = styled.button`
  background: #dc2626;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.25s ease;
  &:hover {
    background: #ef4444;
  }
`;

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorWrapper>
      <ErrorTitle>Something went wrong</ErrorTitle>
      <ErrorMessage>
        We're sorry, but something unexpected happened. Please try again.
      </ErrorMessage>
      <RetryButton onClick={() => reset()}>Try again</RetryButton>
    </ErrorWrapper>
  );
}
