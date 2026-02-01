"use client";

import React, { useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { ConfigProvider, message } from "antd";
import { theme } from "@/components/theme";
import Header from "@/components/layout/SharedMainClientHeader";
import FooterClient from "@/components/homepage/FooterClient";

// --- Global Styles ---
const GlobalStyle = createGlobalStyle`
  body {
    background-color: #ffffff;
    overflow-x: hidden;
  }
`;

// --- Styled Components ---

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  color: #222222;
  background: #ffffff;
`;

const Container = styled.div`
  max-width: 1120px; /* Airbnb standard width */
  margin: 0 auto;
  padding: 0 24px;
  position: relative;

  @media (max-width: 768px) {
    padding: 0 20px;
  }
`;

/* --- TYPOGRAPHY --- */
const Headline = styled.h1`
  font-size: clamp(3rem, 6vw, 4.5rem);
  font-weight: 800;
  color: #222222;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-align: center;
  margin-bottom: 20px;
`;

const SubHeadline = styled.p`
  font-size: 1.125rem;
  font-weight: 400;
  color: #222222;
  text-align: center;
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 4rem;
  font-weight: 700;
  color: #222222;
  text-align: center;
  margin-bottom: 16px;
`;

const LinkText = styled.a`
  color: #222222;
  text-decoration: underline;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  text-align: center;
  display: block;
  margin-top: 10px;

  &:hover {
    color: #000000;
  }
`;

/* --- BUTTONS --- */
const BuyButton = styled(motion.button)`
  background: #ff385c; /* Airbnb Pink */
  color: #ffffff;
  border: none;
  height: 56px; /* Slightly taller */
  padding: 0 32px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease;

  &:hover {
    background: #d9324e;
  }
`;

const DarkButton = styled(motion.button)`
  background: #222222;
  color: #ffffff;
  border: none;
  height: 48px;
  padding: 0 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
`;

/* --- HERO --- */
const HeroSection = styled.section`
  padding: 80px 0 60px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
`;

const HeroVisual = styled.div`
  margin-top: 60px;
  position: relative;
  width: 100%;
  height: 500px;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 768px) {
    height: 350px;
    margin-top: 40px;
  }
`;

// Creating the tilted cards effect using CSS
const FloatingCard = styled(motion.div)`
  width: 420px;
  height: 260px;
  border-radius: 16px;
  position: absolute;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  background-size: cover;
  background-position: center;

  @media (max-width: 768px) {
    width: 280px;
    height: 175px;
  }
`;

/* --- VALUE PROP SECTION --- */
const TextSection = styled.section`
  padding: 60px 0;
  text-align: center;
`;

/* --- DESIGN GRID --- */
const DesignGridSection = styled.section`
  padding: 40px 0 80px 0;
`;

const GridTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 32px;
  text-align: center;
  color: #222222;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const DesignCard = styled(motion.div)`
  aspect-ratio: 1.58/1; /* Credit card ratio */
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  &:hover img {
    transform: scale(1.05);
  }
`;

/* --- FEATURES 3-COL --- */
const FeatureSection = styled.section`
  padding: 60px 0;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 48px;
  text-align: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const FeatureTitle = styled.h4`
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #222222;
`;

const FeatureText = styled.p`
  font-size: 0.95rem;
  color: #222222; /* Changed from gray to black */
  line-height: 1.4;
`;

/* --- CORPORATE SECTION (Gray Background) --- */
const CorporateSection = styled.section`
  background: #f7f7f7;
  padding: 80px 0;
  margin: 40px 0;
`;

const CorporateLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 60px;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    text-align: center;

    button {
      margin: 0 auto;
    }
  }
`;

const CorpImageWrapper = styled.div`
  position: relative;
  height: 350px;
  width: 100%;

  img {
    object-fit: contain;
  }
`;

/* --- FAQ SECTION --- */
const FAQSection = styled.section`
  padding: 80px 0;
  max-width: 800px;
  margin: 0 auto;
`;

const FAQItem = styled.div`
  border-bottom: 1px solid #dddddd;
`;

const FAQTrigger = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;

  span {
    font-size: 1.125rem;
    color: #222;
  }
`;

const FAQContent = styled(motion.div)`
  overflow: hidden;
  color: #222222; /* Changed from gray to black */
  font-size: 1rem;
  line-height: 1.6;
`;

// --- DATA ---
const CARD_DESIGNS = [
  "https://images.unsplash.com/photo-1516738901171-8f4fc8b07d6d?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523575708161-ad0fc2a9b951?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1607962837359-5e7e89f86776?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800&auto=format&fit=crop",
];

const FAQS = [
  {
    q: "Are gift cards physical or digital?",
    a: "Our gift cards are completely digital. They are sent via email instantly or on a scheduled date of your choice.",
  },
  {
    q: "Where can I buy a physical gift card?",
    a: "Currently, we only offer digital gift cards to reduce environmental impact and ensure instant delivery.",
  },
  { q: "Do gift cards expire?", a: "No. Our gift cards never expire." },
  {
    q: "Can I send a gift card to someone in a different country?",
    a: "Yes, provided the currency matches the region they are booking in, or if the card supports automatic currency conversion (US/EU/UK only).",
  },
];

export default function GiftCardsPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleUnsupported = () => {
    message.info(
      "This feature is not supported yet and will be available soon.",
    );
  };

  return (
    <ConfigProvider theme={theme}>
      <GlobalStyle />
      <Header />

      <PageWrapper>
        {/* HERO SECTION */}
        <HeroSection>
          <Container>
            <Headline>
              ClassEasily
              <br />
              gift cards
            </Headline>
            <SubHeadline>
              So many fun experiences. There’s even more to go do.
            </SubHeadline>
            <div style={{ textAlign: "center" }}>
              <BuyButton whileTap={{ scale: 0.95 }}>Buy now</BuyButton>
            </div>

            <HeroVisual>
              {/* Card 1: Tilted Left (Back) */}
              <FloatingCard
                initial={{ rotate: -15, x: -60, y: 20 }}
                animate={{ rotate: -12, x: -80, y: 10 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1629196914375-f7e48f477b6d?q=80&w=1000&auto=format&fit=crop')`,
                  zIndex: 1,
                }}
              >
                {/* Logo overlay simulation */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 20,
                    left: 24,
                    color: "white",
                    fontWeight: "bold",
                    fontSize: 20,
                  }}
                >
                  ClassEasily
                </div>
              </FloatingCard>

              {/* Card 2: Tilted Right (Front) */}
              <FloatingCard
                initial={{ rotate: 10, x: 60, y: -20 }}
                animate={{ rotate: 8, x: 50, y: -10 }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
                style={{
                  backgroundColor: "#FF385C",
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </FloatingCard>
            </HeroVisual>
          </Container>
        </HeroSection>

        {/* VALUE PROP TEXT */}
        <TextSection>
          <Container>
            <SectionTitle>You give. They go.</SectionTitle>
            <p
              style={{
                maxWidth: 600,
                margin: "0 auto",
                lineHeight: "1.5",
                color: "#222222" /* Black text */,
              }}
            >
              Bring the world of skills to friends and family. Celebrate
              holidays, recognize important moments, and inspire growth. Help
              them go wherever their curiosity leads, since gift cards never
              expire.
            </p>
            <div style={{ marginTop: 24 }}>
              <span style={{ fontSize: "0.9rem", color: "#222222" }}>
                Purchasing for business?
              </span>
              <LinkText onClick={handleUnsupported}>
                Buy gift cards in bulk
              </LinkText>
            </div>
          </Container>
        </TextSection>

        {/* CARD GRID */}
        <DesignGridSection>
          <Container>
            <GridTitle>Pick your design</GridTitle>
            <CardGrid>
              {CARD_DESIGNS.map((src, i) => (
                <DesignCard key={i} whileHover={{ y: -4 }}>
                  <Image
                    src={src}
                    alt="Card design"
                    fill
                    style={{ objectFit: "cover" }}
                  />
                  {/* Logo overlay */}
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      left: 16,
                      zIndex: 2,
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    </svg>
                  </div>
                </DesignCard>
              ))}
            </CardGrid>
          </Container>
        </DesignGridSection>

        {/* FEATURES */}
        <FeatureSection>
          <Container>
            <FeatureGrid>
              <div>
                <FeatureTitle>What they want</FeatureTitle>
                <FeatureText>
                  You choose the design, message, and gift amount. They choose
                  the class, workshop, or service.
                </FeatureText>
              </div>
              <div>
                <FeatureTitle>Easy to send</FeatureTitle>
                <FeatureText>
                  Delivers in minutes via text or email. You’ll receive a
                  confirmation once it’s been received.
                </FeatureText>
              </div>
              <div>
                <FeatureTitle>Never expires</FeatureTitle>
                <FeatureText>
                  Gift credit is available to use whenever they’re ready to
                  start learning.
                </FeatureText>
              </div>
            </FeatureGrid>
          </Container>
        </FeatureSection>

        {/* CORPORATE SECTION */}
        <CorporateSection>
          <CorporateLayout>
            <div>
              <h2
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  margin: "0 0 16px 0",
                  lineHeight: 1.1,
                  color: "#222222",
                }}
              >
                Gift cards
                <br />
                for business
              </h2>
              <p
                style={{
                  fontSize: "1rem",
                  color: "#222222" /* Black text */,
                  marginBottom: 24,
                  lineHeight: 1.5,
                }}
              >
                Show your appreciation for employees and customers with a gift
                that’s easy to give for any occasion.
              </p>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: "0.9rem", color: "#222222" }}>
                  For orders $10,000 or more,{" "}
                </span>
                <span
                  onClick={handleUnsupported}
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    textDecoration: "underline",
                    cursor: "pointer",
                    color: "#222222",
                  }}
                >
                  contact sales.
                </span>
              </div>
              <DarkButton
                onClick={handleUnsupported}
                whileTap={{ scale: 0.95 }}
              >
                Get started
              </DarkButton>
            </div>

            <CorpImageWrapper>
              {/* Simulating the fanned out cards stack */}
              <div
                style={{ position: "relative", width: "100%", height: "100%" }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "10%",
                    right: "10%",
                    width: "80%",
                    height: "80%",
                    background: "white",
                    borderRadius: 16,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    transform: "rotate(-5deg)",
                    zIndex: 1,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "5%",
                    right: "5%",
                    width: "80%",
                    height: "80%",
                    background: "#FF385C",
                    borderRadius: 16,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                    transform: "rotate(5deg)",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.5"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
              </div>
            </CorpImageWrapper>
          </CorporateLayout>
        </CorporateSection>

        {/* FAQ */}
        <Container>
          <FAQSection>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                marginBottom: 40,
                color: "#222222",
              }}
            >
              Frequently asked questions
            </h2>
            {FAQS.map((item, index) => (
              <FAQItem key={index}>
                <FAQTrigger onClick={() => toggleFaq(index)}>
                  <span style={{ color: "#222222" }}>{item.q}</span>
                  {openFaq === index ? (
                    <ChevronUp size={20} color="#222222" />
                  ) : (
                    <ChevronDown size={20} color="#222222" />
                  )}
                </FAQTrigger>
                <AnimatePresence>
                  {openFaq === index && (
                    <FAQContent
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div style={{ paddingBottom: 24 }}>{item.a}</div>
                    </FAQContent>
                  )}
                </AnimatePresence>
              </FAQItem>
            ))}
            <div
              style={{ marginTop: 32, fontSize: "0.9rem", color: "#222222" }}
            >
              For more questions visit the{" "}
              <span
                style={{
                  fontWeight: 600,
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Help Center
              </span>
              .
            </div>
          </FAQSection>
        </Container>
      </PageWrapper>
      <FooterClient />
    </ConfigProvider>
  );
}
