// components/homepage/FooterClient.jsx
"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import styled, { keyframes } from "styled-components";

const LogoIcon = dynamic(() => import("@/components/common/logoIcon"), { ssr: false });

// Instagram icon with brand gradient
const InstagramGradientIcon = ({ size = 22, style, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block", ...style }}
    {...props}
  >
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <path
      fill="url(#ig-grad)"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
    />
  </svg>
);

const FacebookIcon = ({ size = 22, style, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block", ...style }}
    {...props}
  >
    <path
      fill="#1877F2"
      d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z"
    />
  </svg>
);

// --- STYLED COMPONENTS ---

const FooterWrapper = styled.div`
  width: 100%;
  background: #fff;
  padding: 0 0.75rem;

  @media (min-width: 480px) {
    padding: 0 1.25rem;
  }

  @media (min-width: 768px) {
    padding: 0 2.5rem;
  }
`;

// Main footer box
const FooterBox = styled.footer`
  position: relative;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 2rem 1.25rem 1.75rem;
  margin-bottom: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);

  @media (min-width: 480px) {
    padding: 2.25rem 1.75rem 1.75rem;
    border-radius: 22px;
  }

  @media (min-width: 768px) {
    padding: 3.5rem 3.5rem 2.25rem;
    border-radius: 24px;
    margin-bottom: 1rem;
  }
`;

/* Breaks out of FooterWrapper padding so the big text is full-width and not constrained by it */
const WatermarkSection = styled.div`
  margin-left: -0.75rem;
  margin-right: -0.75rem;
  width: calc(100% + 1.5rem);
  overflow: hidden;
  position: relative;
  padding-bottom: 2.5rem;
  text-align: center;

  @media (min-width: 480px) {
    margin-left: -1.25rem;
    margin-right: -1.25rem;
    width: calc(100% + 2.5rem);
  }

  @media (min-width: 768px) {
    margin-left: -2.5rem;
    margin-right: -2.5rem;
    width: calc(100% + 5rem);
    padding-bottom: 0rem;
  }
`;

const Watermark = styled.span`
  display: inline-block;
  font-size: clamp(120px, 18vw, 220px);
  font-weight: 900;
  line-height: 1;
  user-select: none;
  pointer-events: none;
  letter-spacing: -0.04em;
  white-space: nowrap;
  background: linear-gradient(to bottom, #f3f4f6 0%, rgba(243, 244, 246, 0.4) 60%, #fff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: -15vh;
`;

const FooterTop = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 2fr 3fr;
    gap: 3rem 4rem;
  }

  @media (min-width: 1024px) {
    grid-template-columns: 2.2fr 3fr;
  }
`;

// Brand column
const BrandCol = styled.div`
  display: flex;
  flex-direction: column;
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    margin-bottom: 1.25rem;
  }
`;

const LogoIconWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
`;

const LogoName = styled.span`
  font-size: 1.15rem;
  font-weight: 700;
  color: #111;
  letter-spacing: -0.01em;
`;

const BrandDesc = styled.p`
  font-size: 13px;
  color: #6b7280;
  line-height: 1.65;
  margin: 0 0 1.5rem;
  max-width: 100%;

  @media (min-width: 768px) {
    max-width: 280px;
    margin-bottom: 2rem;
  }
`;

const BrandBottomRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  @media (min-width: 768px) {
    justify-content: flex-start;
  }
`;

const SocialRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;

  a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid #e5e7eb;
    transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;

    /* Larger tap target on mobile */
    @media (max-width: 767px) {
      width: 42px;
      height: 42px;
    }

    &:hover {
      border-color: #c81e1e;
      background: rgba(200, 30, 30, 0.05);
      transform: translateY(-2px);
    }
  }
`;

// Nav columns
const NavGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.75rem 1rem;

  @media (max-width: 359px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem 1rem;
  }
`;

const NavCol = styled.div``;

const NavTitle = styled.h3`
  font-size: 0.75rem;
  font-weight: 700;
  color: #111;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 0.9rem;

  @media (min-width: 768px) {
    font-size: 0.8rem;
    margin-bottom: 1.1rem;
  }
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  @media (min-width: 768px) {
    gap: 0.7rem;
  }
`;

const NavLink = styled(Link)`
  font-size: 13px;
  color: #6b7280;
  text-decoration: none;
  font-weight: 400;
  transition: color 0.15s ease;
  /* Better tap target */
  display: inline-block;
  padding: 0.1rem 0;

  &:hover {
    color: #c81e1e;
  }
`;

const NavLinkA = styled.a`
  font-size: 13px;
  color: #6b7280;
  text-decoration: none;
  font-weight: 400;
  transition: color 0.15s ease;
  display: inline-block;
  padding: 0.1rem 0;

  &:hover {
    color: #c81e1e;
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 2rem 0 1.25rem;

  @media (min-width: 768px) {
    margin: 2.75rem 0 1.5rem;
  }
`;

const FooterBottom = styled.div`
  display: flex;
  flex-direction: column;
  gap: 13px;
  align-items: flex-start;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
`;

const Copyright = styled.p`
  font-size: 0.775rem;
  color: #9ca3af;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 0.8rem;
  }
`;

const LegalLinks = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  @media (min-width: 768px) {
    gap: 1.25rem;
  }
`;

const LegalLink = styled(Link)`
  font-size: 0.775rem;
  color: #9ca3af;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
  /* Comfortable tap target */
  padding: 0.1rem 0;

  @media (min-width: 768px) {
    font-size: 0.8rem;
  }

  &:hover {
    color: #c81e1e;
  }
`;

// --- MAIN COMPONENT ---
export default function FooterClient({ collections = [] }) {
  return (
    <FooterWrapper>
      {/* Main Footer */}
      <FooterBox>
        <FooterTop>
          {/* Brand */}
          <BrandCol>
            <LogoRow>
              <LogoIconWrap>
                <LogoIcon size={32} restingColor="#111827" activeColor="#111827" />
              </LogoIconWrap>
              <LogoName>ClassEasily</LogoName>
            </LogoRow>
            <BrandDesc>
              ClassEasily is booking and CRM software for small businesses — easy to set up, priced for small teams.
            </BrandDesc>
            <BrandBottomRow>
              <SocialRow>
                <a
                  href="https://www.instagram.com/tryclasseasily/"
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InstagramGradientIcon size={18} />
                </a>
                <a
                  href="https://www.facebook.com/p/ClassEasily-61577902526917/"
                  aria-label="Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FacebookIcon size={18} />
                </a>
              </SocialRow>
            </BrandBottomRow>
          </BrandCol>

          {/* Nav columns */}
          <NavGrid>
            <NavCol>
              <NavTitle>ClassEasily</NavTitle>
              <NavList>
                <li><NavLink href="/blog">Our Blog</NavLink></li>
                <li><NavLink href="/about">About</NavLink></li>
                <li><NavLink href="/pricing">Pricing</NavLink></li>
                <li><NavLink href="/content-policy">Content Policy</NavLink></li>
              </NavList>
            </NavCol>

            <NavCol>
              <NavTitle>Businesses</NavTitle>
              <NavList>
                <li><NavLink href="/#features">Product</NavLink></li>
                <li><NavLink href="/business/register">Get started</NavLink></li>
                <li><NavLink href="/business/help/">Business Help</NavLink></li>
                <li><NavLink href="/business/register">Registration</NavLink></li>
              </NavList>
            </NavCol>

            <NavCol>
              <NavTitle>Support</NavTitle>
              <NavList>
                <li><NavLink href="/my-tickets">Contact us</NavLink></li>
                <li><NavLink href="/fees">Fees & Charges</NavLink></li>
                <li><NavLink href="/terms-of-service">Trust & Safety</NavLink></li>
                <li><NavLink href="/copyright-policy">Copyright Policy</NavLink></li>
              </NavList>
            </NavCol>
          </NavGrid>
        </FooterTop>

        <Divider />

        <FooterBottom>
          <Copyright>© 2026 ClassEasily. All rights reserved.</Copyright>
          <LegalLinks>
            <LegalLink href="/terms-of-service">Terms of Service</LegalLink>
            <LegalLink href="/privacy-policy">Privacy Policy</LegalLink>
            <LegalLink href="/cookie-policy">Cookie Policy</LegalLink>
          </LegalLinks>
        </FooterBottom>
      </FooterBox>

      {/* Big classeasily text below footer with gap, white → transparent, ~1/3 below viewport */}
      <WatermarkSection>
        <Watermark>ClassEasily</Watermark>
      </WatermarkSection>
    </FooterWrapper>
  );
}