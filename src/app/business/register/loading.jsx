"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";

// Dynamically import components with no SSR
const GlobalLoaderWithoutInlineStyles = dynamic(
  () =>
    import("@/components/common/GlobalLoader").then(
      (mod) => mod.GlobalLoaderWithoutInlineStyles
    ),
  { ssr: false }
);

const ExploreHeader = dynamic(
  () => import("@/components/explore/ExploreHeader"),
  { ssr: false }
);

const OverallContainer = styled.div`
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: ${(props) => props.theme.token.colorBgLayout};
  font-family: ${(props) => props.theme.token.fontFamily};
`;

const HeaderFallback = styled.div`
  height: 80px;
  border-bottom: 1px solid #f1f1f1;
  background: #fff;
`;

const LoaderFallback = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default function Loading() {
  return (
    <OverallContainer>
      <Suspense fallback={<HeaderFallback />}>
        <ExploreHeader showOptionsWrapper={false} />
      </Suspense>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Suspense fallback={<LoaderFallback>Loading...</LoaderFallback>}>
          <GlobalLoaderWithoutInlineStyles />
        </Suspense>
      </div>
    </OverallContainer>
  );
}
