"use client";

import React, { useRef } from "react";
import styled from "styled-components";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Sparkles, Users, MapPin, Shield } from "lucide-react";
import Header from "@/components/header/Header";
import FooterSmart from "@/components/homepage/FooterSmart";

// --- SEO STRUCTURED DATA ---
const structuredData = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About ClassEasily",
  "description": "Reimagining local learning through face-to-face workshops and community connections.",
  "publisher": {
    "@type": "Organization",
    "name": "ClassEasily",
    "logo": {
      "@type": "ImageObject",
      "url": "https://classeasily.com/logo.png"
    }
  }
};

// --- DECORATIVE ELEMENTS (no images) ---
const HeroPattern = () => (
  <svg
    className="hero-pattern"
    preserveAspectRatio="xMidYMid slice"
    viewBox="0 0 1440 900"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff5f5" stopOpacity="1" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#f0f9ff" stopOpacity="0.8" />
      </linearGradient>
      <linearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ff385c" stopOpacity="0" />
        <stop offset="50%" stopColor="#ff385c" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#ff385c" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect width="1440" height="900" fill="url(#heroGrad)" />
    <circle cx="200" cy="200" r="120" stroke="#ff385c" strokeWidth="0.5" fill="none" opacity="0.15" />
    <circle cx="1240" cy="700" r="80" stroke="#ff385c" strokeWidth="0.5" fill="none" opacity="0.1" />
    <path d="M0 400 L1440 380" stroke="url(#accentLine)" strokeWidth="1" strokeLinecap="round" />
    <path d="M0 550 L1440 530" stroke="url(#accentLine)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const OriginDecoration = () => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <circle cx="60" cy="60" r="50" stroke="#ff385c" strokeWidth="1" fill="none" opacity="0.2" />
    <circle cx="60" cy="60" r="35" stroke="#ff385c" strokeWidth="1" fill="none" opacity="0.15" />
    <circle cx="60" cy="60" r="20" stroke="#ff385c" strokeWidth="1" fill="none" opacity="0.3" />
    <line x1="60" y1="10" x2="60" y2="55" stroke="#ff385c" strokeWidth="1" opacity="0.4" />
    <line x1="60" y1="65" x2="60" y2="110" stroke="#ff385c" strokeWidth="1" opacity="0.4" />
    <line x1="10" y1="60" x2="55" y2="60" stroke="#ff385c" strokeWidth="1" opacity="0.4" />
    <line x1="65" y1="60" x2="110" y2="60" stroke="#ff385c" strokeWidth="1" opacity="0.4" />
  </svg>
);

// --- GLOBAL STYLES & LAYOUT ---

const PageWrapper = styled.div`
  background-color: #fafafa;
  color: #0f172a;
  font-family: var(--font-proxima-soft), -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
  position: relative;
`;

const MainContainer = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;

  @media (max-width: 768px) {
    padding: 0 1.5rem;
  }
`;

// --- TYPOGRAPHY ---

const DisplayText = styled(motion.h1)`
  font-size: clamp(2.75rem, 6vw, 5rem);
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.03em;
  margin: 0;
  color: #0f172a;
  position: relative;
  
  span.accent {
    color: #ff385c;
    font-weight: 700;
  }
`;

const SectionLabel = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-weight: 600;
  color: #ff385c;
  display: block;
  margin-bottom: 1.5rem;
  position: relative;
`;

const LeadText = styled.p`
  font-size: clamp(1.125rem, 1.5vw, 1.5rem);
  line-height: 1.5;
  font-weight: 400;
  color: #475569;
  max-width: 42ch;
`;

// --- HERO SECTION ---

const HeroSection = styled.header`
  min-height: 85vh;
  padding-top: 140px;
  padding-bottom: 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;

  .hero-pattern {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    z-index: 0;
  }

  > div {
    position: relative;
    z-index: 1;
  }
`;

const HeroBadge = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 56, 92, 0.08);
  border: 1px solid rgba(255, 56, 92, 0.2);
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #ff385c;
  letter-spacing: 0.05em;
  margin-bottom: 2rem;
`;

// --- ORIGIN STORY ---

const OriginSection = styled.article`
  display: grid;
  grid-template-columns: 1fr;
  gap: 4rem;
  padding: 6rem 0;
  background: #fff;
  border-radius: 0;
  position: relative;

  @media (min-width: 900px) {
    grid-template-columns: 280px 1fr;
    gap: 5rem;
    padding: 8rem 0;
    margin: 0 -2rem;
    padding-left: 2rem;
    padding-right: 2rem;
  }
`;

const OriginSidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (min-width: 900px) {
    position: sticky;
    top: 120px;
    align-self: start;
  }
`;

const OriginDecorationWrapper = styled.div`
  width: 100px;
  height: 100px;
  opacity: 0.5;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const OriginTitle = styled.h2`
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #0f172a;
  margin: 0;
`;

const OriginContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const StoryBlock = styled(motion.div)`
  padding: 2rem 0;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
`;

const StoryParagraph = styled.p`
  font-size: 1.125rem;
  line-height: 1.75;
  color: #475569;
  margin: 0;
  max-width: 58ch;
`;

const StoryQuote = styled.blockquote`
  margin: 2rem 0;
  padding: 2rem 2.5rem;
  background: linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%);
  border-left: 4px solid #ff385c;
  border-radius: 0 8px 8px 0;
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.6;
  color: #0f172a;
  font-style: normal;

  &::before {
    content: "\201C";
    font-size: 3rem;
    color: #ff385c;
    opacity: 0.3;
    line-height: 0;
    display: block;
    margin-bottom: -1.5rem;
  }
`;

// --- HOW IT WORKS ---

const ProcessSection = styled.section`
  padding: 6rem 0;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  color: #fff;
  position: relative;
`;

const ProcessHeader = styled.div`
  margin-bottom: 4rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
`;

const ProcessLabel = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-weight: 600;
  color: #ff385c;
  display: block;
  margin-bottom: 1rem;
`;

const ProcessTitle = styled.h2`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.2;
`;

const ProcessRow = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 3rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  transition: background 0.25s ease;

  @media (min-width: 768px) {
    grid-template-columns: 80px 1fr 240px;
    align-items: center;
  }

  &:last-child {
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
`;

const StepIndex = styled.span`
  font-family: ui-monospace, monospace;
  font-size: 1.5rem;
  font-weight: 600;
  color: #ff385c;
  opacity: 0.9;
`;

const StepTitle = styled.h3`
  font-size: clamp(1.5rem, 2.5vw, 2.25rem);
  font-weight: 500;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
`;

const StepDesc = styled.p`
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.5;
  margin: 0;

  @media (min-width: 768px) {
    text-align: right;
  }
`;

// --- VALUES ---

const ValuesSection = styled.section`
  padding: 6rem 0;
  background: #fff;
  border-top: 1px solid #f1f5f9;
`;

const ValuesHeader = styled.div`
  text-align: center;
  max-width: 600px;
  margin: 0 auto 4rem;
`;

const ValuesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  overflow: hidden;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const ValueCell = styled(motion.div)`
  padding: 3rem 2rem;
  background: #fff;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (min-width: 768px) {
    border-bottom: none;
    border-right: 1px solid #f1f5f9;
    padding: 3rem 2.5rem;

    &:nth-child(3n) {
      border-right: none;
    }
  }
`;

const ValueIconWrapper = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #ff385c 0%, #e11d48 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
`;

const ValueTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`;

const ValueText = styled.p`
  font-size: 0.9375rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
`;

// --- CTA ---

const CTASection = styled.section`
  padding: 8rem 2rem;
  text-align: center;
  background: linear-gradient(180deg, #fafafa 0%, #f8fafc 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
`;

const CTAHeading = styled.h2`
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
  max-width: 14ch;
  margin: 0;
  color: #0f172a;

  span {
    color: #ff385c;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const PrimaryButton = styled(motion.a)`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.75rem;
  background: #ff385c;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.2s ease, transform 0.2s ease;

  &:hover {
    background: #e11d48;
    transform: translateY(-1px);
  }
`;

const SecondaryButton = styled(motion.a)`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.75rem;
  background: transparent;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  border: 2px solid #0f172a;
  border-radius: 8px;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: #0f172a;
    color: #fff;
  }
`;

// --- ANIMATION UTILS ---

const RevealBlock = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
  >
    {children}
  </motion.div>
);

// --- MAIN COMPONENT ---

const AboutUs = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.5]);
  const heroY = useTransform(scrollYProgress, [0, 0.3], ["0%", "10%"]);

  const values = [
    {
      icon: <Users size={24} strokeWidth={2} />,
      title: "Face-to-Face",
      text: "We believe the best learning happens when people are in the same room. Real feedback, real connection.",
    },
    {
      icon: <MapPin size={24} strokeWidth={2} />,
      title: "Local First",
      text: "Every neighborhood has experts worth learning from. We're here to surface them.",
    },
    {
      icon: <Shield size={24} strokeWidth={2} />,
      title: "Safety & Trust",
      text: "Verified hosts, secure payments, and clear expectations. Always.",
    },
  ];

  const processSteps = [
    { id: "01", title: "Discover", desc: "Browse workshops and experiences happening near you." },
    { id: "02", title: "Book", desc: "Reserve your spot in seconds. No hassle." },
    { id: "03", title: "Learn", desc: "Show up, meet people, and learn by doing." },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Header
        hamburgerColor="#0f172a"
        dropdownButtonColor="#0f172a"
        dropdownButtonHoverColor="#ff385c"
        dropdownButtonOutlineColor="#0f172a"
        logoTitleColor="#ff385c"
      />

      <PageWrapper ref={containerRef}>
        <MainContainer>
          <HeroSection>
            <HeroPattern />
            <motion.div style={{ y: heroY, opacity: heroOpacity }}>
              <HeroBadge
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles size={14} /> Reimagining local learning
              </HeroBadge>
              <RevealBlock>
                <SectionLabel>About ClassEasily</SectionLabel>
              </RevealBlock>
              <DisplayText>
                <RevealBlock delay={0.05}>
                  Where neighbors become{" "}
                  <span className="accent">teachers.</span>
                </RevealBlock>
              </DisplayText>
              <RevealBlock delay={0.15}>
                <LeadText style={{ marginTop: "1.5rem" }}>
                  We connect curious people with local experts. Pottery, woodworking, cooking, dance—real skills, real places, real hands.
                </LeadText>
              </RevealBlock>
              <RevealBlock delay={0.25}>
                <p
                  style={{
                    marginTop: "2rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#94a3b8",
                    letterSpacing: "0.1em",
                  }}
                >
                  EST. 2024
                </p>
              </RevealBlock>
            </motion.div>
          </HeroSection>

          <OriginSection>
            <OriginSidebar>
              <OriginDecorationWrapper>
                <OriginDecoration />
              </OriginDecorationWrapper>
              <OriginTitle>The Story</OriginTitle>
            </OriginSidebar>
            <OriginContent>
              <StoryBlock
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <StoryParagraph>
                  It started with a simple question: why is it so hard to find a woodworking class that isn&apos;t booked out six months in advance? Or a pottery studio that takes beginners? The knowledge was right there, in our neighborhoods—we just couldn&apos;t find it.
                </StoryParagraph>
              </StoryBlock>
              <StoryBlock
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <StoryQuote>
                  We realized our cities are full of experts. The neighbor who bakes incredible sourdough, the retired teacher who throws ceramics, the barista who paints. They have the skills. They didn&apos;t have the platform.
                </StoryQuote>
              </StoryBlock>
              <StoryBlock
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <StoryParagraph>
                  ClassEasily is our answer. Not another video tutorial site—a place to step away from screens and into real workshops, garages, and studios. We&apos;re rebuilding the village way of learning: messy tables, real conversations, hands-on guidance.
                </StoryParagraph>
              </StoryBlock>
              <StoryBlock
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <StoryParagraph>
                  Today, we help thousands of people discover what&apos;s happening down the street—and we help talented teachers fill their classes without the old overhead.
                </StoryParagraph>
              </StoryBlock>
            </OriginContent>
          </OriginSection>
        </MainContainer>

        <ProcessSection>
          <MainContainer>
            <ProcessHeader>
              <ProcessLabel>How it works</ProcessLabel>
              <ProcessTitle>Three steps. Real learning.</ProcessTitle>
            </ProcessHeader>

            {processSteps.map((step, i) => (
              <ProcessRow
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <StepIndex>{step.id}</StepIndex>
                <StepTitle>{step.title}</StepTitle>
                <StepDesc>{step.desc}</StepDesc>
              </ProcessRow>
            ))}
          </MainContainer>
        </ProcessSection>

        <ValuesSection>
          <MainContainer>
            <ValuesHeader>
              <SectionLabel style={{ color: "#ff385c", marginBottom: "0.75rem" }}>What we stand for</SectionLabel>
              <h2
                style={{
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "#0f172a",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                Built on principles that matter
              </h2>
            </ValuesHeader>

            <ValuesGrid>
              {values.map((item, i) => (
                <ValueCell
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ValueIconWrapper>{item.icon}</ValueIconWrapper>
                  <div>
                    <ValueTitle>{item.title}</ValueTitle>
                    <ValueText>{item.text}</ValueText>
                  </div>
                </ValueCell>
              ))}
            </ValuesGrid>
          </MainContainer>
        </ValuesSection>

        <CTASection>
          <RevealBlock>
            <CTAHeading>
              Ready to get your <span>hands dirty?</span>
            </CTAHeading>
          </RevealBlock>
          <CTAButtons>
            <PrimaryButton href="/explore" title="Find a workshop near you">
              Find a workshop <ArrowUpRight size={18} strokeWidth={2.5} />
            </PrimaryButton>
            <SecondaryButton href="/business" title="Become a workshop host">
              Become a host
            </SecondaryButton>
          </CTAButtons>
        </CTASection>

        <FooterSmart />
      </PageWrapper>
    </>
  );
};

export default AboutUs;
