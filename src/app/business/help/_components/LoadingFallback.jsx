// --- START OF FILE /src/app/business/help/_components/LoadingFallback.jsx ---

"use client";

import styled from "styled-components";

const LoadingWrapper = styled.div`
  background: #fafbfc;
  min-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #e3e8ee;
  border-top-color: #f23951;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export default function LoadingFallback() {
  return (
    <LoadingWrapper>
      <Spinner />
    </LoadingWrapper>
  );
}
