// components/homepage/FooterClient.jsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import styled from "styled-components";

// Instagram icon with brand gradient (matches colored Facebook logo)
const InstagramGradientIcon = ({ size = 32, style, ...props }) => (
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
      <linearGradient
        id="instagram-gradient-footer"
        x1="0%"
        y1="100%"
        x2="100%"
        y2="0%"
      >
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <path
      fill="url(#instagram-gradient-footer)"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
    />
  </svg>
);

// Facebook icon - brand blue, no import
const FacebookIcon = ({ size = 32, style, ...props }) => (
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

const InspirationContainer = styled.section`
  background-color: rgb(138, 26, 28);
  padding: 3rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;

  @media (min-width: 768px) {
    padding: 3rem;
  }
  @media (min-width: 1024px) {
    padding: 4rem 5rem;
  }
`;

const InspirationHeader = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: #fff;
`;

const ContentGrid = styled.div`
  display: grid;
  gap: 2rem 1.5rem;
  @media (max-width: 767px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 768px) and (max-width: 1023px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const LinkSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  @media (max-width: 767px) {
    text-align: center;
  }
`;

const CategoryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const CategoryLink = styled(Link)`
  text-decoration: none;
  display: block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: ${(props) => (props.$isMainCategory ? "500" : "300")};
  color: ${(props) =>
    props.$isMainCategory
      ? "rgba(255, 255, 255, 0.95)"
      : "rgba(255, 255, 255, 0.8)"};
  transition: all 0.2s ease;
  line-height: 1.3;
  margin-left: ${(props) => (props.$isMainCategory ? "0" : "0.5rem")};
  position: relative;

  ${(props) =>
    props.$isMainCategory &&
    `
    &:before {
      content: '';
      position: absolute;
      left: -0.5rem;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 12px;
      background-color: rgba(255, 255, 255, 0.4);
      border-radius: 2px;
    }
  `}

  &:hover {
    background-color: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.95);
    text-decoration: none;
    transform: translateX(2px);
    ${(props) =>
      props.$isMainCategory &&
      `
      &:before {
        background-color: rgba(255, 255, 255, 0.7);
      }
    `}
  }
`;

const ShowMoreContainer = styled.div`
  margin-top: 2.5rem;
`;

const ShowMoreButton = styled.button`
  background: none;
  border: none;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  color: #fff;
`;

const FooterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const MainFooterStyle = styled.footer`
  display: flex;
  flex-direction: column;
  background-color: rgb(158, 36, 38);
  color: #fff;
`;

const MainFooterContainer = styled.div`
  padding: 2.5rem 1.5rem;
  @media (min-width: 768px) {
    padding: 2.5rem 3rem;
  }
  @media (min-width: 1024px) {
    padding: 2.5rem 6rem;
  }
`;

const LogoWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
  @media (max-width: 767px) {
    margin-bottom: 1.75rem;
  }
  @media (min-width: 768px) {
    justify-content: left;
  }
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-areas: "links" "social";
  gap: 2rem;
  @media (max-width: 767px) {
    gap: 2.25rem;
    text-align: center;
  }
  @media (min-width: 768px) {
    grid-template-areas: "links links apps" "links links social";
    grid-template-columns: 2fr 2fr 1fr;
    gap: 2rem 3rem;
  }
  @media (min-width: 1024px) {
    grid-template-areas: "links apps social";
    grid-template-columns: 3fr 1fr 1fr;
  }
`;

const AllLinks = styled.div`
  grid-area: links;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1.5rem;
  @media (max-width: 767px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.75rem 2rem;
    justify-items: center;
    max-width: 320px;
    margin: 0 auto;
  }
`;

const FooterLinkSection = styled.ol`
  list-style-type: none;
  padding: 0;
  margin: 0;
  @media (max-width: 767px) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
`;

const LinkSectionWrapper = styled.div`
  @media (max-width: 767px) {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`;

const Social = styled.div`
  grid-area: social;
  @media (max-width: 767px) {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
`;

const Trademark = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  width: 100%;
  @media (max-width: 767px) {
    margin-top: 2.25rem;
    padding-top: 1.75rem;
    gap: 0.5rem;
  }
  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
`;

const StyledH1 = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  margin-top: 0;
  margin-bottom: 0;
`;

const StyledH2 = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.75rem;
  margin-top: 0;
  @media (max-width: 767px) {
    text-align: center;
  }
`;

const StyledP = styled.p`
  font-size: 0.94rem;
  margin: 0.5rem 0;
  font-weight: 300;
  color: #fff;

  a {
    text-decoration: none;
    color: #fff;
    transition: text-decoration 0.2s ease;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  img,
  a svg {
    opacity: 0.8;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
    height: 32px;
    width: auto;
  }
  a:hover img,
  a:hover svg {
    opacity: 1;
    transform: scale(1.1);
  }
`;

// --- MAIN COMPONENT ---
export default function FooterClient({ collections = [] }) {
  const [showAll, setShowAll] = useState(false);
  const hasCollections = collections.length > 0;

  const getDisplayData = () => {
    if (!hasCollections) return [];
    return collections.map((collection) => ({
      province: collection.name,
      key: collection.slug || collection.key,
      type: "collection",
      locations: [
        {
          name: `All ${collection.name}`,
          path: `/explore?collection=${collection.slug || collection.key}`,
          isMainCategory: true,
        },
      ],
    }));
  };

  const displayData = getDisplayData();
  const itemsToShow = showAll ? displayData : displayData.slice(0, 8);

  return (
    <FooterWrapper>
      {hasCollections && (
        <InspirationContainer>
          <InspirationHeader>Find your next experience</InspirationHeader>

          <ContentGrid>
            {itemsToShow.map((section, index) => (
              <LinkSection key={`${section.province}-${index}`}>
                <SectionTitle>{section.province}</SectionTitle>
                <CategoryList>
                  {section.locations.map((item) => (
                    <li key={item.name}>
                      <CategoryLink
                        href={item.path}
                        $isMainCategory={item.isMainCategory}
                      >
                        {item.name}
                      </CategoryLink>
                    </li>
                  ))}
                </CategoryList>
              </LinkSection>
            ))}
          </ContentGrid>

          {displayData.length > 8 && (
            <ShowMoreContainer>
              <ShowMoreButton onClick={() => setShowAll(!showAll)}>
                {showAll ? "Show less" : "Show more"}
              </ShowMoreButton>
            </ShowMoreContainer>
          )}
        </InspirationContainer>
      )}

      <MainFooterStyle>
        <MainFooterContainer>
          <LogoWrapper>
            <StyledH1>classeasily</StyledH1>
          </LogoWrapper>
          <FooterGrid>
            <AllLinks>
              <LinkSectionWrapper>
                <StyledH2>Classeasily</StyledH2>
                <FooterLinkSection>
                  <li>
                    <StyledP>
                      <Link href="/blog">Our Blog</Link>
                    </StyledP>
                  </li>
                  <li>
                    <StyledP>
                      <Link href="/explore">Explore Classes</Link>
                    </StyledP>
                  </li>
                  <li>
                    <StyledP>
                      <Link href="/content-policy">Content Policy</Link>
                    </StyledP>
                  </li>
                </FooterLinkSection>
              </LinkSectionWrapper>

              <LinkSectionWrapper>
                <StyledH2>Businesses</StyledH2>
                <FooterLinkSection>
                  <li>
                    <StyledP>
                      <Link href="/business">Become a Host</Link>
                    </StyledP>
                  </li>
                  <li>
                    <StyledP>
                      <Link href="/business/help/">Business Help</Link>
                    </StyledP>
                  </li>
                  <li>
                    <StyledP>
                      <Link href="/business/register">
                        Business Registration
                      </Link>
                    </StyledP>
                  </li>
                </FooterLinkSection>
              </LinkSectionWrapper>

              <LinkSectionWrapper>
                <StyledH2>Support</StyledH2>
                <FooterLinkSection>
                  <li>
                    <StyledP>
                      <a href="mailto:support@classeasily.com">Email Support</a>
                    </StyledP>
                  </li>
                  <li>
                    <StyledP>
                      <Link href="/my-tickets">Help Center & My Tickets</Link>
                    </StyledP>
                  </li>
                  <li>
                    <StyledP>
                      <Link href="/my-tickets">Customer Support</Link>
                    </StyledP>
                  </li>
                  <li>
                    <StyledP>
                      <Link href="/fees">Fees and Charges</Link>
                    </StyledP>
                  </li>
                  <li>
                    <StyledP>
                      <Link href="/terms-of-service">Trust & Safety</Link>
                    </StyledP>
                  </li>
                  <li>
                    <StyledP>
                      <Link href="/copyright-policy">Copyright Policy</Link>
                    </StyledP>
                  </li>
                </FooterLinkSection>
              </LinkSectionWrapper>
            </AllLinks>

            <Social>
              <StyledH2>Follow us</StyledH2>
              <SocialLinks>
                <a
                  href="https://www.instagram.com/tryclasseasily/"
                  aria-label="Follow us on Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InstagramGradientIcon size={32} aria-hidden />
                </a>
                <a
                  href="https://www.facebook.com/p/ClassEasily-61577902526917/"
                  aria-label="Follow us on Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FacebookIcon size={32} aria-hidden />
                </a>
              </SocialLinks>
            </Social>
          </FooterGrid>
          <Trademark>
            <StyledP>© 2026 Classeasily. All rights reserved.</StyledP>
            <StyledP>
              <Link href="/terms-of-service">Terms of Service</Link> |{" "}
              <Link href="/privacy-policy">Privacy Policy</Link> |{" "}
              <Link href="/cookie-policy">Cookie Policy</Link>
            </StyledP>
          </Trademark>
        </MainFooterContainer>
      </MainFooterStyle>
    </FooterWrapper>
  );
}
