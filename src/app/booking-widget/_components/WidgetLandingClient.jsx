"use client";

import React, { useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Palette,
  Layout,
  Shield,
  Code,
  Smartphone,
  Calendar,
  ArrowRight,
  Check,
  Zap,
  Globe,
  BarChart3,
  Lock,
} from "lucide-react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useAuthStore, getRedirectPath, clearRedirectPath } from "@/lib/auth-client";
import { saveRedirectPath } from "@/lib/auth-client";

const Section = styled.section`
  padding: 4rem 1.5rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const HeroSection = styled(Section)`
  padding-top: 5rem;
  padding-bottom: 5rem;
  text-align: center;
`;

const HeroHeading = styled.h1`
  font-size: clamp(2rem, 5vw, 3.25rem);
  font-weight: 700;
  color: #111;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 1rem;
`;

const HeroSubhead = styled.p`
  font-size: 1.25rem;
  line-height: 1.6;
  color: #374151;
  margin: 0 0 2rem;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
`;

const CtaButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background: #f81e3e;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;

  &:hover {
    background: #e01a38;
    color: #fff;
  }
`;

const CtaButtonSecondary = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: #f81e3e;
  background: transparent;
  border: 2px solid #f81e3e;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  margin-left: 0.75rem;

  &:hover {
    background: rgba(248, 30, 62, 0.06);
  }
`;

const CtaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  align-items: center;
`;

const DescriptionSection = styled(Section)`
  background: #fbfbfb;
  padding: 4rem 1.5rem;
`;

const DescriptionText = styled.p`
  font-size: 1.125rem;
  line-height: 1.75;
  color: #374151;
  margin: 0;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const FeatureCard = styled.div`
  padding: 1.5rem;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`;

const FeatureIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: rgba(248, 30, 62, 0.08);
  color: #f81e3e;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111;
  margin: 0 0 0.5rem;
`;

const FeatureDesc = styled.p`
  font-size: 0.9375rem;
  line-height: 1.5;
  color: #6b7280;
  margin: 0;
`;

const SectionTitle = styled.h2`
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 700;
  color: #111;
  text-align: center;
  margin: 0 0 0.5rem;
`;

const SectionSubtitle = styled.p`
  font-size: 1rem;
  color: #6b7280;
  text-align: center;
  margin: 0 0 2rem;
`;

const PricingCard = styled.div`
  max-width: 480px;
  margin: 0 auto 2rem;
  padding: 2rem;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  text-align: center;
`;

const PricingTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111;
  margin: 0 0 1rem;
`;

const PricingList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 1rem;
    line-height: 1.5;
    color: #374151;
    margin-bottom: 0.75rem;
  }
  li svg {
    flex-shrink: 0;
    margin-top: 0.2rem;
    color: #10b981;
  }
`;

const BenefitsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
`;

const BenefitIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(248, 30, 62, 0.08);
  color: #f81e3e;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const BenefitText = styled.div`
  font-size: 1rem;
  font-weight: 500;
  color: #111;
`;

const AuthGateMessage = styled.div`
  max-width: 420px;
  margin: 2rem auto;
  padding: 1.5rem;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 12px;
  text-align: center;
  font-size: 1rem;
  color: #92400e;
`;

const LoginPrompt = styled.p`
  margin: 0 0 1rem;
  font-weight: 500;
`;

export default function WidgetLandingClient() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthUser();
  const setShouldOpenAuthModal = useAuthStore((s) => s.setShouldOpenAuthModal);

  const hasBusiness = !!user?.has_business;

  const handleGetWidget = () => {
    if (!isAuthenticated) {
      saveRedirectPath("/widget");
      setShouldOpenAuthModal(true);
      return;
    }
    if (!hasBusiness) return;
    router.push("/business/dashboard/widget");
  };

  const handleOpenLogin = () => {
    saveRedirectPath("/widget");
    setShouldOpenAuthModal(true);
  };

  useEffect(() => {
    if (isAuthenticated && hasBusiness && user) {
      const { path } = getRedirectPath();
      if (path === "/widget") {
        clearRedirectPath();
      }
    }
  }, [isAuthenticated, hasBusiness, user]);

  if (isLoading) {
    return (
      <Section style={{ padding: "6rem 1rem", textAlign: "center" }}>
        <p style={{ color: "#6b7280" }}>Loading…</p>
      </Section>
    );
  }

  return (
    <main>
      <HeroSection>
        <HeroHeading>Accept bookings on your own website</HeroHeading>
        <HeroSubhead>
          Embed a seamless, on-brand booking experience so customers never leave your site. Same classes, real-time availability, secure payments.
        </HeroSubhead>
        {!isAuthenticated && (
          <AuthGateMessage>
            <LoginPrompt>Log in or sign up to get the widget and add it to your site.</LoginPrompt>
            <CtaRow>
              <CtaButtonSecondary onClick={handleOpenLogin}>
                Log in
              </CtaButtonSecondary>
              <CtaButton href="/business/register" onClick={() => saveRedirectPath("/widget")}>
                Sign up as business <ArrowRight size={18} />
              </CtaButton>
            </CtaRow>
          </AuthGateMessage>
        )}
        {isAuthenticated && !hasBusiness && (
          <AuthGateMessage>
            <LoginPrompt>The widget is for business accounts. Sign up as a business or switch to a business account to continue.</LoginPrompt>
            <CtaButton href="/business/register">Sign up as business</CtaButton>
          </AuthGateMessage>
        )}
        {isAuthenticated && hasBusiness && (
          <CtaRow>
            <CtaButton href="/business/dashboard/widget" onClick={(e) => { e.preventDefault(); handleGetWidget(); }}>
              Get the widget <ArrowRight size={18} />
            </CtaButton>
          </CtaRow>
        )}
      </HeroSection>

      <DescriptionSection>
        <SectionTitle>One widget, your brand</SectionTitle>
        <DescriptionText>
          Add the ClassEasily booking widget to your website in minutes. It shows your live classes and availability, matches your colors and fonts, and accepts payments securely. Your customers get the same trusted experience they’d find on the ClassEasily marketplace—without leaving your site.
        </DescriptionText>
      </DescriptionSection>

      <Section>
        <SectionTitle>Features</SectionTitle>
        <SectionSubtitle>Everything you need to take bookings on your site</SectionSubtitle>
        <FeaturesGrid>
          <FeatureCard>
            <FeatureIcon><Palette size={24} /></FeatureIcon>
            <FeatureTitle>Match your brand</FeatureTitle>
            <FeatureDesc>Customize colors, fonts, and border radius so the widget fits your site.</FeatureDesc>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon><Layout size={24} /></FeatureIcon>
            <FeatureTitle>Multiple display options</FeatureTitle>
            <FeatureDesc>Use a modal, drawer, inline block, or floating button—whatever fits your layout.</FeatureDesc>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon><Calendar size={24} /></FeatureIcon>
            <FeatureTitle>Real-time availability</FeatureTitle>
            <FeatureDesc>Your live schedule and spots are always in sync with your dashboard.</FeatureDesc>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon><Shield size={24} /></FeatureIcon>
            <FeatureTitle>Secure payments</FeatureTitle>
            <FeatureDesc>Stripe-powered checkout so you and your customers are protected.</FeatureDesc>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon><Code size={24} /></FeatureIcon>
            <FeatureTitle>No coding required</FeatureTitle>
            <FeatureDesc>Copy and paste a short embed code into your site—that’s it.</FeatureDesc>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon><Smartphone size={24} /></FeatureIcon>
            <FeatureTitle>Mobile-friendly</FeatureTitle>
            <FeatureDesc>Works great on phones and tablets so customers can book on the go.</FeatureDesc>
          </FeatureCard>
        </FeaturesGrid>
      </Section>

      <Section style={{ background: "#fbfbfb" }}>
        <SectionTitle>Simple pricing</SectionTitle>
        <SectionSubtitle>4% per booking + $50/month. Stripe fees come out of your payout.</SectionSubtitle>
        <PricingCard>
          <PricingTitle>Widget subscription</PricingTitle>
          <PricingList>
            <li><Check size={20} /> 4% per booking (added to the class price; customer pays class price + 4%)</li>
            <li><Check size={20} /> $50/month subscription for widget access</li>
            <li><Check size={20} /> Stripe processing fees are deducted from your payout</li>
          </PricingList>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "1rem 0 0" }}>
            Example: $100 class → customer pays $104. You receive $100 − 4% − Stripe fee.
          </p>
        </PricingCard>
      </Section>

      <Section>
        <SectionTitle>Why partner with ClassEasily</SectionTitle>
        <SectionSubtitle>More than a widget—grow with us</SectionSubtitle>
        <BenefitsList>
          <BenefitItem>
            <BenefitIcon><Zap size={20} /></BenefitIcon>
            <BenefitText>Marketing and exposure from ClassEasily</BenefitText>
          </BenefitItem>
          <BenefitItem>
            <BenefitIcon><Globe size={20} /></BenefitIcon>
            <BenefitText>Listings on the ClassEasily marketplace</BenefitText>
          </BenefitItem>
          <BenefitItem>
            <BenefitIcon><BarChart3 size={20} /></BenefitIcon>
            <BenefitText>One dashboard for marketplace and your own site</BenefitText>
          </BenefitItem>
          <BenefitItem>
            <BenefitIcon><Lock size={20} /></BenefitIcon>
            <BenefitText>Trust and security—payments and compliance handled for you</BenefitText>
          </BenefitItem>
        </BenefitsList>
      </Section>

      <Section style={{ paddingBottom: "5rem", textAlign: "center" }}>
        <HeroSubhead style={{ marginBottom: "1.5rem" }}>
          Ready to add bookings to your website?
        </HeroSubhead>
        {isAuthenticated && hasBusiness ? (
          <CtaButton href="/business/dashboard/widget">Go to widget settings</CtaButton>
        ) : (
          <CtaRow style={{ justifyContent: "center" }}>
            <CtaButtonSecondary onClick={handleOpenLogin}>Log in</CtaButtonSecondary>
            <CtaButton href="/business/register" onClick={() => saveRedirectPath("/widget")}>
              Get the widget <ArrowRight size={18} />
            </CtaButton>
          </CtaRow>
        )}
      </Section>
    </main>
  );
}
