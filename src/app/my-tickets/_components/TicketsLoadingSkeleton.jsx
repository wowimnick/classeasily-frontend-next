// --- START OF FILE TicketsLoadingSkeleton.jsx ---

"use client";

import styled, { keyframes, ThemeProvider } from "styled-components";
import { theme as globalTheme } from "@/components/theme";
import ExploreHeader from "@/components/explore/ExploreHeader";
import FooterClient from "@/components/homepage/FooterClient";

const shimmer = keyframes`
  0% { background-position: -468px 0; }
  100% { background-position: 468px 0; }
`;

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const PageContainer = styled.div`
  flex-grow: 1;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 48px;

  @media (max-width: 768px) {
    padding: 20px 16px 40px;
  }
`;

const SkeletonBase = styled.div`
  background: #f0f0f0;
  background-image: linear-gradient(
    to right,
    #f0f0f0 0%,
    #e8e8e8 20%,
    #f0f0f0 40%,
    #f0f0f0 100%
  );
  background-repeat: no-repeat;
  background-size: 800px 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: ${(props) => props.$radius || "6px"};
  width: ${(props) => props.$width || "100%"};
  height: ${(props) => props.$height || "20px"};
  margin-bottom: ${(props) => props.$mb || "0"};
`;

// --- List Page Skeletons ---

const HeaderSkeleton = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
`;

const ListSkeleton = styled.div`
  border: 1px solid #ebebeb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
`;

const RowSkeleton = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  border-bottom: 1px solid #ebebeb;

  &:last-child {
    border-bottom: none;
  }
`;

const RowMain = styled.div`
  flex: 1;
  min-width: 0;
`;

export function TicketsListLoadingSkeleton() {
  return (
    <ThemeProvider theme={globalTheme}>
      <PageWrapper>
        <ExploreHeader showOptionsWrapper={false} />
        <PageContainer>
          <HeaderSkeleton>
            <div>
              <SkeletonBase $width="180px" $height="28px" $mb="6px" />
              <SkeletonBase $width="140px" $height="14px" />
            </div>
            <SkeletonBase $width="120px" $height="44px" $radius="8px" />
          </HeaderSkeleton>

          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <SkeletonBase $width="240px" $height="44px" $radius="8px" />
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4].map((i) => (
                <SkeletonBase
                  key={i}
                  $width="70px"
                  $height="36px"
                  $radius="24px"
                />
              ))}
            </div>
          </div>

          <ListSkeleton>
            {[1, 2, 3, 4, 5].map((i) => (
              <RowSkeleton key={i}>
                <RowMain>
                  <SkeletonBase $width="60%" $height="18px" $mb="8px" />
                  <div style={{ display: "flex", gap: 16 }}>
                    <SkeletonBase $width="80px" $height="14px" />
                    <SkeletonBase $width="70px" $height="14px" />
                  </div>
                </RowMain>
                <SkeletonBase $width="90px" $height="26px" $radius="6px" />
              </RowSkeleton>
            ))}
          </ListSkeleton>
        </PageContainer>
        <FooterClient />
      </PageWrapper>
    </ThemeProvider>
  );
}

// --- Detail Page Skeleton ---

const DetailPageContainer = styled.div`
  flex-grow: 1;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 48px;

  @media (max-width: 768px) {
    padding: 20px 16px 40px;
  }
`;

const TicketHeaderSkeleton = styled.div`
  margin-bottom: 24px;
`;

const ConversationSkeleton = styled.div`
  border: 1px solid #ebebeb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
  height: 600px;
`;

const ConversationHeaderSkeleton = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #ebebeb;
  flex-shrink: 0;
`;

const MessagesSkeleton = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: #fafafa;
  flex-grow: 1;
`;

const MessageRowSkeleton = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
`;

const BubbleSkeleton = styled.div`
  max-width: 60%;
  padding: 12px 16px;
  border-radius: 16px;
  background: ${(props) => (props.$isUser ? "#fce7f3" : "#fff")};
  border: ${(props) => (props.$isUser ? "none" : "1px solid #eee")};
  order: ${(props) => (props.$isUser ? "2" : "1")};
  
  /* Make the skeleton inside the bubble look like lines of text */
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ReplySkeleton = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #ebebeb;
  background: #fff;
`;

const InputCapsuleSkeleton = styled.div`
  height: 52px;
  border-radius: 26px;
  background: #f7f7f7;
  border: 1px solid #ebebeb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 0 20px;
`;

export function TicketDetailLoadingSkeleton() {
  return (
    <ThemeProvider theme={globalTheme}>
      <PageWrapper>
        <ExploreHeader showOptionsWrapper={false} />
        <DetailPageContainer>
          {/* Back Button */}
          <SkeletonBase
            $width="120px"
            $height="16px"
            $mb="24px"
            $radius="4px"
          />

          {/* Title Area */}
          <TicketHeaderSkeleton>
            <SkeletonBase $width="70%" $height="28px" $mb="16px" />
            
            {/* Meta Row */}
            <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
              <SkeletonBase $width="80px" $height="14px" />
              <SkeletonBase $width="120px" $height="14px" />
              <SkeletonBase $width="100px" $height="14px" />
            </div>

            {/* Tags (Pills) */}
            <div style={{ display: "flex", gap: 10 }}>
              <SkeletonBase $width="90px" $height="34px" $radius="10px" />
              <SkeletonBase $width="80px" $height="34px" $radius="10px" />
              <SkeletonBase $width="100px" $height="34px" $radius="10px" />
            </div>
          </TicketHeaderSkeleton>

          {/* Chat Interface */}
          <ConversationSkeleton>
            <ConversationHeaderSkeleton>
              <SkeletonBase $width="100px" $height="18px" />
            </ConversationHeaderSkeleton>

            <MessagesSkeleton>
              {/* Agent Message */}
              <MessageRowSkeleton $isUser={false}>
                <SkeletonBase $width="32px" $height="32px" $radius="50%" />
                <BubbleSkeleton $isUser={false} style={{ width: "240px" }}>
                  <SkeletonBase $height="14px" $width="90%" />
                  <SkeletonBase $height="14px" $width="60%" />
                </BubbleSkeleton>
              </MessageRowSkeleton>

              {/* User Message */}
              <MessageRowSkeleton $isUser={true}>
                <BubbleSkeleton $isUser={true} style={{ width: "180px" }}>
                  <SkeletonBase $height="14px" $width="100%" />
                  <SkeletonBase $height="14px" $width="80%" />
                </BubbleSkeleton>
                <SkeletonBase $width="32px" $height="32px" $radius="50%" />
              </MessageRowSkeleton>

              {/* Agent Message Long */}
              <MessageRowSkeleton $isUser={false}>
                <SkeletonBase $width="32px" $height="32px" $radius="50%" />
                <BubbleSkeleton $isUser={false} style={{ width: "300px" }}>
                  <SkeletonBase $height="14px" $width="100%" />
                  <SkeletonBase $height="14px" $width="95%" />
                  <SkeletonBase $height="14px" $width="40%" />
                </BubbleSkeleton>
              </MessageRowSkeleton>
            </MessagesSkeleton>

            <ReplySkeleton>
              <InputCapsuleSkeleton>
                <SkeletonBase $width="140px" $height="14px" />
                <SkeletonBase $width="36px" $height="36px" $radius="50%" />
              </InputCapsuleSkeleton>
            </ReplySkeleton>
          </ConversationSkeleton>
        </DetailPageContainer>
        <FooterClient />
      </PageWrapper>
    </ThemeProvider>
  );
}