"use client";

import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronRight, ArrowRight } from "lucide-react";
import Footer from "@/components/homepage/Footer";
import Header from "@/components/header/Header";
import Link from "next/link";

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: -6rem;
  overflow: hidden;
`;

const HeroSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 600px;
  padding: 60px 24px;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=90");
    background-size: cover;
    background-position: center;
    z-index: -2;
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: -1;
  }
`;

const WaveTransition = styled.div`
  position: absolute;
  bottom: -2px;
  transform: rotate(180deg);
  left: 0;
  width: 100%;
  overflow: hidden;
  line-height: 0;

  svg {
    position: relative;
    display: block;
    width: calc(100% + 1.3px);
    height: 70px;
    transform: rotateY(180deg);
  }

  .shape-fill {
    fill: #ffffff;
  }
`;

const HeroTitle = styled.h1`
  font-size: 56px;
  font-weight: 800;
  color: white;
  margin: 0 0 24px;
  max-width: 800px;
  line-height: 1.2;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 40px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 24px;
  color: rgba(255, 255, 255, 0.9);
  max-width: 600px;
  margin: 0 0 40px;
  line-height: 1.4;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const Button = styled(motion.button)`
  background: ${(props) => (props.$secondary ? "transparent" : "white")};
  color: ${(props) => (props.$secondary ? "white" : "#7d1414")};
  padding: 16px 32px;
  border: ${(props) => (props.$secondary ? "2px solid white" : "none")};
  border-radius: 30px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const Section = styled.section`
  padding: 120px 24px;
  position: relative;

  @media (max-width: 768px) {
    padding: 80px 24px;
  }
`;

const Container = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
`;

const MissionSection = styled(Section)`
  background: linear-gradient(180deg, #fff 0%, #f8f8f8 100%);
`;

const MissionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

const MissionImage = styled.img`
  width: 100%;
  height: 500px;
  object-fit: cover;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    height: 300px;
  }
`;

const MissionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 40px;
  font-weight: 700;
  color: #222;
  margin: 0;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const SectionText = styled.p`
  font-size: 18px;
  line-height: 1.6;
  color: #555;
  margin: 0;
`;

const ValuesSection = styled.section`
  background: white;
  padding: 120px 0 0 0;
  margin: 0 -24px;
  border-top: 1px solid #f0f0f0;
`;

const ValueBlock = styled.div`
  display: flex;
  align-items: center;
  min-height: 600px;
  position: relative;

  &:nth-child(even) {
    flex-direction: row-reverse;
  }

  @media (max-width: 1024px) {
    flex-direction: column !important;
    min-height: auto;
  }
`;

const ValueImage = styled.div`
  flex: 1;
  height: 600px;
  border-radius: 20px;
  background-image: url(${(props) => props.src});
  background-size: cover;
  background-position: center;
  position: relative;

  @media (max-width: 1024px) {
    width: 100%;
    height: 400px;
  }
`;

const ValueContent = styled.div`
  flex: 1;
  padding: 80px;
  background: ${(props) => props.background || "#f8f8f8"};
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;

  @media (max-width: 1024px) {
    padding: 60px 24px;
  }
`;

const ValueTag = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #7d1414;
  text-transform: uppercase;
  letter-spacing: 1.5px;
`;

const ValueTitle = styled.h3`
  font-size: 36px;
  font-weight: 700;
  color: #222;
  margin: 0;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const LinkWithArrow = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #7d1414;
  font-weight: 600;
  text-decoration: none;
  transition: gap 0.3s ease;

  &:hover {
    gap: 12px;
  }
`;

const DisclaimerSection = styled.section`
  margin-top: 80px;
  background: #fff;
  padding: 20px 24px;
  text-align: center;
`;

const DisclaimerContainer = styled.div`
  max-width: 1440px;
  margin: 0 auto;
`;

const DisclaimerText = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #666;
  margin: 0;
`;

export default function CareersPage() {
  const router = useRouter();

  const values = [
    {
      tag: "Our Impact",
      title: "Transforming lives through accessible education",
      description:
        "Every decision we make is guided by our mission to democratize education. We're building tools that make learning more accessible, engaging, and effective for everyone, everywhere.",
      image:
        "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      background: "#fff",
    },
    {
      tag: "Our Community",
      title: "Building connections that matter",
      description:
        "We believe that the best learning happens when passionate instructors connect with eager students. Our platform is more than just a marketplace—it's a thriving community where meaningful relationships are formed.",
      image:
        "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      background: "#fff",
    },
    {
      tag: "Our Growth",
      title: "Never stop learning",
      description:
        "As educators at heart, we practice what we preach. Every team member is encouraged to be curious, take risks, and grow both personally and professionally. We invest heavily in our team's development.",
      image:
        "https://images.unsplash.com/photo-1542744094-24638eff58bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      background: "#fff",
    },
  ];

  return (
    <>
      <Header />
      <PageWrapper>
        <HeroSection>
          <HeroTitle>Join us in transforming education</HeroTitle>
          <HeroSubtitle>
            Help us build the future of learning by connecting passionate
            instructors with eager students worldwide.
          </HeroSubtitle>
          <Button
            whileHover={{ scale: 1.02 }}
            onClick={() => router.push("/careers/positions")}
          >
            View open positions <ChevronRight size={20} />
          </Button>
          <WaveTransition>
            <svg
              data-name="Layer 1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                className="shape-fill"
              ></path>
            </svg>
          </WaveTransition>
        </HeroSection>

        <MissionSection>
          <Container>
            <MissionGrid>
              <MissionImage
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Team collaboration"
              />
              <MissionContent>
                <SectionTitle>
                  Our mission is to make learning accessible to everyone
                </SectionTitle>
                <SectionText>
                  At ClassEasily, we're building a platform that connects
                  passionate instructors with eager learners, creating a
                  community where skills and knowledge can be shared seamlessly.
                  We believe in the power of education to transform lives.
                </SectionText>
                <Button $secondary whileHover={{ scale: 1.02 }}>
                  Learn about our culture <ArrowRight size={20} />
                </Button>
              </MissionContent>
            </MissionGrid>
          </Container>
        </MissionSection>

        <ValuesSection>
          {values.map((value, index) => (
            <ValueBlock key={index}>
              <ValueImage src={value.image} />
              <ValueContent background={value.background}>
                <ValueTag>{value.tag}</ValueTag>
                <ValueTitle>{value.title}</ValueTitle>
                <SectionText>{value.description}</SectionText>
                <LinkWithArrow href="#">
                  Learn more <ChevronRight size={16} />
                </LinkWithArrow>
              </ValueContent>
            </ValueBlock>
          ))}
        </ValuesSection>

        <DisclaimerSection>
          <DisclaimerContainer>
            <DisclaimerText>
              ClassEasily is an equal opportunity employer. We celebrate
              diversity and are committed to creating an inclusive environment
              for all employees. All qualified applicants will receive
              consideration for employment without regard to race, color,
              religion, gender, gender identity or expression, sexual
              orientation, national origin, genetics, disability, age, or
              veteran status. Our hiring decisions are based solely on
              qualifications, merit, and business needs.
            </DisclaimerText>
          </DisclaimerContainer>
        </DisclaimerSection>

        <Footer />
      </PageWrapper>
    </>
  );
}
