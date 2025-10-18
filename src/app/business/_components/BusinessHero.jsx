"use client";

import React from "react";
import styled from "styled-components";
import { MapPin, Star } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { LordIcon } from "@/services/ReactUtils.jsx";

const HeroSection = styled.div`
  background: white;
  border-bottom: 1px solid #e8e8e8;
  padding: 3rem 0;

  @media (max-width: 768px) {
    padding: 2rem 0 0 0;
  }
`;

const HeroContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 180px 1fr 320px;
  gap: 3rem;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  @media (max-width: 768px) {
    padding: 0 1rem;
    gap: 1.5rem;
  }
`;

const BusinessAvatar = styled.div`
  width: 180px;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 1024px) {
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    width: 120px;
    height: 120px;
  }
`;

const BusinessInfo = styled.div`
  padding-top: 1rem;

  @media (max-width: 1024px) {
    padding-top: 0;
  }
`;

const BusinessName = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  line-height: 1.2;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const LocationRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: #666;
  margin-bottom: 1.5rem;

  @media (max-width: 1024px) {
    justify-content: center;
  }

  svg {
    color: #ff385c;
  }
`;

const RatingBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8f8f8;
  padding: 0.5rem 1rem;
  border-radius: 100px;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;

  svg {
    color: #ffb800;
  }

  strong {
    font-weight: 600;
  }
`;

const BusinessDescription = styled.p`
  font-size: 1.05rem;
  line-height: 1.7;
  color: #444;
  white-space: pre-line;
  max-width: 720px;

  @media (max-width: 1024px) {
    margin: 0 auto;
  }
`;

const QuickStats = styled.div`
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-self: start;
  position: sticky;
  top: 100px;

  @media (max-width: 1024px) {
    position: static;
    max-width: 500px;
    margin: 0 auto;
    width: 100%;
  }

  @media (max-width: 768px) {
    flex-direction: row;
    gap: 1rem;
    padding: 1rem 0;
  }
`;

const StatBlock = styled.div`
  text-align: center;
  padding: 1rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  border-radius: 12px;

  &:last-child {
    border-bottom: none;
  }

  .value {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 0.25rem;
    color: #111;
  }

  .label {
    font-size: 0.85rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    flex: 1;
    padding: 0.75rem 0.5rem;
    .value {
      font-size: 2rem;
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
              )}&size=180&background=ff385c&color=fff`
            }
            alt={`${businessName} logo`}
            loading="eager"
          />
        </BusinessAvatar>

        <BusinessInfo>
          <BusinessName>{businessName}</BusinessName>
          <LocationRow>
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
          </LocationRow>
          {ratingAsNumber > 0 && (
            <RatingBadge>
              <Star size={18} fill="#FFB800" />
              <strong>{ratingAsNumber.toFixed(1)}</strong>
              <span>
                (<NumberFlow value={totalReviews} />{" "}
                {totalReviews === 1 ? "review" : "reviews"})
              </span>
            </RatingBadge>
          )}
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
            <div className="label">Total Reviews</div>
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
