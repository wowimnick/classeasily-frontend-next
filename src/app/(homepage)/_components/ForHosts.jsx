"use client";

import React from "react";
import styled from "styled-components";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

// --- Styled Components ---

const Section = styled.section`
  padding: 4rem clamp(1rem, 5vw, 5rem);
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: #ffffff;
  overflow-x: clip;
  overflow-y: visible;

  @media (max-width: 992px) {
    padding: 4rem 1rem;
    overflow: visible;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  align-items: center;

  @media (max-width: 992px) {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    align-items: center;
  }
`;

const TextContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
  z-index: 2;
  padding-left: 3rem;

  @media (max-width: 992px) {
    align-items: center;
    text-align: center;
    order: 3;
    width: 100%;
    padding-right: 0;
  }
`;

const Heading = styled.h2`
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 600;
  color: #111;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;

  span {
    color: #f81e3e;
  }

  @media (max-width: 992px) {
    display: none;
  }
`;

const MobileHeading = styled.h2`
  display: none;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 600;
  color: #111;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
  text-align: center;
  order: 1;

  span {
    color: #f81e3e;
  }

  @media (max-width: 992px) {
    display: block;
    align-self: stretch;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
`;

const SubText = styled.p`
  font-size: 1.125rem;
  line-height: 1.6;
  color: #000;
  margin: 0;
  max-width: 480px;

  @media (max-width: 992px) {
    font-size: 1rem;
  }
`;

const CtaLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2.5rem;
  height: auto;
  line-height: 1.5;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: #f81e3e;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: #e01a38;
    color: #fff;
  }
`;

const VisualWrapper = styled.div`
  position: relative;
  width: calc(100% + 15vw);
  min-height: 300px;
  margin-left: -18vw;
  display: flex;
  align-items: center;
  justify-content: flex-start;

  @media (max-width: 992px) {
    width: 100%;
    margin-left: 0;
    min-height: 280px;
    order: 2;
    margin-bottom: 1rem;
  }

  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

// --- Diagonal Divider (same as business landing page) ---
const DiagonalDivider = ({ fromBg = "#ffffff", toBg = "#ffffff", flip = false }) => (
  <div style={{ lineHeight: 0, background: toBg, display: "block", overflow: "hidden", position: "relative", zIndex: 1 }}>
    <svg
      viewBox="0 0 1440 44"
      preserveAspectRatio="none"
      width="100%"
      height="44"
      style={{ display: "block", transform: flip ? "scaleX(-1)" : "none" }}
    >
      <path d="M0,0 L1440,0 L0,44 Z" fill={fromBg} />
      <line x1="0" y1="0" x2="1440" y2="44" stroke="rgba(248,30,62,0.10)" strokeWidth="1.5" />
    </svg>
  </div>
);

// --- Main Component ---

const ForHosts = () => {
  return (
    <>
      <Section aria-labelledby="for-hosts-title">
        <Container>
          {/* Mobile Title */}
          <MobileHeading>
            Turn your passion into <br />
            <span>predictable revenue.</span>
          </MobileHeading>

          {/* Text Content — first column on desktop */}
          <TextContent>
            <Heading id="for-hosts-title">
              Turn your passion into <br />
              predictable revenue.
            </Heading>

            <SubText data-nosnippet>
              Expand your reach by tapping into our community of experience
              seekers. We'll handle the bookings, payments, and admin - you focus
              on what you do best.
            </SubText>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <CtaLink href="/business">
                Start Hosting <ArrowRight size={18} />
              </CtaLink>
            </div>
          </TextContent>

          {/* Hero image — same as business landing page, overlaps left column */}
          <VisualWrapper>
            <Image
              src="/Frame 1597880366.webp"
              alt="Host Dashboard Preview"
              width={900}
              height={1100}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </VisualWrapper>
        </Container>
      </Section>
      <DiagonalDivider fromBg="#ffffff" toBg="#ffffff" />
    </>
  );
};

export default ForHosts;
