"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Typography, Button } from "antd";
import message from "@/lib/message";
import { ArrowRight, CheckCircle, Layout, Users } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuthUser } from "@/hooks/useAuthUser";
import { refreshUser } from "@/lib/auth-client";
import ExploreHeader from "@/components/explore/ExploreHeader";
import FooterClient from "@/components/homepage/FooterClient";
import { LordIcon } from "@/services/ReactUtils";

const { Title, Text } = Typography;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: white;
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  width: 100%;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const SuccessContainer = styled.div`
  max-width: 900px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const IconWrapper = styled(motion.div)`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f0fdf4;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
`;

const HeadingSection = styled.div`
  margin-bottom: 3rem;
`;

const StyledTitle = styled(Title)`
  &.ant-typography {
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 1rem;
    line-height: 1.2;
  }
`;

const SubtitleText = styled(Text)`
  font-size: 1.125rem;
  color: #666;
  line-height: 1.6;
  display: block;
  max-width: 600px;
  margin: 0 auto 0.75rem;
`;

const ApprovalNote = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef3f2;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  color: #dc2626;
  margin-top: 1rem;
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  width: 100%;
  max-width: 800px;
  margin-bottom: 2.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ActionCard = styled(motion.div)`
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: #ff385c;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
`;

const CardIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: ${(props) => props.bg || "#f8f9fa"};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
`;

const CardTitle = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
`;

const CardDescription = styled.div`
  font-size: 0.9375rem;
  color: #666;
  line-height: 1.5;
  margin-bottom: 1.5rem;
`;

const PrimaryButton = styled(Button)`
  height: 52px;
  padding: 0 2rem;
  border-radius: 26px;
  font-weight: 600;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: #ff385c;
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 56, 92, 0.2);
  transition: all 0.25s ease;

  &:hover {
    background: #e31c5f !important;
    color: white !important;
    box-shadow: 0 6px 16px rgba(255, 56, 92, 0.3);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SecondaryButton = styled(Button)`
  height: 52px;
  padding: 0 2rem;
  border-radius: 26px;
  font-weight: 600;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: white;
  border: 2px solid #e5e7eb;
  color: #1a1a1a;
  transition: all 0.25s ease;

  &:hover {
    background: #f9fafb !important;
    color: #1a1a1a !important;
    border-color: #d1d5db !important;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const FeaturesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 600px;
  margin-top: 2rem;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  text-align: left;
  padding: 1rem;
  background: #fafafa;
  border-radius: 12px;
`;

const FeatureIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const FeatureContent = styled.div`
  flex: 1;
`;

const FeatureTitle = styled.div`
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.25rem;
`;

const FeatureDescription = styled.div`
  font-size: 0.875rem;
  color: #666;
  line-height: 1.5;
`;

// --- Animation Variants ---

const iconVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
};

// --- Component ---

const SuccessPage = ({ navigate }) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const { user: currentUser } = useAuthUser();

  useEffect(() => {
    // Trigger confetti on mount
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#22c55e", "#10b981", "#86efac"],
    });
  }, []);

  const handleNavigateToDashboard = async () => {
    if (isNavigating) return; // Prevent double-clicks

    setIsNavigating(true);
    try {
      console.log("[SuccessPage] Refreshing user session before navigation");

      // Refresh the user session to get updated data
      await refreshUser();

      console.log("[SuccessPage] Session refreshed, navigating to dashboard");
      router.push("/business/dashboard");
    } catch (error) {
      console.error("[SuccessPage] Failed to refresh user session:", error);

      // Even if refresh fails, try to navigate anyway
      // The dashboard will handle auth validation
      console.log("[SuccessPage] Attempting navigation despite refresh error");
      router.push("/business/dashboard");
    } finally {
      // Reset loading state after a delay to prevent rapid re-clicks
      setTimeout(() => setIsNavigating(false), 1000);
    }
  };

  const handleExploreClasses = () => {
    if (isNavigating) return; // Prevent navigation during other operations
    router.push("/explore");
  };

  return (
    <Container>
      <ExploreHeader showOptionsWrapper={false} />

      <ContentContainer>
        <SuccessContainer>
          <IconWrapper variants={iconVariants}>
            <LordIcon
              src="https://cdn.lordicon.com/uvofdfal.json"
              trigger="in"
              delay="1500"
              state="in-reveal"
              colors="primary:#16c72e"
              style={{ width: 50, height: 50 }}
            />
          </IconWrapper>

          <HeadingSection>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <StyledTitle level={1} style={{ fontSize: "2.5rem" }}>
                Registration Submitted Successfully!
              </StyledTitle>

              <SubtitleText>
                Welcome to ClassEasily Business! Your registration is being
                reviewed by our team.
              </SubtitleText>

              <SubtitleText>
                You can start adding your classes right away, they'll
                automatically go live once your business is approved.
              </SubtitleText>

              <ApprovalNote>⏱️ Approval typically within 24 hours</ApprovalNote>
            </motion.div>
          </HeadingSection>

          <ActionsGrid>
            <ActionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onClick={handleNavigateToDashboard}
            >
              <CardIcon bg="#fef2f2">
                <Layout size={28} color="#ff385c" strokeWidth={2} />
              </CardIcon>
              <CardTitle>Go to Dashboard</CardTitle>
              <CardDescription>
                Set up your business profile and start adding classes to your
                catalog
              </CardDescription>
            </ActionCard>

            <ActionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              onClick={handleExploreClasses}
            >
              <CardIcon bg="#f0f9ff">
                <Users size={28} color="#3b82f6" strokeWidth={2} />
              </CardIcon>
              <CardTitle>Explore Platform</CardTitle>
              <CardDescription>
                Browse other classes and see how the ClassEasily community works
              </CardDescription>
            </ActionCard>
          </ActionsGrid>

          <ButtonGroup>
            <PrimaryButton
              onClick={handleNavigateToDashboard}
              loading={isNavigating}
              disabled={isNavigating}
            >
              Start Adding Classes
              {!isNavigating && <ArrowRight size={20} strokeWidth={2.5} />}
            </PrimaryButton>
          </ButtonGroup>

          <FeaturesList>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <FeatureItem
                style={{
                  borderBottomRightRadius: 0,
                  borderBottomLeftRadius: 0,
                }}
              >
                <FeatureContent>
                  <FeatureTitle>List Your Classes Now</FeatureTitle>
                  <FeatureDescription>
                    Create and schedule classes while waiting for approval,
                    they'll be published automatically once you're verified
                  </FeatureDescription>
                </FeatureContent>
              </FeatureItem>

              <FeatureItem
                style={{
                  borderRadius: 0,
                }}
              >
                <FeatureIcon>
                  <Layout size={20} color="#ff385c" />
                </FeatureIcon>
                <FeatureContent>
                  <FeatureTitle>Complete Your Profile</FeatureTitle>
                  <FeatureDescription>
                    Add photos, descriptions, and details about your business to
                    make a great first impression
                  </FeatureDescription>
                </FeatureContent>
              </FeatureItem>

              <FeatureItem
                style={{
                  borderTopRightRadius: 0,
                  borderTopLeftRadius: 0,
                }}
              >
                <FeatureIcon>
                  <Users size={20} color="#ff385c" />
                </FeatureIcon>
                <FeatureContent>
                  <FeatureTitle>Join the Community</FeatureTitle>
                  <FeatureDescription>
                    Explore how other businesses use ClassEasily and get
                    inspired for your own offerings
                  </FeatureDescription>
                </FeatureContent>
              </FeatureItem>
            </motion.div>
          </FeaturesList>
        </SuccessContainer>
      </ContentContainer>

      <FooterClient />
    </Container>
  );
};

export default SuccessPage;
