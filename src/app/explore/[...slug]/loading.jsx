"use client";
import ExplorePageSkeleton, { ExploreHeaderSkeleton } from "@/app/explore/_components/ExplorePageSkeleton";
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
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const ContentArea = styled.main`
  flex-grow: 1;
  overflow: hidden;
  position: relative;
`;

export default function Loading() {
  return (
    <PageLayout>
      <ExploreHeaderSkeleton />
      <BreadcrumbContainer>
        <Breadcrumbs />
      </BreadcrumbContainer>
      <ContentArea>
        <ExplorePageSkeleton />
      </ContentArea>
    </PageLayout>
  );
}