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
  max-width: 1200px;
  min-height: 90vh;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px 64px;

  @media (max-width: 768px) {
    padding: 24px 16px 48px;
  }
`;

const SkeletonBase = styled.div`
  background: #f6f7f8;
  background-image: linear-gradient(
    to right,
    #f6f7f8 0%,
    #edeef1 20%,
    #f6f7f8 40%,
    #f6f7f8 100%
  );
  background-repeat: no-repeat;
  background-size: 800px 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: ${(props) => props.$radius || "6px"};
  width: ${(props) => props.$width || "100%"};
  height: ${(props) => props.$height || "20px"};
  margin-bottom: ${(props) => props.$mb || "0"};
`;

const HeaderSkeleton = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
`;

const ControlsSkeleton = styled.div`
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const GridSkeleton = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const CardSkeleton = styled.div`
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 0;
  height: 180px;
  display: flex;
  flex-direction: column;
`;

const CardSkeletonHeader = styled.div`
  padding: 16px 16px 12px;
  display: flex;
  justify-content: space-between;
`;

const CardSkeletonBody = styled.div`
  padding: 0 16px;
  flex: 1;
`;

const CardSkeletonFooter = styled.div`
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
`;

export function TicketsListLoadingSkeleton() {
  return (
    <ThemeProvider theme={globalTheme}>
      <PageWrapper>
        <ExploreHeader showOptionsWrapper={false} />
        <PageContainer>
          {/* Header */}
          <HeaderSkeleton>
            <div>
              <SkeletonBase $width="200px" $height="32px" $mb="8px" />
              <SkeletonBase $width="300px" $height="16px" />
            </div>
            <SkeletonBase $width="120px" $height="40px" $radius="10px" />
          </HeaderSkeleton>

          {/* Controls */}
          <ControlsSkeleton>
            <SkeletonBase $width="100%" $height="40px" $radius="10px" />
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4].map((i) => (
                <SkeletonBase
                  key={i}
                  $width="80px"
                  $height="32px"
                  $radius="20px"
                />
              ))}
            </div>
          </ControlsSkeleton>

          {/* Grid */}
          <GridSkeleton>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i}>
                <CardSkeletonHeader>
                  <SkeletonBase $width="60px" $height="20px" />
                  <SkeletonBase $width="80px" $height="20px" $radius="12px" />
                </CardSkeletonHeader>
                <CardSkeletonBody>
                  <SkeletonBase $width="90%" $height="20px" $mb="8px" />
                  <SkeletonBase $width="60%" $height="14px" $mb="6px" />
                  <SkeletonBase $width="40%" $height="14px" />
                </CardSkeletonBody>
                <CardSkeletonFooter>
                  <SkeletonBase $width="80px" $height="16px" />
                  <SkeletonBase $width="20px" $height="16px" />
                </CardSkeletonFooter>
              </CardSkeleton>
            ))}
          </GridSkeleton>
        </PageContainer>
        <FooterClient />
      </PageWrapper>
    </ThemeProvider>
  );
}

// --- Detail Page Skeleton Components ---

const DetailPageContainer = styled.div`
  flex-grow: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 32px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    max-width: 900px;
    padding: 24px 20px;
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 1200px) {
    order: -1;
  }
`;

const BackButtonSkeleton = styled(SkeletonBase)`
  height: 16px;
  width: 140px;
  margin-bottom: 16px;
`;

const TicketHeader = styled.div`
  background: ${(props) => props.theme.token.colorBgContainer};
  border-radius: 12px;
  padding: 24px 0;
`;

const MetaSection = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  padding-top: 16px;
  border-top: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  margin-top: 16px;
`;

const ConversationCard = styled.div`
  border-radius: 12px;
  border: 1px solid ${(props) => props.theme.token.colorBorder};
  background: ${(props) => props.theme.token.colorBgContainer};
  overflow: hidden;
`;

const ConversationHeader = styled.div`
  border-bottom: 1px solid ${(props) => props.theme.token.colorBorder};
  padding: 16px 24px;
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 65vh;
  max-height: 600px;
  padding: 24px;
  background: ${(props) => props.theme.token.colorBgLayout};
`;

const MessageSkeleton = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
`;

const MessageBubbleSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 75%;
  order: ${(props) => (props.$isUser ? "2" : "1")};
`;

const AvatarSkeleton = styled(SkeletonBase)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  order: ${(props) => (props.$isUser ? "3" : "0")};
`;

const ReplyInputArea = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid ${(props) => props.theme.token.colorBorder};
  align-items: center;
  background: ${(props) => props.theme.token.colorBgContainer};
`;

const InfoCard = styled.div`
  border-radius: 12px;
  background-color: ${(props) => props.theme.token.colorBgContainer};
  border: 1px solid ${(props) => props.theme.token.colorBorder};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 20px;
`;

const InfoCardHeader = styled.div`
  padding-bottom: 16px;
  border-bottom: 1px solid ${(props) => props.theme.token.colorBorder};
  margin-bottom: 20px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid ${(props) => props.theme.token.colorBorderSecondary};

  &:last-child {
    border-bottom: none;
  }
`;

const AgentCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: ${(props) => props.theme.token.colorBgContainer};
  border: 1px solid ${(props) => props.theme.token.colorBorder};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
`;

export function TicketDetailLoadingSkeleton() {
  return (
    <ThemeProvider theme={globalTheme}>
      <PageWrapper>
        <ExploreHeader showOptionsWrapper={false} />
        <DetailPageContainer>
          <MainContent>
            <div>
              <BackButtonSkeleton />
              <TicketHeader>
                <SkeletonBase $height="28px" $width="80%" $mb="16px" />
                <MetaSection>
                  <SkeletonBase $height="14px" $width="140px" $mb="0" />
                  <SkeletonBase $height="14px" $width="180px" $mb="0" />
                  <SkeletonBase $height="14px" $width="160px" $mb="0" />
                </MetaSection>
              </TicketHeader>
            </div>

            <ConversationCard>
              <ConversationHeader>
                <SkeletonBase $height="20px" $width="180px" $mb="0" />
              </ConversationHeader>
              <MessagesContainer>
                {[1, 2, 3, 4].map((i) => (
                  <MessageSkeleton key={i} $isUser={i % 2 === 0}>
                    <AvatarSkeleton $isUser={i % 2 === 0} />
                    <MessageBubbleSkeleton $isUser={i % 2 === 0}>
                      <SkeletonBase $height="12px" $width="60px" $mb="4px" />
                      <SkeletonBase $height="16px" $width="100%" $mb="4px" />
                      <SkeletonBase $height="16px" $width="90%" $mb="4px" />
                      <SkeletonBase $height="11px" $width="80px" $mb="0" />
                    </MessageBubbleSkeleton>
                  </MessageSkeleton>
                ))}
              </MessagesContainer>
              <ReplyInputArea>
                <SkeletonBase $height="44px" $width="100%" $radius="8px" />
                <SkeletonBase $height="44px" $width="44px" $radius="8px" />
              </ReplyInputArea>
            </ConversationCard>
          </MainContent>

          <Sidebar>
            <InfoCard>
              <InfoCardHeader>
                <SkeletonBase $height="18px" $width="120px" $mb="0" />
              </InfoCardHeader>
              <InfoItem>
                <SkeletonBase $height="14px" $width="60px" $mb="0" />
                <SkeletonBase $height="24px" $width="80px" $mb="0" />
              </InfoItem>
              <InfoItem>
                <SkeletonBase $height="14px" $width="60px" $mb="0" />
                <SkeletonBase $height="24px" $width="70px" $mb="0" />
              </InfoItem>
              <InfoItem>
                <SkeletonBase $height="14px" $width="70px" $mb="0" />
                <SkeletonBase $height="24px" $width="100px" $mb="0" />
              </InfoItem>
            </InfoCard>

            <AgentCard>
              <SkeletonBase
                $height="40px"
                $width="40px"
                $radius="50%"
                $mb="0"
              />
              <div style={{ flex: 1 }}>
                <SkeletonBase $height="14px" $width="120px" $mb="8px" />
                <SkeletonBase $height="12px" $width="90px" $mb="0" />
              </div>
            </AgentCard>
          </Sidebar>
        </DetailPageContainer>
        <FooterClient />
      </PageWrapper>
    </ThemeProvider>
  );
}