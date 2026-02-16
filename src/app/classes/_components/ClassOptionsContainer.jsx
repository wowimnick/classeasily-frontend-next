// ClassOptionsContainer.jsx
"use client";

import React from "react";
import styled from "styled-components";
import dynamic from "next/dynamic";

// Dynamic import with loading state
const ClassOptionCard = dynamic(() => import("./ClassOptionCard"), {
  loading: () => <CardSkeleton />,
  ssr: false,
});

const PriceDisclaimer = dynamic(() => import("./PricingDisclaimer"), {
  ssr: false,
});

const Container = styled.div`
  width: 100%;
  margin: 0 auto;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  width: 100%;
`;

const CardWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  position: relative;
  overflow: visible;
  box-shadow: 0px 7px 12px 4px #0000000a;
  border-radius: 12px;
`;

const CardSkeleton = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  padding: 1.25rem;
  height: 300px;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #767676;
  background: #f8f8f8;
  border-radius: 12px;
  border: 2px dashed #d1d1d1;
`;

const ClassOptionsContainer = ({
  options,
  classTitle,
  classImages,
  currency = "$",
  onBookNow,
  businessTimeZone,
}) => {
  if (!options || options.length === 0) {
    return (
      <Container>
        <EmptyState>
          <h3>No class options available</h3>
          <p>This class doesn't have any booking options set up yet.</p>
        </EmptyState>
      </Container>
    );
  }

  const cancellationOption = options.find(
    (option) => option.cancellationPolicy,
  );
  const cancellationPolicy = cancellationOption?.cancellationPolicy;
  const cancellationRefundPercentage =
    cancellationOption?.cancellationRefundPercentage;

  return (
    <Container>
      <OptionsGrid>
        {options.map((option, index) => (
          <CardWrapper key={option.optionId}>
            {index === 0 && (
              <PriceDisclaimer
                variant="bookmark"
                cancellationPolicy={cancellationPolicy}
                cancellationRefundPercentage={cancellationRefundPercentage}
              />
            )}
            <ClassOptionCard
              option={option}
              classTitle={classTitle}
              classImages={classImages}
              currency={currency}
              onBookNow={onBookNow}
              businessTimeZone={businessTimeZone}
            />
          </CardWrapper>
        ))}
      </OptionsGrid>
    </Container>
  );
};

export default ClassOptionsContainer;
