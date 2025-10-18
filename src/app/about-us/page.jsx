"use client";

import React, { Suspense } from "react";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import {
  Users,
  Heart,
  Sparkles,
  Shield,
  ArrowUpRight,
  Star,
  SearchIcon,
} from "lucide-react";
import Header from "@/components/header/Header";
import dynamic from "next/dynamic";
const Footer = dynamic(() => import("@/components/homepage/Footer"), {
  loading: () => <div style={{ minHeight: "300px" }} />,
});

// --- ANIMATIONS & KEYFRAMES ---
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(3deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// --- STYLED COMPONENTS ---
const PageWrapper = styled.div`
  color: #1d2939;
  overflow: hidden;
  position: relative;

  &::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
        circle at 20% 80%,
        rgba(255, 56, 92, 0.03) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 20%,
        rgba(37, 99, 235, 0.03) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }
`;

const Section = styled.section`
  padding: clamp(4rem, 10vw, 8rem) clamp(1rem, 5vw, 4rem);
  background: ${(props) => props.$background || "transparent"};
  position: relative;
  z-index: 1;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: ${(props) => props.$columns || "1fr"};
  gap: ${(props) => props.$gap || "2rem"};
  align-items: ${(props) => props.$align || "start"};

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: ${(props) => props.$mobileGap || props.$gap || "3rem"};
  }
`;

const Content = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: ${(props) => props.$justify || "start"};
  gap: 1.5rem;
  text-align: ${(props) => props.$textAlign || "left"};
  position: relative;

  ${(props) =>
    props.$center &&
    `
    margin-left: auto;
    margin-right: auto;
    max-width: 700px;
  `}
`;

const Title = styled.h2`
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 800;
  line-height: 1.1;
  color: #1d2939;
  letter-spacing: -2px;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, #ff385c, #ff7171);
    border-radius: 2px;
  }

  ${(props) =>
    props.$center &&
    `
    text-align: center;
    &::after {
      left: 50%;
      transform: translateX(-50%);
    }
  `}
`;

const Subtitle = styled.p`
  font-size: clamp(1.1rem, 2vw, 1.25rem);
  color: #475467;
  line-height: 1.7;
  max-width: 60ch;
  margin: ${(props) => props.$center && "0 auto"};
  position: relative;
`;

const Text = styled.p`
  font-size: 1.125rem;
  color: #475467;
  line-height: 1.8;
`;

const AccentText = styled.span`
  background: linear-gradient(135deg, #ff385c 0%, #ff7171 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
`;

// --- HERO SECTION ---
const HeroSection = styled.section`
  min-height: 100vh;
  display: flex;
  padding: clamp(4rem, 10vw, 8rem) clamp(1rem, 5vw, 4rem);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -20%;
    width: 60%;
    height: 200%;
    background: linear-gradient(
      45deg,
      rgba(255, 56, 92, 0.05),
      rgba(37, 99, 235, 0.05)
    );
    border-radius: 50%;
    animation: ${float} 20s ease-in-out infinite;
    z-index: -1;
  }

  @media (max-width: 968px) {
    min-height: 90vh;
    flex-direction: column;
    text-align: center;
    gap: 4rem;
  }
`;

const HeroContent = styled(motion.div)`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  z-index: 2;

  @media (max-width: 968px) {
    align-items: center;
  }
`;

const HeroTitle = styled(motion.h1)`
  font-size: clamp(3.5rem, 8vw, 5.5rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -3px;
  max-width: 15ch;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: -20px;
    left: -20px;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #ff385c, #ff7171);
    border-radius: 50%;
    opacity: 0.8;
    animation: ${pulse} 3s ease-in-out infinite;
  }
`;

const HeroImageGrid = styled(motion.div)`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  position: relative;
  z-index: 1;

  &::after {
    content: "";
    position: absolute;
    top: 20%;
    left: 20%;
    right: 20%;
    bottom: 20%;
    background: linear-gradient(
      135deg,
      rgba(255, 56, 92, 0.1),
      rgba(37, 99, 235, 0.1)
    );
    border-radius: 2rem;
    z-index: -1;
    filter: blur(40px);
  }

  @media (max-width: 968px) {
    width: 100%;
  }
`;

const ImageWrapper = styled(motion.div)`
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5);
  position: relative;
  background: linear-gradient(135deg, #fff 0%, #f8f9fc 100%);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    z-index: 1;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    filter: saturate(1.1) contrast(1.1);
  }
`;

const Image1 = styled(ImageWrapper)`
  height: 450px;
  grid-column: 1 / 2;
  grid-row: 1 / 3;
`;

const Image2 = styled(ImageWrapper)`
  height: 250px;
  grid-column: 2 / 3;
  grid-row: 1 / 2;
`;

const Image3 = styled(ImageWrapper)`
  height: 180px;
  grid-column: 2 / 3;
  grid-row: 2 / 3;
`;

// --- VALUES SECTION ---
const ValueCard = styled(motion.div)`
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      transparent 0%,
      rgba(255, 56, 92, 0.02) 100%
    );
    opacity: 0;
    transition: opacity 0.4s ease;
  }
`;

const IconBox = styled.div`
  width: 4rem;
  height: 4rem;
  border-radius: 1rem;
  background: ${(props) => props.$bg};
  color: ${(props) => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);

  &::after {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    background: linear-gradient(
      135deg,
      ${(props) => props.$color}20,
      transparent
    );
    z-index: -1;
  }
`;

// --- ENHANCED STEP CARD ---
const StepCard = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  text-align: center;
  align-items: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, #ff385c, #ff7171, #2563eb);
    background-size: 200% 100%;
  }
`;

const StepNumber = styled.div`
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff385c 0%, #ff7171 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 800;
  box-shadow: 0 10px 25px rgba(255, 56, 92, 0.3);
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: -3px;
    border-radius: inherit;
    background: linear-gradient(135deg, #ff385c, #ff7171);
    z-index: -1;
    filter: blur(8px);
    opacity: 0.6;
  }
`;

// --- ENHANCED STATS ---
const StatsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 4rem;
`;

const StatItem = styled(motion.div)`
  padding: 3rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: all 0.4s ease;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 0deg,
      transparent,
      rgba(255, 56, 92, 0.1),
      transparent
    );
    animation: ${float} 6s linear infinite;
    z-index: -1;
  }
`;

const StatNumber = styled.p`
  font-size: clamp(3rem, 6vw, 4rem);
  font-weight: 900;
  background: linear-gradient(135deg, #ff385c 0%, #ff7171 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -2px;
`;

const StatLabel = styled.p`
  font-size: 1.25rem;
  color: #475467;
  margin-top: 1rem;
  font-weight: 600;
`;

// --- ENHANCED CTA SECTION ---
const CtaSection = styled(Section)`
  background: linear-gradient(135deg, #1d2939 0%, #2d3748 100%);
  color: #fff;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(255, 56, 92, 0.1) 0%,
      transparent 70%
    );
    animation: ${float} 15s ease-in-out infinite reverse;
  }
`;

const TestimonialCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(15px);
  padding: 3rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 56, 92, 0.05), transparent);
    z-index: -1;
  }
`;

const TestimonialText = styled.p`
  font-size: 1.375rem;
  font-style: italic;
  line-height: 1.8;
  color: #f0f2f5;
  margin-bottom: 2rem;
  position: relative;

  &::before {
    content: """;
    font-size: 5rem;
    color: #ff385c;
    position: absolute;
    margin-top: -2rem;
    margin-left: -3rem;
    opacity: 0.6;
    font-weight: 900;
  }
`;

const Button = styled(motion.a)`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 2.5rem;
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.75rem;
  text-decoration: none;
  font-size: 1.125rem;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
`;

// --- FLOATING ELEMENTS ---
const FloatingElement = styled(motion.div)`
  position: absolute;
  width: ${(props) => props.$size || "20px"};
  height: ${(props) => props.$size || "20px"};
  background: ${(props) => props.$color || "rgba(255, 56, 92, 0.1)"};
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
`;

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const AboutUs = () => {
  const values = [
    {
      icon: <Users size={28} />,
      title: "Bring people together",
      description:
        "We believe the best learning happens face-to-face. There's something magical about gathering around a pottery wheel or sharing stories over coffee while learning something new.",
      color: "#2563eb",
      background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    },
    {
      icon: <Heart size={28} />,
      title: "Celebrate what you love",
      description:
        "Everyone has something they're passionate about. We help people turn their weekday hobbies into weekend workshops, creating a win-win for teachers and students alike.",
      color: "#e11d48",
      background: "linear-gradient(135deg, #fff1f2 0%, #fce7f3 100%)",
    },
    {
      icon: <Shield size={28} />,
      title: "Keep everyone safe",
      description:
        "Trust is everything when you're meeting new people and trying new things. We handle the boring stuff, payments, reviews, so you can focus on having fun and learning.",
      color: "#7c3aed",
      background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    },
  ];

  return (
    <>
      <Header
        hamburgerColor="#000"
        dropdownButtonColor="#000"
        dropdownButtonHoverColor="#fe2142"
        dropdownButtonOutlineColor="#000"
        logoTitleColor="#fe2142"
      />
      <PageWrapper>
        {/* Floating Elements */}
        <FloatingElement
          $size="80px"
          $color="rgba(255, 56, 92, 0.05)"
          style={{ top: "10%", left: "5%" }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <FloatingElement
          $size="60px"
          $color="rgba(37, 99, 235, 0.05)"
          style={{ top: "60%", right: "8%" }}
          animate={{ y: [0, 15, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <FloatingElement
          $size="40px"
          $color="rgba(5, 150, 105, 0.05)"
          style={{ bottom: "20%", left: "10%" }}
          animate={{ y: [0, -25, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        <HeroSection>
          <HeroContent
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <motion.p
                style={{
                  fontSize: "1rem",
                  color: "#ff385c",
                  fontWeight: "600",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                About ClassEasily
              </motion.p>
            </motion.div>
            <HeroTitle variants={itemVariants}>
              Where neighbors become <AccentText>teachers</AccentText>.
            </HeroTitle>
            <motion.div variants={itemVariants}>
              <Subtitle>
                Remember when learning meant showing up somewhere and figuring
                it out together? We're bringing that back, one pottery class,
                one woodworking workshop, one cooking lesson at a time.
              </Subtitle>
            </motion.div>
          </HeroContent>
          <HeroImageGrid
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Image1 variants={itemVariants}>
              <img
                src="https://media.mcachicago.org/image/JZJXGJ17/original.jpg?auto=format&fit=crop&w=800&q=80"
                alt="Hands working on pottery wheel in a cozy workshop"
              />
            </Image1>
            <Image2 variants={itemVariants}>
              <img
                src="https://images.stockcake.com/public/6/5/4/6548b764-14da-4bc1-9adc-4190de4bce84_large/crafting-workshop-fun-stockcake.jpg"
                alt="People learning woodworking together in a bright workshop"
              />
            </Image2>
            <Image3 variants={itemVariants}>
              <img
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80"
                alt="Close-up of hands kneading bread in a cooking class"
              />
            </Image3>
          </HeroImageGrid>
        </HeroSection>

        <Section>
          <Container>
            <Grid $columns="1fr 1.2fr" $gap="6rem" $align="center">
              <motion.div
                initial={{ opacity: 0, x: -50, scale: 0.95 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <ImageWrapper style={{ height: "500px", position: "relative" }}>
                  <img
                    src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&w=800&q=80"
                    alt="Person sketching workshop ideas with coffee nearby"
                  />
                </ImageWrapper>
              </motion.div>
              <Content
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Title>How this all started</Title>
                <Text>
                  It was a simple Saturday afternoon problem: our close buddy
                  wanted to learn woodworking. Sounds easy, right? Wrong. He
                  spent hours scrolling through Facebook groups, checking
                  out-of-date Craigslist posts, and calling workshops that were
                  either booked solid or closed down months ago.
                </Text>
                <Text>
                  That frustration got us thinking, there are probably dozens of
                  skilled woodworkers in our city who'd love to teach, but they
                  have no easy way to reach these people. And there are
                  definitely people who want to learn but have no idea where to
                  find these hidden local experts.
                </Text>
                <Text>
                  ClassEasily started as the missing link between those two
                  groups. Now it's grown into something bigger: a way to
                  rediscover the joy of learning something with your hands,
                  meeting new people, and maybe finding your next weekend
                  obsession.
                </Text>
              </Content>
            </Grid>
          </Container>
        </Section>

        <Section $background="rgba(255, 255, 255, 0.3)">
          <Container>
            <Content $center $textAlign="center">
              <Title $center>How it actually works</Title>
              <Subtitle $center>
                No complicated sign-ups or confusing interfaces. Just three
                simple steps between you and your next favorite hobby.
              </Subtitle>
            </Content>
            <Grid
              $columns="repeat(3, 1fr)"
              $gap="2rem"
              style={{ marginTop: "4rem" }}
            >
              <StepCard
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <StepNumber>1</StepNumber>
                <IconBox
                  $bg="linear-gradient(135deg, #fff1f2, #fce7f3)"
                  $color="#e11d48"
                >
                  <SearchIcon size={32} />
                </IconBox>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#1d2939",
                    margin: "0.5rem 0",
                  }}
                >
                  Find something interesting
                </h3>
                <Text style={{ textAlign: "center", margin: 0 }}>
                  Browse workshops happening near you this weekend. Maybe it's
                  that pottery class you've been thinking about, or something
                  you never knew you wanted to try.
                </Text>
              </StepCard>
              <StepCard
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <StepNumber>2</StepNumber>
                <IconBox
                  $bg="linear-gradient(135deg, #fff1f2, #fce7f3)"
                  $color="#e11d48"
                >
                  <Users size={32} />
                </IconBox>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#1d2939",
                    margin: "0.5rem 0",
                  }}
                >
                  Book your spot
                </h3>
                <Text style={{ textAlign: "center", margin: 0 }}>
                  Click, pay, done. We handle all the boring payment stuff so
                  you can focus on getting excited about what you're going to
                  learn.
                </Text>
              </StepCard>
              <StepCard
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <StepNumber>3</StepNumber>
                <IconBox
                  $bg="linear-gradient(135deg, #ecfdf5, #d1fae5)"
                  $color="#059669"
                >
                  <Sparkles size={32} />
                </IconBox>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#1d2939",
                    margin: "0.5rem 0",
                  }}
                >
                  Show up and have fun
                </h3>
                <Text style={{ textAlign: "center", margin: 0 }}>
                  Walk in, meet some friendly faces, get your hands dirty, and
                  leave with something new, whether it's a skill, a project, or
                  just a great story.
                </Text>
              </StepCard>
            </Grid>
          </Container>
        </Section>

        <Section>
          <Container>
            <Content $center $textAlign="center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Title $center>What we actually care about</Title>
                <Subtitle $center>
                  These aren't just nice words on a website, they're the things
                  we think about when we make decisions.
                </Subtitle>
              </motion.div>
            </Content>
            <Grid
              as={motion.div}
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              $columns="repeat(auto-fit, minmax(300px, 1fr))"
              $gap="2rem"
              style={{ marginTop: "4rem" }}
            >
              {values.map((value, index) => (
                <ValueCard key={index} variants={itemVariants}>
                  <IconBox $bg={value.background} $color={value.color}>
                    {value.icon}
                  </IconBox>
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      color: "#1d2939",
                      margin: 0,
                    }}
                  >
                    {value.title}
                  </h3>
                  <Text
                    style={{ fontSize: "1.125rem", margin: 0, lineHeight: 1.7 }}
                  >
                    {value.description}
                  </Text>
                </ValueCard>
              ))}
            </Grid>
          </Container>
        </Section>

        <CtaSection>
          <Container>
            <Grid $columns="1.2fr 1fr" $gap="5rem" $align="center">
              <Content
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Title style={{ color: "#fff" }}>
                  Ready to try something new?
                </Title>
                <Text
                  style={{
                    color: "#d0d5dd",
                    marginBottom: "2rem",
                    fontSize: "1.25rem",
                  }}
                >
                  Whether you want to teach your favorite skill to others or
                  finally learn that thing you've been curious about, there's a
                  place for you here.
                </Text>
                <div
                  style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}
                >
                  <Button
                    href="/business"
                    $primary
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start teaching <ArrowUpRight size={20} />
                  </Button>
                  <Button
                    href="/explore"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Find a workshop <ArrowUpRight size={20} />
                  </Button>
                </div>
              </Content>
              <TestimonialCard
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <TestimonialText>
                  I used to post about my pottery classes on Instagram and hope
                  someone would see it. Now I spend my time actually teaching
                  instead of trying to figure out social media algorithms.
                </TestimonialText>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <motion.img
                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&h=100&q=80"
                    alt="Maria, local pottery instructor"
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "3px solid rgba(255, 255, 255, 0.2)",
                      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
                    }}
                    whileHover={{ scale: 1.1 }}
                  />
                  <div>
                    <p
                      style={{
                        fontWeight: 700,
                        margin: 0,
                        color: "#fff",
                        fontSize: "1.125rem",
                      }}
                    >
                      Maria
                    </p>
                    <p
                      style={{ margin: 0, color: "#d0d5dd", fontSize: "1rem" }}
                    >
                      Runs pottery workshops in her garage
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: "2px",
                        marginTop: "0.25rem",
                      }}
                    >
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill="#ff385c"
                          color="#ff385c"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </TestimonialCard>
            </Grid>
          </Container>
        </CtaSection>

        <Suspense fallback={<div style={{ minHeight: "300px" }} />}>
          <Footer />
        </Suspense>
      </PageWrapper>
    </>
  );
};

export default AboutUs;
