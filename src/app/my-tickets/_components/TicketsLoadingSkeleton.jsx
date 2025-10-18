// app/my-tickets/_components/TicketsLoadingSkeleton.jsx
"use client";

import styled, { keyframes, ThemeProvider } from "styled-components";
import { theme as globalTheme } from "@/components/theme";
import ExploreHeader from "@/components/explore/ExploreHeader";
import dynamic from "next/dynamic";

const Footer = dynamic(() => import("@/components/homepage/Footer"), {
  ssr: false,
});

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const PageContainer = styled.div`
  flex-grow: 1;
  max-width: 1400px;
  min-height: 90vh;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px;

  @media (max-width: 768px) {
    padding: 24px 16px;
  }
`;

const PageHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const SkeletonElement = styled.div`
  background: linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%);
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite linear;
  border-radius: ${(props) => props.$radius || "8px"};
  height: ${(props) => props.$height || "20px"};
  width: ${(props) => props.$width || "100%"};
  margin-bottom: ${(props) => props.$mb || "0"};
`;

const TitleSkeleton = styled(SkeletonElement)`
  height: 38px;
  width: 300px;
  margin-bottom: 12px;

  @media (max-width: 768px) {
    width: 200px;
  }
`;

const SubtitleSkeleton = styled(SkeletonElement)`
  height: 20px;
  width: 400px;

  @media (max-width: 768px) {
    width: 280px;
  }
`;

const ButtonSkeleton = styled(SkeletonElement)`
  height: 44px;
  width: 180px;
  border-radius: 14px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ControlsSection = styled.div`
  background: ${(props) => props.theme.token.colorBgContainer};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-radius: 14px;
  padding: 24px;
  margin-bottom: 24px;
`;

const ControlsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

const FilterButtonSkeleton = styled(SkeletonElement)`
  height: 36px;
  width: 100px;
  border-radius: 14px;
`;

const SearchSkeleton = styled(SkeletonElement)`
  height: 40px;
  max-width: 400px;
  border-radius: 8px;
`;

const TicketList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TicketCardSkeleton = styled.div`
  background: ${(props) => props.theme.token.colorBgContainer};
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 24px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  margin-top: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const FooterInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 16px;
  }
`;

export function TicketsListLoadingSkeleton() {
  return (
    <ThemeProvider theme={globalTheme}>
      <PageWrapper>
        <ExploreHeader showOptionsWrapper={false} />
        <PageContainer>
          <PageHeader>
            <HeaderContent>
              <TitleSkeleton />
              <SubtitleSkeleton />
            </HeaderContent>
            <ButtonSkeleton />
          </PageHeader>

          <ControlsSection>
            <ControlsHeader>
              <SkeletonElement $height="16px" $width="140px" $mb="0" />
            </ControlsHeader>
            <FilterGroup>
              <FilterButtonSkeleton />
              <FilterButtonSkeleton />
              <FilterButtonSkeleton />
              <FilterButtonSkeleton />
            </FilterGroup>
            <SearchSkeleton />
          </ControlsSection>

          <TicketList>
            {[1, 2, 3, 4, 5].map((i) => (
              <TicketCardSkeleton key={i}>
                <SkeletonElement $height="12px" $width="120px" $mb="8px" />
                <CardHeader>
                  <SkeletonElement $height="22px" $width="70%" $mb="0" />
                  <SkeletonElement
                    $height="28px"
                    $width="100px"
                    $mb="0"
                    $radius="6px"
                  />
                </CardHeader>
                <SkeletonElement $height="16px" $width="100%" $mb="8px" />
                <SkeletonElement $height="16px" $width="85%" $mb="0" />
                <CardFooter>
                  <FooterInfo>
                    <SkeletonElement $height="14px" $width="120px" $mb="0" />
                    <SkeletonElement $height="14px" $width="150px" $mb="0" />
                  </FooterInfo>
                  <SkeletonElement $height="14px" $width="100px" $mb="0" />
                </CardFooter>
              </TicketCardSkeleton>
            ))}
          </TicketList>
        </PageContainer>
        <Footer />
      </PageWrapper>
    </ThemeProvider>
  );
}

// Detail page skeleton
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

const BackButtonSkeleton = styled(SkeletonElement)`
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

const AvatarSkeleton = styled(SkeletonElement)`
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
                <SkeletonElement $height="28px" $width="80%" $mb="16px" />
                <MetaSection>
                  <SkeletonElement $height="14px" $width="140px" $mb="0" />
                  <SkeletonElement $height="14px" $width="180px" $mb="0" />
                  <SkeletonElement $height="14px" $width="160px" $mb="0" />
                </MetaSection>
              </TicketHeader>
            </div>

            <ConversationCard>
              <ConversationHeader>
                <SkeletonElement $height="20px" $width="180px" $mb="0" />
              </ConversationHeader>
              <MessagesContainer>
                {[1, 2, 3, 4].map((i) => (
                  <MessageSkeleton key={i} $isUser={i % 2 === 0}>
                    <AvatarSkeleton $isUser={i % 2 === 0} />
                    <MessageBubbleSkeleton $isUser={i % 2 === 0}>
                      <SkeletonElement $height="12px" $width="60px" $mb="4px" />
                      <SkeletonElement $height="16px" $width="100%" $mb="4px" />
                      <SkeletonElement $height="16px" $width="90%" $mb="4px" />
                      <SkeletonElement $height="11px" $width="80px" $mb="0" />
                    </MessageBubbleSkeleton>
                  </MessageSkeleton>
                ))}
              </MessagesContainer>
              <ReplyInputArea>
                <SkeletonElement $height="44px" $width="100%" $radius="8px" />
                <SkeletonElement $height="44px" $width="44px" $radius="8px" />
              </ReplyInputArea>
            </ConversationCard>
          </MainContent>

          <Sidebar>
            <InfoCard>
              <InfoCardHeader>
                <SkeletonElement $height="18px" $width="120px" $mb="0" />
              </InfoCardHeader>
              <InfoItem>
                <SkeletonElement $height="14px" $width="60px" $mb="0" />
                <SkeletonElement $height="24px" $width="80px" $mb="0" />
              </InfoItem>
              <InfoItem>
                <SkeletonElement $height="14px" $width="60px" $mb="0" />
                <SkeletonElement $height="24px" $width="70px" $mb="0" />
              </InfoItem>
              <InfoItem>
                <SkeletonElement $height="14px" $width="70px" $mb="0" />
                <SkeletonElement $height="24px" $width="100px" $mb="0" />
              </InfoItem>
            </InfoCard>

            <AgentCard>
              <SkeletonElement
                $height="40px"
                $width="40px"
                $radius="50%"
                $mb="0"
              />
              <div style={{ flex: 1 }}>
                <SkeletonElement $height="14px" $width="120px" $mb="8px" />
                <SkeletonElement $height="12px" $width="90px" $mb="0" />
              </div>
            </AgentCard>
          </Sidebar>
        </DetailPageContainer>
        <Footer />
      </PageWrapper>
    </ThemeProvider>
  );
}
