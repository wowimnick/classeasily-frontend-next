"use client";

import React from "react";
import styled from "styled-components";
import { MapPin, Star } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { LordIcon } from "@/services/ReactUtils.jsx";

const HeroSection = styled.div`
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  padding: 4rem 0 3rem;

  @media (max-width: 768px) {
    padding: 2rem 0 1.5rem;
  }
`;

const HeroContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 3rem;
  display: grid;
  grid-template-columns: 140px 1fr auto;
  gap: 2.5rem;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
    padding: 0 2rem;
  }

  @media (max-width: 768px) {
    padding: 0 1.5rem;
    gap: 1.5rem;
  }
`;

const BusinessAvatar = styled.div`
  width: 140px;
  height: 140px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  background: white;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 1024px) {
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
    border-radius: 12px;
  }
`;

const BusinessInfo = styled.div`
  min-width: 0;
`;

const BusinessName = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #111;

  @media (max-width: 768px) {
    font-size: 1.75rem;
    margin-bottom: 0.75rem;
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;

  @media (max-width: 1024px) {
    justify-content: center;
  }

  @media (max-width: 768px) {
    gap: 1rem;
    margin-bottom: 1rem;
  }
`;

const LocationBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.95rem;

  svg {
    color: #ff385c;
    width: 18px;
    height: 18px;
  }
`;

const RatingBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.4rem 0.9rem;
  border-radius: 8px;
  font-size: 0.9rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  svg {
    color: #ffb800;
    width: 16px;
    height: 16px;
  }

  strong {
    font-weight: 600;
    color: #111;
  }

  span {
    color: #666;
  }
`;

const BusinessDescription = styled.p`
  font-size: 1rem;
  line-height: 1.65;
  color: #555;
  white-space: pre-line;
  max-width: 680px;
  margin: 0;

  @media (max-width: 1024px) {
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    font-size: 0.95rem;
    line-height: 1.6;
  }
`;

const QuickStats = styled.div`
  display: flex;
  gap: 1rem;
  align-self: start;

  @media (max-width: 1024px) {
    justify-content: center;
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
  }

  @media (max-width: 768px) {
    gap: 0.75rem;
  }
`;

const StatBlock = styled.div`
  text-align: center;
  padding: 1.5rem 1.75rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  min-width: 110px;

  .value {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 0.4rem;
    color: #111;
  }

  .label {
    font-size: 0.8rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    padding: 1.25rem 1.25rem;
    min-width: 90px;

    .value {
      font-size: 1.75rem;
    }

    .label {
      font-size: 0.75rem;
    }
  }
`;

const BusinessHero = ({
  businessName,
  businessDescription,
  business_image_medium_url,
  businessCity,
  businessState,
  businessAddress,
  ratingAsNumber,
  totalReviews,
  classesCount,
}) => {
  return (
    <HeroSection>
      <HeroContent>
        <BusinessAvatar>
          <img
            src={
              business_image_medium_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                businessName
              )}&size=140&background=ff385c&color=fff`
            }
            alt={`${businessName} logo`}
            loading="eager"
          />
        </BusinessAvatar>

        <BusinessInfo>
          <BusinessName>{businessName}</BusinessName>
          <MetaRow>
            <LocationBadge>
              <LordIcon
                src="https://cdn.lordicon.com/innuazqa.json"
                trigger="in"
                delay="1500"
                state="in-reveal"
                colors="primary:#ee6d66"
              />
              <span>
                {businessAddress || `${businessCity}, ${businessState}`}
              </span>
            </LocationBadge>
            {ratingAsNumber > 0 && (
              <RatingBadge>
                <Star size={16} fill="#FFB800" />
                <strong>{ratingAsNumber.toFixed(1)}</strong>
                <span>
                  (<NumberFlow value={totalReviews} />)
                </span>
              </RatingBadge>
            )}
          </MetaRow>
          <BusinessDescription>
            {businessDescription ||
              "The business description is currently unavailable."}
          </BusinessDescription>
        </BusinessInfo>

        <QuickStats>
          <StatBlock>
            <div className="value">
              <NumberFlow value={classesCount} />
            </div>
            <div className="label">Classes</div>
          </StatBlock>
          <StatBlock>
            <div className="value">
              <NumberFlow value={totalReviews} />
            </div>
            <div className="label">Reviews</div>
          </StatBlock>
          {ratingAsNumber > 0 && (
            <StatBlock>
              <div className="value">
                <NumberFlow
                  value={ratingAsNumber}
                  format={{ maximumFractionDigits: 1 }}
                />
              </div>
              <div className="label">Rating</div>
            </StatBlock>
          )}
        </QuickStats>
      </HeroContent>
    </HeroSection>
  );
};

export default BusinessHero;
