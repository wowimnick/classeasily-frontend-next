// app/explore/[...slug]/loading.jsx
"use client";
import ExplorePageSkeleton from "@/app/explore/_components/ExplorePageSkeleton";
import ExploreHeader from "@/components/explore/ExploreHeader";
import Breadcrumbs from "@/services/Breadcrumbs";
import styled from "styled-components";

const PageLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: #fff;
`;

const BreadcrumbContainer = styled.div`
  padding: 0 2.5rem;
  border-bottom: 1px solid #f0f0f0;

  @media (max-width: 1048px) {
    padding: 0 1rem;
  }
`;

const ContentArea = styled.main`
  flex-grow: 1;
  overflow: hidden;
  position: relative;
`;

export default function Loading() {
  return (
    <PageLayout>
      <ExploreHeader showOptionsWrapper={true} />
      <BreadcrumbContainer>
        <Breadcrumbs />
      </BreadcrumbContainer>
      <ContentArea>
        <ExplorePageSkeleton />
      </ContentArea>
    </PageLayout>
  );
}
