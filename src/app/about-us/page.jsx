"use client";

import React, { useRef } from "react";
import styled from "styled-components";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import Header from "@/components/header/Header";
import FooterSmart from "@/components/homepage/FooterSmart";
import Head from "next/head";

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

// --- GLOBAL STYLES & LAYOUT ---

const PageWrapper = styled.div`
  background-color: #ffffff;
  color: #111111;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
  position: relative;
`;

const MainContainer = styled.main`
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;

  @media (max-width: 768px) {
    padding: 0 1.5rem;
  }
`;

const GridLine = styled.div`
  position: absolute;
  background: rgba(0, 0, 0, 0.06);
  z-index: 0;
  pointer-events: none;
`;

// --- TYPOGRAPHY ---

const DisplayText = styled(motion.h1)`
  font-size: clamp(3.5rem, 8vw, 7.5rem);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.04em;
  margin: 0;
  color: #111;
  position: relative;
  z-index: 1;
  
  span {
    display: block;
    /* Ensure the span itself doesn't cause overflow issues */
    padding: 0.1em 0; 
  }
`;

const SectionLabel = styled.span`
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  color: #666;
  display: block;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 1;

  &::before {
    content: "";
    width: 12px;
    height: 12px;
    background: #ff385c;
  }
`;

const LeadText = styled.p`
  font-size: clamp(1.25rem, 2vw, 2rem);
  line-height: 1.4;
  font-weight: 400;
  color: #111;
  max-width: 40ch;
`;

// --- HERO SECTION ---

const HeroSection = styled.header`
  min-height: 90vh;
  padding-top: 140px;
  padding-bottom: 4rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;
`;

const HeroVideoContainer = styled(motion.div)`
  width: 100%;
  height: 400px;
  margin-top: 4rem;
  position: relative;
  overflow: hidden;
  background: #f0f0f0;
  z-index: 2;
  border-radius: 4px;

  @media (min-width: 1024px) {
    height: 600px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(100%);
    transition: filter 0.5s ease;
  }

  &:hover img {
    filter: grayscale(0%);
  }
`;

// --- ORIGIN STORY (The Split) ---

const SplitSection = styled.article`
  display: grid;
  grid-template-columns: 1fr;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: #f9f9f9;

  @media (min-width: 1024px) {
    grid-template-columns: 0.8fr 1.2fr;
    min-height: 100vh;
  }
`;

const StickySide = styled.div`
  padding: 4rem 1.5rem;
  background: #f9f9f9;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  @media (min-width: 768px) {
    padding: 4rem 2rem;
  }

  @media (min-width: 1024px) {
    position: sticky;
    top: 0;
    height: 100vh;
    padding: 6rem 3rem;
  }
`;

const ScrollSide = styled.div`
  padding: 4rem 1.5rem;
  background: #fff;
  
  @media (min-width: 768px) {
    padding: 4rem 2rem;
  }

  @media (min-width: 1024px) {
    padding: 6rem 5rem;
  }
`;

const Paragraph = styled(motion.p)`
  font-size: 1.125rem;
  line-height: 1.8;
  color: #444;
  margin-bottom: 2.5rem;
  max-width: 55ch;
`;

// --- PROCESS SECTION (List Layout) ---

const ProcessSection = styled.section`
  padding: 6rem 0;
  background: #111;
  color: #fff;
`;

const ProcessRow = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr;
  padding: 3rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: background 0.3s ease;
  position: relative;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: 0.5fr 2fr 1fr;
    align-items: baseline;
    gap: 0;
  }

  &:last-child {
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  &:hover .arrow-icon {
    transform: translateX(5px);
    opacity: 1;
  }
`;

const StepIndex = styled.span`
  font-family: monospace;
  font-size: 1rem;
  color: #ff385c;
  margin-bottom: 0.5rem;
  display: block;
  
  @media (min-width: 768px) {
    margin-bottom: 0;
  }
`;

const StepTitle = styled.h3`
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 400;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.1;
`;

const StepDesc = styled.p`
  font-size: 1rem;
  color: #999;
  max-width: 300px;
  line-height: 1.6;
  margin: 0;

  @media (min-width: 768px) {
    text-align: right;
    justify-self: end;
  }
`;

// --- VALUES SECTION (Grid) ---

const ValuesSection = styled.section`
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background-color: #fff;
`;

const ValuesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const ValueCell = styled(motion.div)`
  padding: 4rem 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  min-height: 350px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  
  @media (min-width: 768px) {
    border-right: 1px solid rgba(0, 0, 0, 0.1);
    
    &:nth-child(3n) {
      border-right: none;
    }
  }
`;

const ValueIcon = styled.div`
  width: 40px;
  height: 40px;
  background: #111;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 2rem;
`;

// --- CTA ---

const CTASection = styled.section`
  padding: 8rem 1.5rem;
  text-align: center;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  
  @media (min-width: 768px) {
    padding: 10rem 2rem;
  }
`;

const BigButton = styled(motion.a)`
  background: #f81e3e;
  color: #fff;
  padding: 1.5rem 3rem;
  font-size: 1.25rem;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  z-index: 1;
  cursor: pointer;
  transition: color 0.3s ease;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 0%;
    height: 100%;
    background: #ff385c;
    transition: width 0.3s cubic-bezier(0.77, 0, 0.175, 1);
    z-index: -1;
  }

  &:hover::before {
    width: 100%;
  }

  &.outline-btn:hover {
    color: #fff !important;
    border-color: transparent !important;
  }
`;

// --- ANIMATION UTILS ---

const RevealText = ({ children, delay = 0 }) => {
  return (
    // FIX: Added paddingBottom and negative marginBottom to allow descenders (g, y, j) to be visible
    <div style={{ overflow: "hidden", paddingBottom: "1.2rem", marginBottom: "-1.2rem" }}>
      <motion.div
        initial={{ y: "110%" }}
        whileInView={{ y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// --- COMPONENTS ---

const AboutUs = () => {
  const containerRef = useRef(null);
  
  // Parallax for hero image
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <Header
        hamburgerColor="#111"
        dropdownButtonColor="#111"
        dropdownButtonHoverColor="#ff385c"
        dropdownButtonOutlineColor="#111"
        logoTitleColor="#ff385c"
      />
      
      <PageWrapper ref={containerRef}>
        <GridLine style={{ left: "25%", top: 0, bottom: 0, width: "1px", zIndex: 0 }} />
        <GridLine style={{ left: "75%", top: 0, bottom: 0, width: "1px", zIndex: 0 }} />

        <MainContainer>
          <HeroSection>
            <div>
              <RevealText>
                <SectionLabel>About ClassEasily</SectionLabel>
              </RevealText>
              <DisplayText>
                <RevealText delay={0.1}><span>Local learning,</span></RevealText>
                <RevealText delay={0.2}><span>focused on</span></RevealText>
                <RevealText delay={0.3}><span style={{color: '#ff385c'}}>connection.</span></RevealText>
              </DisplayText>
            </div>
            
            <HeroVideoContainer style={{ y }}>
              <motion.img
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5 }}
                src="https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?q=80&w=2835&auto=format&fit=crop"
                alt="Community workshop gathering with people laughing"
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                background: '#fff',
                padding: '1rem 2rem',
                borderTopRightRadius: '4px'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>EST. 2024</span>
              </div>
            </HeroVideoContainer>
          </HeroSection>
        </MainContainer>

        <SplitSection>
          <StickySide>
            <div style={{ position: "relative", zIndex: 2 }}>
              <h2 style={{ fontSize: "2.5rem", fontWeight: 500, letterSpacing: "-0.02em", margin: 0 }}>
                The Origin
              </h2>
            </div>
            <div style={{ marginTop: "auto", position: "relative" }}>
               <img 
                 src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=400&q=80" 
                 alt="Diverse group of people meeting at a table"
                 style={{ width: "100%", height: "300px", objectFit: "cover", marginTop: "2rem", filter: "grayscale(100%)" }}
               />
            </div>
          </StickySide>
          <ScrollSide>
            <RevealText>
              <LeadText style={{ marginBottom: "3rem" }}>
                It started with a simple frustration: why is it so hard to find a woodworking class that isn't booked out six months in advance?
              </LeadText>
            </RevealText>
            
            <Paragraph
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              We realized our cities are full of experts. The neighbor who makes incredible sourdough, the retired teacher who knows pottery, the barista who paints landscapes. They have the skills, but they don't have the platform.
            </Paragraph>
            <Paragraph
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              ClassEasily isn't just a booking site. It's an attempt to rebuild the "village" aspect of learning. We're moving away from impersonal video tutorials and back to messy tables, real conversations, and hands-on guidance.
            </Paragraph>
            <Paragraph
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Today, we're helping thousands of people step away from their screens and into local workshops, garages, and studios.
            </Paragraph>
          </ScrollSide>
        </SplitSection>

        <ProcessSection>
          <MainContainer>
            <div style={{ marginBottom: "4rem", borderBottom: "1px solid #333", paddingBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 400, color: "#999", margin: 0 }}>How it works</h2>
            </div>
            
            {[
              { title: "Discovery", desc: "Browse curated workshops happening in your neighborhood this weekend.", id: "01" },
              { title: "Booking", desc: "Seamless spot reservation. No back-and-forth emails.", id: "02" },
              { title: "Participation", desc: "Show up, meet locals, and learn with your hands.", id: "03" }
            ].map((step, i) => (
              <ProcessRow
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <StepIndex>{step.id}</StepIndex>
                <StepTitle>{step.title}</StepTitle>
                <StepDesc>{step.desc}</StepDesc>
                <ArrowRight 
                  className="arrow-icon" 
                  style={{ 
                    position: "absolute", 
                    right: "0", 
                    top: "50%", 
                    transform: "translateY(-50%)",
                    opacity: 0,
                    transition: "all 0.3s ease"
                  }} 
                />
              </ProcessRow>
            ))}
          </MainContainer>
        </ProcessSection>

        <ValuesSection>
          <MainContainer>
            <ValuesGrid>
              {[
                { title: "Face-to-Face", text: "We prioritize in-person connection over digital convenience." },
                { title: "Local First", text: "Supporting neighborhood economies and hidden talents." },
                { title: "Safety & Trust", text: "Verified hosts and secure transactions, always." },
              ].map((item, i) => (
                <ValueCell
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                >
                  <ValueIcon>{i + 1}</ValueIcon>
                  <div>
                    <h3 style={{ fontSize: "1.75rem", margin: "0 0 1rem 0" }}>{item.title}</h3>
                    <p style={{ color: "#666", lineHeight: 1.6, margin: 0 }}>{item.text}</p>
                  </div>
                </ValueCell>
              ))}
            </ValuesGrid>
          </MainContainer>
        </ValuesSection>

        <CTASection>
          <RevealText>
            <h2 style={{ 
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)", 
              fontWeight: 500, 
              lineHeight: 1.1,
              maxWidth: "15ch",
              margin: 0
            }}>
              Ready to get your <span style={{ color: "#ff385c" }}>hands dirty?</span>
            </h2>
          </RevealText>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <BigButton href="/explore" title="Find a workshop near you">
              Find a workshop <ArrowUpRight size={20} />
            </BigButton>
            <BigButton 
              href="/business" 
              className="outline-btn"
              style={{ background: "transparent", color: "#111", border: "1px solid #111" }}
              title="Become a workshop host"
            >
              Become a host
            </BigButton>
          </div>
        </CTASection>

        <FooterSmart />
      </PageWrapper>
    </>
  );
};

export default AboutUs;