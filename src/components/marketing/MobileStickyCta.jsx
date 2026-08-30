"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { ArrowRight } from "lucide-react";
import { marketingTheme as t, BP } from "./tokens";

const Bar = styled.div`
  display: none;

  @media (max-width: ${BP.mobile}px) {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 90;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(18px) saturate(180%);
    -webkit-backdrop-filter: blur(18px) saturate(180%);
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 -8px 24px rgba(15, 18, 30, 0.08);
    transform: translateY(${(p) => (p.$show ? "0" : "110%")});
    opacity: ${(p) => (p.$show ? 1 : 0)};
    pointer-events: ${(p) => (p.$show ? "auto" : "none")};
    transition:
      transform 0.28s ease,
      opacity 0.22s ease;
  }

  html[data-marketing-menu="open"] & {
    opacity: 0;
    pointer-events: none;
  }
`;

const Copy = styled.div`
  min-width: 0;
`;

const Label = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Teaser = styled.p`
  margin: 1px 0 0;
  font-size: 12px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Cta = styled(Link)`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  background: ${t.colors.primary};
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 8px 18px rgba(252, 64, 86, 0.22);

  &:hover,
  &:focus-visible {
    color: #fff;
    background: ${t.colors.primaryHover};
  }
`;

const Spacer = styled.div`
  display: none;

  @media (max-width: ${BP.mobile}px) {
    display: block;
    height: calc(64px + env(safe-area-inset-bottom, 0px));
    pointer-events: none;
  }
`;

export default function MobileStickyCta({
  href,
  label = "Get started",
  teaser,
  sentinelId = "mobile-hero-end",
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const node = document.getElementById(sentinelId);
    if (!node) {
      setShow(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [sentinelId]);

  return (
    <>
      <Bar $show={show} data-mobile-sticky-cta>
        <Copy>
          <Label>{label}</Label>
          {teaser ? <Teaser>{teaser}</Teaser> : null}
        </Copy>
        <Cta href={href}>
          Get started
          <ArrowRight size={15} />
        </Cta>
      </Bar>
      <Spacer aria-hidden />
    </>
  );
}
