"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";
import LinkedinSvg from "@/assets/icons/homepage/linkedin.svg";
import FacebookSvg from "@/assets/icons/homepage/facebook.svg";

// Static data - no API calls needed
const popularLocationsByProvince = [
  {
    province: "Ontario",
    locations: [
      { name: "Toronto", path: "/explore/ontario/toronto" },
      { name: "Mississauga", path: "/explore/ontario/mississauga" },
      { name: "Ottawa", path: "/explore/ontario/ottawa" },
      { name: "Brampton", path: "/explore/ontario/brampton" },
      { name: "Hamilton", path: "/explore/ontario/hamilton" },
      { name: "Markham", path: "/explore/ontario/markham" },
    ],
  },
  {
    province: "British Columbia",
    locations: [
      { name: "Vancouver", path: "/explore/british-columbia/vancouver" },
      { name: "Surrey", path: "/explore/british-columbia/surrey" },
      { name: "Victoria", path: "/explore/british-columbia/victoria" },
    ],
  },
  {
    province: "Alberta",
    locations: [
      { name: "Calgary", path: "/explore/alberta/calgary" },
      { name: "Edmonton", path: "/explore/alberta/edmonton" },
    ],
  },
  {
    province: "Quebec",
    locations: [
      { name: "Montreal", path: "/explore/quebec/montreal" },
      { name: "Quebec City", path: "/explore/quebec/quebec-city" },
    ],
  },
];

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

const TabsContainer = styled.nav`
  display: flex;
  overflow-x: auto;
  gap: 1.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button`
  background: none;
  border: none;
  padding: 0.75rem 0;
  cursor: pointer;
  font-size: 0.9rem;
  color: ${({ $isActive }) => ($isActive ? "#fff" : "rgba(255,255,255,0.7)")};
  font-weight: ${({ $isActive }) => ($isActive ? "600" : "400")};
  position: relative;
  white-space: nowrap;
  transition: color 0.2s ease;

  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #fff;
    transform: ${({ $isActive }) => ($isActive ? "scaleX(1)" : "scaleX(0)")};
    transform-origin: center;
    transition: transform 0.3s ease;
  }

  &:hover {
    color: #fff;
  }
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
`;

const LocationList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const CategoryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const ItemLink = styled(Link)`
  text-decoration: none;
  color: rgba(255, 255, 255, 0.9);
  display: block;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 300;
  transition: all 0.2s ease;
  line-height: 1.4;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #fff;
    text-decoration: none;
    transform: translateX(2px);
  }
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
  @media (min-width: 768px) {
    justify-content: left;
  }
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-areas: "links" "apps" "social";
  gap: 2rem;
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
`;

const FooterLinkSection = styled.ol`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const LinkSectionWrapper = styled.div``;

const Social = styled.div`
  grid-area: social;
  @media (max-width: 767px) {
    text-align: center;
  }
`;

const Trademark = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  width: 100%;
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
  margin-left: 0.5rem;
  margin-top: 0;
  margin-bottom: 0;
`;

const StyledH2 = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.75rem;
  margin-top: 0;
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
  img {
    opacity: 0.8;
    transition: opacity 0.2s ease, transform 0.2s ease;
    &:hover {
      opacity: 1;
      transform: scale(1.1);
    }
    height: 32px;
    width: auto;
  }
`;

// --- MAIN COMPONENT ---
export default function FooterClient({ categories = [] }) {
  const [activeTab, setActiveTab] = useState("locations");
  const [showAll, setShowAll] = useState(false);

  // Only show categories tab if we have categories
  const hasCategories = categories.length > 0;

  const TABS = hasCategories
    ? [
        { key: "locations", name: "Locations" },
        { key: "categories", name: "Categories" },
      ]
    : [{ key: "locations", name: "Locations" }];

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    setShowAll(false);
  };

  const getDisplayData = () => {
    if (activeTab === "locations") {
      return popularLocationsByProvince;
    }
    if (activeTab === "categories" && hasCategories) {
      return categories.map((category) => ({
        province: category.name,
        key: category.key,
        type: "category",
        locations: [
          {
            name: `All ${category.name}`,
            path: `/explore/category/${category.key}`,
            isMainCategory: true,
          },
          ...(category.subcategories || []).map((sub) => ({
            name: sub.name,
            path: `/explore/category/${category.key}/${sub.key}`,
            isMainCategory: false,
          })),
        ],
      }));
    }
    return [];
  };

  const displayData = getDisplayData();
  const itemsToShow = showAll ? displayData : displayData.slice(0, 8);

  return (
    <FooterWrapper>
      <InspirationContainer>
        <InspirationHeader>Find your next class</InspirationHeader>

        {/* Only show tabs if there's more than one tab */}
        {TABS.length > 1 && (
          <TabsContainer>
            {TABS.map((tab) => (
              <TabButton
                key={tab.key}
                $isActive={activeTab === tab.key}
                onClick={() => handleTabClick(tab.key)}
              >
                {tab.name}
              </TabButton>
            ))}
          </TabsContainer>
        )}

        <ContentGrid>
          {itemsToShow.map((section, index) => (
            <LinkSection key={`${section.province}-${index}`}>
              <SectionTitle>{section.province}</SectionTitle>
              {activeTab === "locations" ? (
                <LocationList>
                  {section.locations.map((item) => (
                    <li key={item.name}>
                      <ItemLink href={item.path}>
                        Classes in {item.name}
                      </ItemLink>
                    </li>
                  ))}
                </LocationList>
              ) : (
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
              )}
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
                      <Link href="/about-us">About us</Link>
                    </StyledP>
                  </li>
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
                <a href="#" aria-label="Follow us on LinkedIn">
                  <Image
                    src={LinkedinSvg}
                    alt="LinkedIn"
                    style={{ height: "32px", width: "auto" }}
                  />
                </a>
                <a href="#" aria-label="Follow us on Facebook">
                  <Image
                    src={FacebookSvg}
                    alt="Facebook"
                    style={{ height: "32px", width: "auto" }}
                  />
                </a>
              </SocialLinks>
            </Social>
          </FooterGrid>
          <Trademark>
            <StyledP>© 2025 Classeasily. All rights reserved.</StyledP>
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
