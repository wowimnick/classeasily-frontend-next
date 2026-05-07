"use client";

import React from "react";
import styled from "styled-components";
import { Loader2 } from "lucide-react";

const Row = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const Spin = styled(Loader2)`
  flex-shrink: 0;
  animation: exploreResultsSpin 0.65s linear infinite;
  @keyframes exploreResultsSpin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export default function ExploreResultsPrimaryLabel({
  loading,
  label,
  iconSize = 18,
  spinnerColor = "currentColor",
}) {
  return (
    <Row>
      {loading ? (
        <Spin
          size={iconSize}
          strokeWidth={2.25}
          color={spinnerColor}
          aria-hidden
        />
      ) : null}
      <span>{label}</span>
    </Row>
  );
}
