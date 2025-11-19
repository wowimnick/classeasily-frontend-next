"use client";

import React from "react";
import styled from "styled-components";
import { Alert, Button as AntButton } from "antd";
import ExploreHeader from "@/components/explore/ExploreHeader";

const ErrorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 2rem;
  text-align: center;
  gap: 1rem;
`;

export default function Error({ error, reset }) {
  return (
    <>
      <ExploreHeader showOptionsWrapper={false} />
      <ErrorWrapper>
        <Alert
          message="Something Went Wrong"
          description={
            error.message ||
            "We couldn't load the class details. Please try again later."
          }
          type="error"
          showIcon
          style={{ maxWidth: "600px", textAlign: "left", marginBottom: "1rem" }}
        />
        <AntButton type="primary" onClick={() => reset()}>
          Try Again
        </AntButton>
      </ErrorWrapper>
    </>
  );
}
