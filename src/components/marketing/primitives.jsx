"use client";

import styled, { css } from "styled-components";
import Link from "next/link";
import { marketingTheme as t } from "./tokens";

export const Container = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
  width: 100%;
`;

export const Section = styled.section`
  padding: ${(p) => p.$pad || "88px 0"};
  background: ${(p) => p.$bg || t.colors.white};

  @media (max-width: 768px) {
    padding: ${(p) => p.$padMobile || "64px 0"};
  }
`;

const buttonCss = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: ${t.fonts.body};
  font-weight: 600;
  font-size: 15px;
  line-height: 1;
  border-radius: 999px;
  text-decoration: none;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
  padding: ${(p) => (p.$size === "lg" ? "16px 28px" : "12px 22px")};

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const variants = {
  primary: css`
    background: ${t.colors.primary};
    color: #fff;
    &:hover {
      background: ${t.colors.primaryHover};
      color: #fff;
    }
  `,
  secondary: css`
    background: transparent;
    color: ${t.colors.dark};
    border-color: ${t.colors.border};
    &:hover {
      border-color: ${t.colors.dark};
      color: ${t.colors.dark};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${t.colors.dark};
    padding-left: 8px;
    padding-right: 8px;
    &:hover {
      color: ${t.colors.primary};
    }
  `,
  dark: css`
    background: ${t.colors.dark};
    color: #fff;
    &:hover {
      background: #000;
      color: #fff;
    }
  `,
};

export const ButtonLink = styled(Link)`
  ${buttonCss}
  ${(p) => variants[p.$variant || "primary"]}
`;

export const Button = styled.button`
  ${buttonCss}
  ${(p) => variants[p.$variant || "primary"]}
`;

export const Eyebrow = styled.p`
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${t.colors.primary};
  margin: 0 0 12px;
`;

export const H1 = styled.h1`
  font-family: ${t.fonts.body};
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.08;
  color: ${t.colors.dark};
  margin: 0 0 16px;
`;

export const H2 = styled.h2`
  font-family: ${t.fonts.body};
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: ${t.colors.dark};
  margin: 0 0 12px;
`;

export const Lead = styled.p`
  font-size: 18px;
  line-height: 1.6;
  color: ${t.colors.text};
  margin: 0;
  max-width: ${(p) => p.$max || "560px"};
`;
