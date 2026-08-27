"use client";

import { Suspense } from "react";
import Link from "next/link";
import styled from "styled-components";
import dynamic from "next/dynamic";
import { marketingTheme as t, SUPPORT_EMAIL, REGISTER_HREF, PRICING_HREF } from "./tokens";
import CopyrightYear from "./CopyrightYear";

const LogoIcon = dynamic(() => import("@/components/common/logoIcon"), {
  ssr: false,
});

const Wrap = styled.footer`
  background: ${t.colors.dark};
  color: #c9d4e0;
  padding: 56px 24px 28px;
`;

const Inner = styled.div`
  max-width: 1120px;
  margin: 0 auto;
`;

const Top = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: 40px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const BrandRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-weight: 800;
  font-size: 18px;
`;

const Desc = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  max-width: 280px;
  color: #9fb0c3;
`;

const Social = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;

  a {
    color: #c9d4e0;
    font-size: 13px;
    text-decoration: none;
    &:hover {
      color: #fff;
    }
  }
`;

const ColTitle = styled.h3`
  margin: 0 0 14px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fff;
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const A = styled(Link)`
  color: #9fb0c3;
  text-decoration: none;
  font-size: 14px;
  &:hover {
    color: #fff;
  }
`;

const External = styled.a`
  color: #9fb0c3;
  text-decoration: none;
  font-size: 14px;
  &:hover {
    color: #fff;
  }
`;

const Bottom = styled.div`
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #7d8fa3;
`;

const Legal = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

export default function MarketingFooter() {
  return (
    <Wrap>
      <Inner>
        <Top>
          <Brand>
            <BrandRow>
              <LogoIcon
                size={26}
                isScrolled
                restingColor="#fff"
                activeColor="#fff"
              />
              ClassEasily
            </BrandRow>
            <Desc>
              Booking and CRM software for small businesses — easy to set up,
              priced for small teams.
            </Desc>
            <Social>
              <a
                href="https://www.instagram.com/tryclasseasily/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
              <a
                href="https://www.facebook.com/p/ClassEasily-61577902526917/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>
            </Social>
          </Brand>
          <div>
            <ColTitle>Product</ColTitle>
            <List>
              <li>
                <A href="/#features">Features</A>
              </li>
              <li>
                <A href={PRICING_HREF}>Pricing</A>
              </li>
              <li>
                <A href={REGISTER_HREF}>Get started</A>
              </li>
              <li>
                <A href="/business/help">Help</A>
              </li>
            </List>
          </div>
          <div>
            <ColTitle>Company</ColTitle>
            <List>
              <li>
                <A href="/about">About</A>
              </li>
              <li>
                <A href="/blog">Blog</A>
              </li>
              <li>
                <External href={`mailto:${SUPPORT_EMAIL}`}>Contact</External>
              </li>
            </List>
          </div>
          <div>
            <ColTitle>Legal</ColTitle>
            <List>
              <li>
                <A href="/terms-of-service">Terms</A>
              </li>
              <li>
                <A href="/privacy-policy">Privacy</A>
              </li>
              <li>
                <A href="/cookie-policy">Cookies</A>
              </li>
              <li>
                <A href="/fees">Fees</A>
              </li>
            </List>
          </div>
        </Top>
        <Bottom>
          <span>
            ©{" "}
            <Suspense fallback={2026}>
              <CopyrightYear />
            </Suspense>{" "}
            ClassEasily. All rights reserved.
          </span>
          <Legal>
            <A href="/copyright-policy">Copyright</A>
            <A href="/content-policy">Content policy</A>
          </Legal>
        </Bottom>
      </Inner>
    </Wrap>
  );
}
