// components/homepage/ForHosts.jsx
"use client";

import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button as AntButton } from "antd";
import Image from "next/image";

const MainWrapper = styled.section`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  background-color: #ffecee;
  border-radius: 1.5rem;
  overflow: hidden;
  margin: 4rem auto;
  width: 100%;
  max-width: 1200px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  gap: 3rem;

  @media (max-width: 992px) {
    flex-direction: column;
    align-items: center;
    border-radius: 0;
    gap: 2rem;
    margin: 0;
  }
`;

const LeftWrapper = styled.div`
  flex: 1 1 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;

  div {
    width: 100%;
    height: 100%;
    aspect-ratio: 4 / 3;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
    position: relative;
  }

  @media (max-width: 992px) {
    flex-basis: auto;
    width: 100%;
    max-width: 500px;
    div {
      max-height: 350px;
    }
  }
`;

const RightWrapper = styled.div`
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  min-width: 0;
  gap: 1.5rem;
  padding: 1rem;

  @media (max-width: 992px) {
    flex-basis: auto;
    width: 100%;
    align-items: center;
    text-align: center;
    padding: 1rem 0;
  }
`;

const StyledH2 = styled.h2`
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 700;
  line-height: 1.3;
  margin: 0;
`;

const StyledP = styled.p`
  color: #666;
  font-weight: 400;
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  line-height: 1.6;
  margin: 0;
  max-width: 450px;

  @media (max-width: 992px) {
    max-width: 90%;
  }
`;

const artistImage = "https://i.imgur.com/uTOxLfS.png";

const ForHosts = () => {
  return (
    <MainWrapper aria-labelledby="for-hosts-title">
      <LeftWrapper>
        <div>
          <Image
            src={artistImage}
            alt="Artist teaching a class"
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 992px) 100vw, 50vw"
            priority={false}
          />
        </div>
      </LeftWrapper>

      <RightWrapper>
        <StyledH2 id="for-hosts-title">
          Host your own class on Classeasily
        </StyledH2>
        <StyledP>
          Expand your reach by tapping into our community of curious learners
          and local businesses. We'll handle the bookings, payments, and admin —
          you focus on what you do best.
        </StyledP>

        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{ display: "inline-block" }}
        >
          <Link href="/business" passHref legacyBehavior>
            <AntButton
              type="primary"
              size="large"
              style={{
                padding: "1rem 2.5rem",
                height: "auto",
                lineHeight: "1.5",
              }}
            >
              Try Hosting
            </AntButton>
          </Link>
        </motion.div>
      </RightWrapper>
    </MainWrapper>
  );
};

export default ForHosts;
