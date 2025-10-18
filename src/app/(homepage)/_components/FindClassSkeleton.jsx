// Enhanced Skeleton Components that match real card structure
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

const SkeletonCarouselContainer = styled.div`
  display: flex;
  gap: 24px;
  padding: 1rem 0.5rem;
  width: 100%;
  overflow: hidden;
`;

const SkeletonCard = styled.div`
  display: flex;
  flex-direction: column;
  height: min-content;
  flex-shrink: 0;
  padding: 12px;
  border: 1px solid #efefef;
  border-radius: 12px;
  background: #ffffff;
  width: 320px;

  @media (max-width: 768px) {
    width: 290px;
  }
  @media (max-width: 480px) {
    width: 270px;
  }
`;

const SkeletonImage = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 12px;
  margin-bottom: 10px;
  background: linear-gradient(to right, #e8e8e8 8%, #f4f4f4 18%, #e8e8e8 33%);
  background-size: 800px 100px;
  animation: ${shimmer} 1.5s infinite linear;
`;

const SkeletonContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-grow: 1;
`;

const SkeletonCardTitle = styled.div`
  height: 22px;
  width: 85%;
  background: linear-gradient(to right, #f0f0f0 8%, #f8f8f8 18%, #f0f0f0 33%);
  background-size: 800px 100px;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
`;

const SkeletonCardTitleSecond = styled.div`
  height: 22px;
  width: 65%;
  background: linear-gradient(to right, #f0f0f0 8%, #f8f8f8 18%, #f0f0f0 33%);
  background-size: 800px 100px;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
`;

const SkeletonText = styled.div`
  height: 16px;
  width: ${(props) => props.width || "60%"};
  background: linear-gradient(to right, #f0f0f0 8%, #f8f8f8 18%, #f0f0f0 33%);
  background-size: 800px 100px;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
`;

const SkeletonPriceContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;
`;

const SkeletonPriceBox = styled.div`
  height: 42px;
  width: 80px;
  background: linear-gradient(to right, #f0f0f0 8%, #f8f8f8 18%, #f0f0f0 33%);
  background-size: 800px 100px;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 8px;
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

// Main Skeleton Component for FindClass
export function FindClassSkeleton() {
  return (
    <SkeletonWrapper>
      <SkeletonHeader>
        <SkeletonTitle />
        <SkeletonSubtitle />
      </SkeletonHeader>

      <SkeletonCarouselContainer>
        {[1, 2, 3, 4].map((item) => (
          <SkeletonCard key={item}>
            <SkeletonImage />
            <SkeletonContent>
              <SkeletonCardTitle />
              <SkeletonCardTitleSecond />
              <SkeletonText width="70%" />
              <SkeletonText width="55%" />
              <SkeletonPriceContainer>
                <SkeletonPriceBox />
                <SkeletonPriceBox />
              </SkeletonPriceContainer>
            </SkeletonContent>
          </SkeletonCard>
        ))}
      </SkeletonCarouselContainer>

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
