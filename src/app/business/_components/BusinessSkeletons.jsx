"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%);
  background-size: 2000px 100%;
  animation: ${shimmer} 2s infinite;
  border-radius: 8px;
`;

const DarkSkeletonBase = styled(SkeletonBase)`
  background: linear-gradient(90deg, #333 0%, #444 50%, #333 100%);
  background-size: 2000px 100%;
`;

const SkeletonTextLine = styled(SkeletonBase)`
  height: ${(props) => props.height || "20px"};
  width: ${(props) => props.width || "100%"};
  margin-bottom: ${(props) => props.mb || "0"};
`;

// --- NEW HERO SKELETON ---
const HeroSkeletonWrapper = styled.div`
  position: relative;
  background-color: #222;
  min-height: 450px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  padding: 2rem;

  @media (max-width: 768px) {
    min-height: 400px;
    padding: 1.5rem;
  }
`;

const HeroSkeletonContent = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`;

const SkeletonName = styled(DarkSkeletonBase)`
  height: 48px;
  width: 60%;
  max-width: 500px;
  border-radius: 8px;

  @media (max-width: 768px) {
    height: 36px;
  }
`;

const SkeletonDescriptionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 80%;
  max-width: 600px;
`;

const SkeletonDescriptionLine = styled(DarkSkeletonBase)`
  height: 18px;
  border-radius: 4px;

  @media (max-width: 768px) {
    height: 16px;
  }
`;

const SkeletonStatsRow = styled(DarkSkeletonBase)`
  height: 60px;
  width: 90%;
  max-width: 550px;
  border-radius: 12px;
  margin-top: 1rem;

  @media (max-width: 768px) {
    height: 50px;
  }
`;

export const BusinessHeroSkeleton = () => (
  <HeroSkeletonWrapper>
    <HeroSkeletonContent>
      <SkeletonName />
      <SkeletonDescriptionWrapper>
        <SkeletonDescriptionLine style={{ width: "100%" }} />
        <SkeletonDescriptionLine style={{ width: "85%" }} />
      </SkeletonDescriptionWrapper>
      <SkeletonStatsRow />
    </HeroSkeletonContent>
  </HeroSkeletonWrapper>
);

// Classes Tab Skeleton
const ClassesGridSkeleton = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 2rem 0;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileCarouselSkeleton = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding: 1rem 0.5rem;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const SkeletonClassCard = styled.div`
  background: white;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  overflow: hidden;

  @media (max-width: 768px) {
    min-width: 280px;
    flex-shrink: 0;
  }
`;

const SkeletonClassImage = styled(SkeletonBase)`
  width: 100%;
  height: 200px;
  border-radius: 0;
`;

const SkeletonClassContent = styled.div`
  padding: 1rem;
`;

export const ClassesTabSkeleton = () => (
  <div>
    <SkeletonTextLine height="28px" width="250px" mb="8px" />
    <SkeletonTextLine height="16px" width="400px" mb="32px" />

    <ClassesGridSkeleton>
      {[...Array(6)].map((_, i) => (
        <SkeletonClassCard key={i}>
          <SkeletonClassImage />
          <SkeletonClassContent>
            <SkeletonTextLine height="20px" width="80%" mb="12px" />
            <SkeletonTextLine height="16px" width="60%" mb="12px" />
            <SkeletonTextLine height="16px" width="40%" />
          </SkeletonClassContent>
        </SkeletonClassCard>
      ))}
    </ClassesGridSkeleton>

    <MobileCarouselSkeleton>
      {[...Array(3)].map((_, i) => (
        <SkeletonClassCard key={i}>
          <SkeletonClassImage />
          <SkeletonClassContent>
            <SkeletonTextLine height="20px" width="80%" mb="12px" />
            <SkeletonTextLine height="16px" width="60%" mb="12px" />
            <SkeletonTextLine height="16px" width="40%" />
          </SkeletonClassContent>
        </SkeletonClassCard>
      ))}
    </MobileCarouselSkeleton>
  </div>
);

// Reviews Tab Skeleton - UPDATED VERSION
const ReviewsColumnContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const ReviewColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const SkeletonTimeDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0 1rem 0;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, #e0e0e0, transparent);
  }

  @media (max-width: 768px) {
    margin: 1rem 0 0.75rem 0;
  }
`;

const SkeletonDividerIcon = styled(SkeletonBase)`
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
`;

const SkeletonDividerText = styled(SkeletonBase)`
  width: 100px;
  height: 12px;
  border-radius: 4px;
`;

const SkeletonReviewCard = styled.div`
  background: white;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 1.25rem;
  position: relative;

  @media (max-width: 768px) {
    padding: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.875rem;
  }
`;

const SkeletonSourceTag = styled(SkeletonBase)`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 80px;
  height: 22px;
  border-radius: 6px;
`;

const SkeletonReviewHeader = styled.div`
  display: flex;
  gap: 0.875rem;
  margin-bottom: 0.75rem;

  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const SkeletonReviewAvatar = styled(SkeletonBase)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
  }
`;

const SkeletonReviewInfo = styled.div`
  flex: 1;
`;

const SkeletonReviewStars = styled(SkeletonBase)`
  width: 90px;
  height: 14px;
  border-radius: 4px;
  margin-top: 4px;

  @media (max-width: 480px) {
    height: 12px;
  }
`;

const SkeletonCommentBlock = styled.div`
  margin: 0 0 0.75rem 0;

  @media (max-width: 480px) {
    margin-bottom: 0.625rem;
  }
`;

const SkeletonResponse = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.75rem;
  position: relative;

  @media (max-width: 480px) {
    padding: 0.625rem;
    margin-top: 0.625rem;
  }

  &::before {
    content: "";
    position: absolute;
    top: -6px;
    left: 1rem;
    width: 12px;
    height: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-bottom: none;
    border-right: none;
    transform: rotate(45deg);
  }
`;

const SkeletonResponseHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const SkeletonResponseIcon = styled(SkeletonBase)`
  width: 16px;
  height: 16px;
  border-radius: 3px;

  @media (max-width: 480px) {
    width: 14px;
    height: 14px;
  }
`;

const SkeletonReviewImage = styled(SkeletonBase)`
  width: 100%;
  max-width: 300px;
  height: 169px;
  border-radius: 8px;
  margin-top: 0.75rem;

  @media (max-width: 768px) {
    max-width: 250px;
    height: 141px;
  }

  @media (max-width: 480px) {
    max-width: 200px;
    height: 113px;
  }
`;

// Generate realistic review skeleton data
const generateReviewSkeletons = () => {
  const reviews = [];

  // Recent reviews (3)
  reviews.push(
    { hasSource: true, commentLines: 3, hasResponse: false, hasImage: false },
    { hasSource: false, commentLines: 5, hasResponse: true, hasImage: true },
    { hasSource: true, commentLines: 2, hasResponse: false, hasImage: false }
  );

  // This month reviews (3)
  reviews.push(
    { hasSource: false, commentLines: 4, hasResponse: false, hasImage: false },
    { hasSource: true, commentLines: 6, hasResponse: true, hasImage: false },
    { hasSource: false, commentLines: 3, hasResponse: false, hasImage: true }
  );

  // Last 3 months reviews (3)
  reviews.push(
    { hasSource: true, commentLines: 2, hasResponse: false, hasImage: false },
    { hasSource: false, commentLines: 5, hasResponse: true, hasImage: false },
    { hasSource: true, commentLines: 4, hasResponse: false, hasImage: true }
  );

  return reviews;
};

const organizeSkeletonReviewsIntoColumns = (reviews) => {
  const columns = [[], [], []];
  const categories = [
    { label: "This Week", count: 3 },
    { label: "This Month", count: 3 },
    { label: "Last 3 Months", count: 3 },
  ];

  let currentColumn = 0;
  let reviewIndex = 0;

  categories.forEach((category) => {
    columns[currentColumn].push({ type: "divider", label: category.label });

    for (let i = 0; i < category.count; i++) {
      columns[currentColumn].push({
        type: "review",
        data: reviews[reviewIndex],
      });
      currentColumn = (currentColumn + 1) % 3;
      reviewIndex++;
    }
  });

  return columns;
};

export const ReviewsTabSkeleton = () => {
  const reviews = generateReviewSkeletons();
  const columns = organizeSkeletonReviewsIntoColumns(reviews);

  return (
    <div>
      <ReviewsColumnContainer>
        {columns.map((column, columnIndex) => (
          <ReviewColumn key={columnIndex}>
            {column.map((item, itemIndex) => {
              if (item.type === "divider") {
                return (
                  <SkeletonTimeDivider
                    key={`divider-${columnIndex}-${itemIndex}`}
                  >
                    <SkeletonDividerIcon />
                    <SkeletonDividerText />
                  </SkeletonTimeDivider>
                );
              }

              const review = item.data;
              return (
                <SkeletonReviewCard key={`review-${columnIndex}-${itemIndex}`}>
                  {review.hasSource && <SkeletonSourceTag />}

                  <SkeletonReviewHeader>
                    <SkeletonReviewAvatar />
                    <SkeletonReviewInfo>
                      <SkeletonTextLine height="18px" width="60%" mb="8px" />
                      <SkeletonReviewStars />
                      <SkeletonTextLine
                        height="12px"
                        width="40%"
                        style={{ marginTop: "4px" }}
                      />
                    </SkeletonReviewInfo>
                  </SkeletonReviewHeader>

                  <SkeletonCommentBlock>
                    {[...Array(review.commentLines)].map((_, lineIndex) => (
                      <SkeletonTextLine
                        key={lineIndex}
                        height="14px"
                        width={
                          lineIndex === review.commentLines - 1
                            ? `${Math.random() * 40 + 40}%`
                            : `${Math.random() * 20 + 80}%`
                        }
                        mb="6px"
                      />
                    ))}
                  </SkeletonCommentBlock>

                  {review.hasResponse && (
                    <SkeletonResponse>
                      <SkeletonResponseHeader>
                        <SkeletonResponseIcon />
                        <SkeletonTextLine height="12px" width="120px" />
                      </SkeletonResponseHeader>
                      <SkeletonTextLine height="14px" width="100%" mb="6px" />
                      <SkeletonTextLine height="14px" width="85%" mb="6px" />
                      <SkeletonTextLine height="14px" width="60%" />
                    </SkeletonResponse>
                  )}
                </SkeletonReviewCard>
              );
            })}
          </ReviewColumn>
        ))}
      </ReviewsColumnContainer>
    </div>
  );
};

// Location Tab Skeleton
const LocationLayout = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`;

const SkeletonMapWrapper = styled(SkeletonBase)`
  height: 500px;
  border-radius: 12px;

  @media (max-width: 768px) {
    height: 350px;
  }
`;

const SkeletonInfoBox = styled.div`
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

export const LocationTabSkeleton = () => (
  <LocationLayout>
    <div>
      <SkeletonTextLine height="28px" width="300px" mb="24px" />
      <SkeletonInfoBox style={{ marginBottom: "24px", height: "80px" }}>
        <SkeletonTextLine height="12px" width="30%" mb="8px" />
        <SkeletonTextLine height="16px" width="70%" />
      </SkeletonInfoBox>
      <SkeletonMapWrapper />
    </div>

    <div>
      <SkeletonInfoBox>
        <SkeletonTextLine height="24px" width="60%" mb="16px" />
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ marginBottom: "12px" }}>
            <SkeletonTextLine height="16px" width="100%" />
          </div>
        ))}
      </SkeletonInfoBox>
    </div>
  </LocationLayout>
);

// Contact Tab Skeleton
const ContactLayout = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`;

const SkeletonContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 0;
  border-bottom: 1px solid #f0f0f0;
`;

const SkeletonContactIcon = styled(SkeletonBase)`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
`;

export const ContactTabSkeleton = () => (
  <ContactLayout>
    <SkeletonInfoBox>
      <SkeletonTextLine height="28px" width="200px" mb="8px" />
      <SkeletonTextLine height="16px" width="300px" mb="24px" />

      {[...Array(3)].map((_, i) => (
        <SkeletonContactItem key={i}>
          <SkeletonContactIcon />
          <div style={{ flex: 1 }}>
            <SkeletonTextLine height="12px" width="30%" mb="8px" />
            <SkeletonTextLine height="16px" width="60%" />
          </div>
        </SkeletonContactItem>
      ))}
    </SkeletonInfoBox>

    <div>
      <SkeletonInfoBox style={{ marginBottom: "24px" }}>
        <SkeletonTextLine height="24px" width="60%" mb="16px" />
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {[...Array(5)].map((_, i) => (
            <SkeletonBase
              key={i}
              style={{ width: "52px", height: "52px", borderRadius: "50%" }}
            />
          ))}
        </div>
      </SkeletonInfoBox>

      <SkeletonInfoBox>
        <SkeletonTextLine height="24px" width="60%" mb="16px" />
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ marginBottom: "12px" }}>
            <SkeletonTextLine height="16px" width="100%" />
          </div>
        ))}
      </SkeletonInfoBox>
    </div>
  </ContactLayout>
);