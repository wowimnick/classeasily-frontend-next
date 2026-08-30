"use client";

import styled, { keyframes } from "styled-components";

const Section = styled.section`
  padding: 56px 0 72px;
  background: #fff;
  overflow: hidden;
`;

const Head = styled.div`
  max-width: 1120px;
  margin: 0 auto 2rem;
  padding: 0 1.5rem;
  text-align: center;
  @media (min-width: 768px) {
    padding: 0 2.5rem;
  }
`;

const Title = styled.h2`
  margin: 0 0 0.5rem;
  font-size: clamp(1.1rem, 2.5vw, 1.35rem);
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const Sub = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: #94a3b8;
`;

const scroll = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
`;

const Track = styled.div`
  display: flex;
  width: max-content;
  gap: 3.5rem;
  align-items: center;
  animation: ${scroll} 38s linear infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 1.5rem;
    row-gap: 1.5rem;
  }
`;

const Logo = styled.div`
  flex-shrink: 0;
  opacity: 0.55;
  height: 28px;
  display: flex;
  align-items: center;
  color: #0f172a;
  &:hover {
    opacity: 0.85;
  }
`;

/** Mock client marks for layout only — not affiliated companies. */
const MOCK_LOGOS = [
  { id: "a", label: "Northwind" },
  { id: "b", label: "Acme Labs" },
  { id: "c", label: "Bluebird" },
  { id: "d", label: "Stellar" },
  { id: "e", label: "Harbor" },
  { id: "f", label: "Vertex" },
  { id: "g", label: "Cedar" },
  { id: "h", label: "Atlas" },
  { id: "i", label: "Meridian" },
  { id: "j", label: "Kindred" },
  { id: "k", label: "Signal" },
  { id: "l", label: "Foundry" },
];

function LogoSvg({ name }) {
  return (
    <svg
      width="120"
      height="28"
      viewBox="0 0 120 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="0.5" y="0.5" width="27" height="27" rx="6" stroke="currentColor" strokeOpacity="0.35" />
      <text
        x="38"
        y="19"
        fill="currentColor"
        style={{ fontSize: "13px", fontWeight: 700, fontFamily: "system-ui, sans-serif" }}
      >
        {name}
      </text>
    </svg>
  );
}

export default function ClientLogoWall() {
  const doubled = [...MOCK_LOGOS, ...MOCK_LOGOS];
  return (
    <Section aria-label="Illustrative client logos">
      <Head>
        <Title>Trusted by teams like yours</Title>
        <Sub>Fictional marks for visual design — replace with real logos when available.</Sub>
      </Head>
      <Track>
        {doubled.map((logo, i) => (
          <Logo key={`${logo.id}-${i}`}>
            <LogoSvg name={logo.label} />
          </Logo>
        ))}
      </Track>
    </Section>
  );
}
