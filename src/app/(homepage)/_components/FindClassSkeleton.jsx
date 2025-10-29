// Enhanced Skeleton Components that match HomeClassCard structure - 2 ROW VERSION
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

const SkeletonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 0 14rem;
  margin: 4rem auto 2rem auto;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 1425px) {
    padding: 0 3rem;
  }
  @media (max-width: 768px) {
    padding: 0 1.5rem;
    gap: 1rem;
    margin: 3rem auto;
  }
  @media (max-width: 616px) {
    padding: 0 1rem;
  }
`;

const SkeletonHeader = styled.div`
  width: 100%;
  margin-bottom: 1rem;
`;

const SkeletonTitle = styled.div`
  height: 36px;
  width: 320px;
  background: linear-gradient(to right, #f0f0f0 8%, #f8f8f8 18%, #f0f0f0 33%);
  background-size: 800px 100px;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    width: 250px;
    height: 30px;
  }
`;

const SkeletonSubtitle = styled.div`
  height: 20px;
  width: 450px;
  background: linear-gradient(to right, #f0f0f0 8%, #f8f8f8 18%, #f0f0f0 33%);
  background-size: 800px 100px;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
  margin-left: 2px;

  @media (max-width: 768px) {
    width: 80%;
  }
`;

const RowContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const SkeletonCarouselContainer = styled.div`
  display: flex;
  gap: 24px;
  padding: 1rem 0.5rem;
  width: 100%;
  overflow: hidden;
`;

// Updated card to match HomeClassCard layout
const SkeletonCard = styled.div`
  display: flex;
  flex-direction: column;
  height: min-content;
  flex-shrink: 0;
  width: 250px;
  max-width: 250px;
  border-radius: 12px;
  border: 2px solid transparent;
  padding: 2px;
  background: #ffffff;

  @media (max-width: 768px) {
    width: 240px;
  }
  @media (max-width: 480px) {
    width: 230px;
  }
`;

const SkeletonImageContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 6px;
`;

const SkeletonImage = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, #e8e8e8 8%, #f4f4f4 18%, #e8e8e8 33%);
  background-size: 800px 100px;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 10px;
`;

const SkeletonContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const SkeletonTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 1px;
`;

const SkeletonCardTitle = styled.div`
  height: 18px;
  width: 70%;
  background: linear-gradient(to right, #f0f0f0 8%, #f8f8f8 18%, #f0f0f0 33%);
  background-size: 800px 100px;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
  flex: 1;
`;

const SkeletonRating = styled.div`
  height: 16px;
  width: 45px;
  background: linear-gradient(to right, #f0f0f0 8%, #f8f8f8 18%, #f0f0f0 33%);
  background-size: 800px 100px;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
  flex-shrink: 0;
`;

const SkeletonText = styled.div`
  height: 16px;
  width: ${(props) => props.width || "60%"};
  background: linear-gradient(to right, #f0f0f0 8%, #f8f8f8 18%, #f0f0f0 33%);
  background-size: 800px 100px;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
  margin: 2px 0;
`;

const SkeletonPriceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
`;

const SkeletonPrice = styled.div`
  height: 16px;
  width: 65px;
  background: linear-gradient(to right, #f0f0f0 8%, #f8f8f8 18%, #f0f0f0 33%);
  background-size: 800px 100px;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
`;

const SkeletonLink = styled.div`
  height: 20px;
  width: 180px;
  background: linear-gradient(to right, #f0f0f0 8%, #f8f8f8 18%, #f0f0f0 33%);
  background-size: 800px 100px;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
  margin-top: 1rem;
`;

// Main Skeleton Component for FindClass with 2 rows
export function FindClassSkeleton() {
  const renderSkeletonCards = (count) => {
    return [...Array(count)].map((_, item) => (
      <SkeletonCard key={item}>
        <SkeletonImageContainer>
          <SkeletonImage />
        </SkeletonImageContainer>
        <SkeletonContent>
          <SkeletonTopRow>
            <SkeletonCardTitle />
            <SkeletonRating />
          </SkeletonTopRow>
          <SkeletonText width="60%" />
          <SkeletonText width="50%" />
          <SkeletonPriceRow>
            <SkeletonPrice />
          </SkeletonPriceRow>
        </SkeletonContent>
      </SkeletonCard>
    ));
  };

  return (
    <SkeletonWrapper>
      <SkeletonHeader>
        <SkeletonTitle />
        <SkeletonSubtitle />
      </SkeletonHeader>

      <RowContainer>
        {/* First Row */}
        <SkeletonCarouselContainer>
          {renderSkeletonCards(4)}
        </SkeletonCarouselContainer>

        {/* Second Row */}
        <SkeletonCarouselContainer>
          {renderSkeletonCards(4)}
        </SkeletonCarouselContainer>
      </RowContainer>

      <SkeletonLink />
    </SkeletonWrapper>
  );
}

// Legacy skeleton for backward compatibility
export function CategorySkeleton() {
  return (
    <div className="category-skeleton-container">
      {[...Array(6)].map((_, i) => (
        <div className="skeleton-category-card" key={i}>
          <div className="skeleton-circle" />
          <div className="skeleton-line" />
        </div>
      ))}
    </div>
  );
}
