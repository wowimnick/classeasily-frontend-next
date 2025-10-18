"use client";

import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(
    to right,
    #f0f0f0 0%,
    #f8f8f8 20%,
    #f0f0f0 40%,
    #f0f0f0 100%
  );
  background-size: 800px 100px;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: ${(props) => props.$radius || "8px"};
`;

const SkeletonModalLoader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 350px;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
`;

const SkeletonBookingHeader = styled.div`
  background: #fafafa;
  padding: 16px 24px;
  margin: -24px -24px 24px -24px;
  border-bottom: 1px solid #f0f0f0;

  @media (max-width: 768px) {
    padding: 16px 20px;
    margin: -16px -20px 20px -20px;
  }
`;

const SkeletonTitle = styled(SkeletonBase)`
  height: 20px;
  width: 70%;
  margin-bottom: 12px;
`;

const SkeletonDetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const SkeletonIcon = styled(SkeletonBase)`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
`;

const SkeletonText = styled(SkeletonBase)`
  height: 14px;
  width: ${(props) => props.$width || "50%"};
`;

const SkeletonSection = styled.div`
  margin-bottom: 24px;

  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

const SkeletonSectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    margin-bottom: 12px;
  }
`;

const SkeletonSectionTitle = styled(SkeletonBase)`
  height: 18px;
  width: 180px;
`;

const SkeletonPolicyCard = styled.div`
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    padding: 12px;
    margin-bottom: 20px;
  }
`;

const SkeletonPolicyHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const SkeletonPolicyName = styled(SkeletonBase)`
  height: 16px;
  width: 150px;
`;

const SkeletonPolicyDesc = styled(SkeletonBase)`
  height: 40px;
  width: 100%;
`;

const SkeletonFinancialSummary = styled.div`
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

const SkeletonFinancialRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: white;

  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }

  &.total {
    background-color: #fafafa;
  }

  @media (max-width: 768px) {
    padding: 12px 14px;
  }
`;

const SkeletonLabel = styled(SkeletonBase)`
  height: 14px;
  width: ${(props) => props.$width || "120px"};
`;

const SkeletonValue = styled(SkeletonBase)`
  height: 14px;
  width: 60px;
`;

const SkeletonNotice = styled.div`
  padding: 16px;
  border-radius: 12px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background-color: #fafafa;

  @media (max-width: 768px) {
    padding: 12px 14px;
  }
`;

const SkeletonNoticeIcon = styled(SkeletonBase)`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 50%;
`;

const SkeletonNoticeContent = styled.div`
  flex: 1;
`;

const SkeletonNoticeTitle = styled(SkeletonBase)`
  height: 16px;
  width: 150px;
  margin-bottom: 8px;
`;

const SkeletonNoticeDesc = styled(SkeletonBase)`
  height: 32px;
  width: 100%;
`;

const CancellationModalSkeleton = () => {
  return (
    <>
      <SkeletonSection>
        <SkeletonSectionHeader>
          <SkeletonIcon $radius="4px" />
          <SkeletonSectionTitle />
        </SkeletonSectionHeader>
        <SkeletonPolicyCard>
          <SkeletonPolicyHeader>
            <SkeletonIcon $radius="4px" />
            <SkeletonPolicyName />
          </SkeletonPolicyHeader>
          <SkeletonPolicyDesc />
        </SkeletonPolicyCard>
      </SkeletonSection>

      <SkeletonSection>
        <SkeletonSectionHeader>
          <SkeletonIcon $radius="4px" />
          <SkeletonSectionTitle />
        </SkeletonSectionHeader>
        <SkeletonFinancialSummary>
          <SkeletonFinancialRow>
            <SkeletonLabel $width="140px" />
            <SkeletonValue />
          </SkeletonFinancialRow>
          <SkeletonFinancialRow>
            <SkeletonLabel $width="160px" />
            <SkeletonValue />
          </SkeletonFinancialRow>
          <SkeletonFinancialRow className="total">
            <SkeletonLabel $width="120px" />
            <SkeletonValue />
          </SkeletonFinancialRow>
        </SkeletonFinancialSummary>
      </SkeletonSection>

      <SkeletonNotice>
        <SkeletonNoticeIcon />
        <SkeletonNoticeContent>
          <SkeletonNoticeTitle />
          <SkeletonNoticeDesc />
        </SkeletonNoticeContent>
      </SkeletonNotice>
    </>
  );
};

export default CancellationModalSkeleton;
