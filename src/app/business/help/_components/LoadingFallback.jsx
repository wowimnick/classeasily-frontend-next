// --- START OF FILE /src/app/business/help/_components/LoadingFallback.jsx ---

"use client";

import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const LoadingWrapper = styled.div`
  background: #fafbfc;
  min-height: 90vh;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  gap: 2.5rem;

  @media (max-width: 992px) {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem 1rem;
  }
`;

const Sidebar = styled.aside`
  flex: 0 0 260px;
  background: #ffffff;
  border: 1px solid #e3e8ee;
  border-radius: 6px;
  align-self: flex-start;
  padding: 0.5rem 0;

  @media (max-width: 992px) {
    flex-basis: auto;
    width: 100%;
  }
`;

const MainContent = styled.main`
  flex: 1;
  min-width: 0;
`;

const SkeletonBase = styled.div`
  background: linear-gradient(90deg, #f0f4f8 0%, #e3e8ee 50%, #f0f4f8 100%);
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite linear;
  border-radius: 4px;
`;

const SidebarItem = styled(SkeletonBase)`
  height: 40px;
  margin: 0.25rem 1rem;
  border-radius: 6px;
`;

const SearchSkeleton = styled(SkeletonBase)`
  height: 40px;
  border-radius: 6px;
  margin-bottom: 2rem;
`;

const BreadcrumbSkeleton = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  align-items: center;
`;

const BreadcrumbItem = styled(SkeletonBase)`
  height: 14px;
  width: ${(props) => props.width || "80px"};
`;

const BreadcrumbDivider = styled(SkeletonBase)`
  height: 14px;
  width: 14px;
`;

const ContentCard = styled.div`
  background: #ffffff;
  border: 1px solid #e3e8ee;
  border-radius: 6px;
  padding: 2.5rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const TitleSkeleton = styled(SkeletonBase)`
  height: 32px;
  width: 60%;
  margin-bottom: 1.5rem;
  border-radius: 6px;
`;

const LineSkeleton = styled(SkeletonBase)`
  height: 16px;
  width: ${(props) => props.width || "100%"};
  margin-bottom: ${(props) => props.marginBottom || "1rem"};
  border-radius: 4px;
`;

const ParagraphSkeleton = styled.div`
  margin-bottom: 1.5rem;
`;

const SubheadingSkeleton = styled(SkeletonBase)`
  height: 20px;
  width: 40%;
  margin: 2rem 0 1rem;
  border-radius: 6px;
`;

export default function LoadingFallback() {
  return (
    <LoadingWrapper>
      <Container>
        {/* Sidebar Skeleton */}
        <Sidebar>
          {[...Array(7)].map((_, i) => (
            <SidebarItem key={i} />
          ))}
        </Sidebar>

        {/* Main Content Skeleton */}
        <MainContent>
          {/* Search Bar Skeleton */}
          <SearchSkeleton />

          {/* Breadcrumbs Skeleton */}
          <BreadcrumbSkeleton>
            <BreadcrumbItem width="70px" />
            <BreadcrumbDivider />
            <BreadcrumbItem width="120px" />
          </BreadcrumbSkeleton>

          {/* Content Card Skeleton */}
          <ContentCard>
            <TitleSkeleton />

            <ParagraphSkeleton>
              <LineSkeleton width="100%" />
              <LineSkeleton width="95%" />
              <LineSkeleton width="88%" marginBottom="0" />
            </ParagraphSkeleton>

            <SubheadingSkeleton />

            <ParagraphSkeleton>
              <LineSkeleton width="98%" />
              <LineSkeleton width="100%" />
              <LineSkeleton width="92%" />
              <LineSkeleton width="85%" marginBottom="0" />
            </ParagraphSkeleton>

            <SubheadingSkeleton />

            <ParagraphSkeleton>
              <LineSkeleton width="100%" />
              <LineSkeleton width="97%" />
              <LineSkeleton width="90%" marginBottom="0" />
            </ParagraphSkeleton>
          </ContentCard>
        </MainContent>
      </Container>
    </LoadingWrapper>
  );
}
