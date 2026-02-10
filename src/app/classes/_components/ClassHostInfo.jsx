"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import { Building } from "lucide-react";
import { Skeleton } from "antd";
import { motion } from "framer-motion";
import { LordIcon } from "@/services/ReactUtils";
import { useRouter } from "next/navigation";

// --- Styled Components --- (No changes needed)
const HostInfoContainer = styled(motion.button)`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
  text-align: left;
  cursor: pointer;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }
  &:focus-visible {
    outline: 2px solid #ff385c;
    outline-offset: 2px;
  }
  &:disabled {
    cursor: default;
  }
  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border-top: 1px solid #f0f0f0;
  }
  @media (max-width: 480px) {
    padding: 1.25rem;
    text-align: initial;
    border-radius: 10px;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
    border-bottom: 1px solid #f0f0f0;
  }
`;
const HostHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eaeaea;
  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    gap: 1.25rem;
    padding-bottom: 1.25rem;
    margin-bottom: 1.25rem;
  }
  @media (max-width: 480px) {
    gap: 1rem;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }
`;
const HostAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #f0f0f0;
  background-color: #f8f9fa;
  flex-shrink: 0;
  @media (max-width: 600px) {
    width: 72px;
    height: 72px;
    border-width: 2px;
  }
  @media (max-width: 480px) {
    width: 64px;
    height: 64px;
  }
`;
const HostImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;
const HostDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-grow: 1;
  @media (max-width: 600px) {
    align-items: center;
  }
`;
const HostName = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #000;
  margin: 0;
  line-height: 1.3;
  @media (max-width: 768px) {
    font-size: 1.375rem;
  }
  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;
const HostSince = styled.p`
  font-size: 0.95rem;
  color: #767676;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  @media (max-width: 480px) {
    font-size: 0.9rem;
    gap: 0.375rem;
  }
`;
const HostStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.875rem;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    max-width: 300px;
    margin: 0 auto;
  }
  @media (max-width: 480px) {
    gap: 0.75rem;
    max-width: 280px;
  }
`;
const StatBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  svg {
    width: 20px;
    height: 20px;
    color: #ff385c;
    flex-shrink: 0;
  }
  @media (max-width: 768px) {
    padding: 0.875rem;
    gap: 0.875rem;
  }
  @media (max-width: 600px) {
    flex-direction: row;
    align-items: center;
    text-align: left;
    padding: 1rem;
    gap: 1rem;
  }
  @media (max-width: 480px) {
    padding: 0.875rem 0.75rem;
    gap: 0.75rem;
    border-radius: 10px;
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;
const StatTextContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
`;
const StatValue = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: #000;
  line-height: 1.2;
  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;
const StatLabel = styled.span`
  font-size: 0.85rem;
  color: #5a5a5a;
  line-height: 1.3;
  margin-top: 2px;
  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;
const LoadingContainer = styled.div`
  padding: 2rem;
  max-width: 800px;
  background: white;
  border-radius: 16px;
  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 12px;
  }
  @media (max-width: 480px) {
    padding: 1.25rem;
    border-radius: 10px;
  }
`;

const HostInfo = React.memo(({ businessData, onHostClick, classReviewCount }) => {
  const router = useRouter();

  const handleNavigation = () => {
    if (businessData?.slug) {
      router.push(`/business/${businessData.slug}`);
    } else if (onHostClick) {
      onHostClick(); // Fallback to modal if no slug is present
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
    let tenureValue = "New Partner";
    let tenureLabel = "on Classeasily";
    if (createdAt) {
      const registrationDate = new Date(createdAt);
      const diffTime = Date.now() - registrationDate.getTime();
      const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
      if (diffMonths >= 12) {
        const diffYears = Math.floor(diffMonths / 12);
        tenureValue = `${diffYears} year${diffYears > 1 ? "s" : ""}`;
      } else if (diffMonths >= 1) {
        tenureValue = `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
      }
    }

    const since = createdAt
      ? new Date(createdAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        })
      : "N/A";

    return {
      isLoading: false,
      hostDisplayName: businessName || "Host",
      platformTenure: tenureValue,
      platformTenureLabel: tenureLabel,
      memberSince: since,
      foundingYearDisplay: founding_year
        ? `Founded in ${founding_year}`
        : "History not provided",
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
        <Skeleton active avatar={{ size: 80 }} paragraph={{ rows: 2 }} />
      </LoadingContainer>
    );
  }

  return (
    <HostInfoContainer
      onClick={handleNavigation}
      disabled={!businessData?.slug && !onHostClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label={`View details for host: ${hostDisplayName}`}
    >
      <HostHeader>
        <HostAvatar>
          <HostImg
            src={businessImage}
            alt={`Profile picture of ${hostDisplayName}`}
          />
        </HostAvatar>
        <HostDetails>
          <HostName id="host-info-name">Hosted by {hostDisplayName}</HostName>
          <HostSince>
            <Building size={16} aria-hidden="true" />
            {foundingYearDisplay}
          </HostSince>
        </HostDetails>
      </HostHeader>
      <HostStatsGrid>
        <StatBlock>
          <LordIcon
            src="https://cdn.lordicon.com/uwnsxkfm.json"
            trigger="in"
            delay="1500"
            state="in-thumbs"
            colors="primary:#fa395f"
          />
          <StatTextContainer>
            <StatValue>{totalReviews}</StatValue>
            <StatLabel>Total Reviews</StatLabel>
          </StatTextContainer>
        </StatBlock>
        <StatBlock>
          <LordIcon
            src="https://cdn.lordicon.com/cfkiwvcc.json"
            trigger="in"
            delay="1500"
            state="in-article"
            colors="primary:#fa395f"
          />
          <StatTextContainer>
            <StatValue>{platformTenure}</StatValue>
            <StatLabel>{platformTenureLabel}</StatLabel>
          </StatTextContainer>
        </StatBlock>
        <StatBlock>
          <LordIcon
            src="https://cdn.lordicon.com/okqjaags.json"
            trigger="in"
            delay="1500"
            state="in-clock"
            colors="primary:#fa395f"
          />
          <StatTextContainer>
            <StatValue>{memberSince}</StatValue>
            <StatLabel>Member Since</StatLabel>
          </StatTextContainer>
        </StatBlock>
      </HostStatsGrid>
    </HostInfoContainer>
  );
});

HostInfo.displayName = "HostInfo";
export default HostInfo;
