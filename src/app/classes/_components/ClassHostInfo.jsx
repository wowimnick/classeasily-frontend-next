"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import { Building2, Star, Calendar } from "lucide-react";
import { Skeleton } from "antd";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const HostSectionWrapper = styled.section`
  padding: 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  padding-bottom: 1rem;
  font-weight: 600;
  color: #000;
  margin: 0 0 0 0;
  line-height: 1.3;
  text-align: center;
`;

const HostCard = styled(motion.button)`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:hover:not(:disabled) {
    border-color: #ff385c;
    box-shadow: 0 2px 8px rgba(255, 56, 92, 0.08);
  }
  &:focus-visible {
    outline: 2px solid #ff385c;
    outline-offset: 2px;
  }
  &:disabled {
    cursor: default;
  }
  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 10px;
  }
`;

const HostRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const HostAvatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  background: #f3f4f6;
  flex-shrink: 0;
`;

const HostImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HostMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const HostName = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  display: block;
  margin-bottom: 2px;
`;

const HostMeta = styled.span`
  font-size: 0.8125rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  svg {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
  }
`;

const HostStats = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    height: 0;
    display: none;
  }
  scrollbar-width: none;
`;

const StatItem = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  white-space: nowrap;
  svg {
    width: 12px;
    height: 12px;
    color: #9ca3af;
    flex-shrink: 0;
  }
`;

const StatItemHiddenOnMobile = styled(StatItem)`
  @media (max-width: 768px) {
    display: none !important;
  }
`;

const LoadingContainer = styled.div`
  padding: 1rem;
  max-width: 800px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
`;

const HostInfo = React.memo(({ businessData, onHostClick, classReviewCount }) => {
  const router = useRouter();

  const handleNavigation = () => {
    if (businessData?.slug) {
      router.push(`/business/${businessData.slug}`);
    } else if (onHostClick) {
      onHostClick();
    }
  };

  const {
    hostDisplayName,
    platformTenure,
    platformTenureLabel,
    memberSince,
    foundingYearDisplay,
    totalReviews,
    businessImage,
    isLoading,
  } = useMemo(() => {
    if (!businessData) return { isLoading: true };

    const { founding_year, createdAt, businessName, total_reviews_count } =
      businessData;
    let tenureValue = "New";
    let tenureLabel = "on ClassEasily";
    if (createdAt) {
      const registrationDate = new Date(createdAt);
      const diffTime = Date.now() - registrationDate.getTime();
      const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
      if (diffMonths >= 12) {
        const diffYears = Math.floor(diffMonths / 12);
        tenureValue = `${diffYears} yr${diffYears > 1 ? "s" : ""}`;
      } else if (diffMonths >= 1) {
        tenureValue = `${diffMonths} mo`;
      }
    }

    const since = createdAt
      ? new Date(createdAt).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        })
      : "—";

    return {
      isLoading: false,
      hostDisplayName: businessName || "Host",
      platformTenure: tenureValue,
      platformTenureLabel: tenureLabel,
      memberSince: since,
      foundingYearDisplay: founding_year
        ? `Founded ${founding_year}`
        : null,
      totalReviews:
        classReviewCount != null
          ? classReviewCount
          : (total_reviews_count ?? 0),
      businessImage: businessData.business_image_medium_url,
    };
  }, [businessData, classReviewCount]);

  if (isLoading) {
    return (
      <LoadingContainer>
        <Skeleton active avatar={{ size: 56 }} paragraph={{ rows: 1 }} />
      </LoadingContainer>
    );
  }

  return (
    <HostSectionWrapper>
      <SectionTitle>Meet your host</SectionTitle>
      <HostCard
        onClick={handleNavigation}
        disabled={!businessData?.slug && !onHostClick}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        aria-label={`View details for ${hostDisplayName}`}
      >
        <HostRow>
          <HostAvatar>
            {businessImage ? (
              <HostImg
                src={businessImage}
                alt={`${hostDisplayName}`}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                }}
              >
                <Building2 size={24} />
              </div>
            )}
          </HostAvatar>
          <HostMain>
            <HostName>{hostDisplayName}</HostName>
            <HostMeta>
              <Building2 size={14} />
              {foundingYearDisplay || "Host on ClassEasily"}
            </HostMeta>
          </HostMain>
        </HostRow>
        <HostStats>
          <StatItem>
            <Star size={14} />
            {totalReviews} review{totalReviews !== 1 ? "s" : ""}
          </StatItem>
          <StatItem>
            <Calendar size={14} />
            {platformTenure} {platformTenureLabel}
          </StatItem>
          <StatItemHiddenOnMobile>Member since {memberSince}</StatItemHiddenOnMobile>
      </HostStats>
      </HostCard>
    </HostSectionWrapper>
  );
});

HostInfo.displayName = "HostInfo";
export default HostInfo;
