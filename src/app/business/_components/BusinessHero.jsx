"use client";

import React from "react";
import styled from "styled-components";
import { Star, MapPin, BookOpen, MessageSquare } from "lucide-react";
import NumberFlow from "@number-flow/react";

const HeroContainer = styled.section`
  position: relative;
  background-color: #111;
  color: white;
  padding: 6rem 2rem;
  min-height: 450px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 5rem 1.5rem;
    min-height: 400px;
  }
`;

const BackgroundImage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${(props) => props.src});
  background-size: cover;
  background-position: center;
  opacity: 0.35;
  filter: blur(4px) brightness(0.9);
  transform: scale(1.05);
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.5) 0%,
    rgba(0, 0, 0, 0.7) 100%
  );
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`;

const BusinessName = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.025em;
  color: #fff;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  margin: 0;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const BusinessDescription = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: #e0e0e0;
  max-width: 650px;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const StatsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2rem;
  justify-content: center;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    gap: 0.75rem 1.5rem;
    padding: 0.75rem;
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #f0f0f0;

  svg {
    width: 18px;
    height: 18px;
    color: #ff385c;
  }

  strong {
    color: #fff;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    font-size: 0.9rem;

    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const BusinessHero = ({
  businessName,
  businessDescription,
  business_image_medium_url,
  businessCity,
  businessState,
  ratingAsNumber,
  totalReviews,
  classesCount,
}) => {
  const defaultImageUrl = `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600`;

  return (
    <HeroContainer>
      <BackgroundImage
        src={business_image_medium_url || defaultImageUrl}
        aria-hidden="true"
      />
      <Overlay />
      <HeroContent>
        <BusinessName>{businessName}</BusinessName>

        <BusinessDescription>
          {businessDescription ||
            "The business description is currently unavailable."}
        </BusinessDescription>

        <StatsRow>
          {ratingAsNumber > 0 && (
            <StatItem>
              <Star fill="#FFB800" color="#FFB800" />
              <strong>
                <NumberFlow
                  value={ratingAsNumber}
                  format={{ maximumFractionDigits: 1 }}
                />
              </strong>
              <span>Star Rating</span>
            </StatItem>
          )}

          <StatItem>
            <MessageSquare />
            <strong>
              <NumberFlow value={totalReviews} />
            </strong>
            <span>{totalReviews === 1 ? "Review" : "Reviews"}</span>
          </StatItem>

          <StatItem>
            <BookOpen />
            <strong>
              <NumberFlow value={classesCount} />
            </strong>
            <span>{classesCount === 1 ? "Class" : "Classes"}</span>
          </StatItem>

          <StatItem>
            <MapPin />
            <span>
              {businessCity}, {businessState}
            </span>
          </StatItem>
        </StatsRow>
      </HeroContent>
    </HeroContainer>
  );
};

export default BusinessHero;