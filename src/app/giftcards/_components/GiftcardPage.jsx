"use client";

import React, {
  useState,
  Suspense,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import styled, { createGlobalStyle, css, keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Sliders,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { ConfigProvider } from "antd";
import Image from "next/image";
import Link from "next/link"; // IMPORT ADDED
import message from "@/lib/message";
import { theme } from "@/components/theme";
import FooterClient from "@/components/homepage/FooterClient";
import Script from "next/script";

// --- THREE JS IMPORTS ---
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  useTexture,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";

// --- IMAGE IMPORTS SETUP ---
import Card1 from "@/assets/card1.png";
import Card2 from "@/assets/Card 7.png";
import Card3 from "@/assets/Card 8.png";
import Card4 from "@/assets/Card 6.png";
import Card5 from "@/assets/Card 9.png";
import Card6 from "@/assets/Card 10.png";
import Card7 from "@/assets/Card 11.png";
import { useRouter } from "next/navigation";
import ExploreHeader from "@/components/explore/ExploreHeader";

const HERO_CARD_IMAGES = [
  Card1.src,
  Card2.src,
  Card3.src,
  Card4.src,
  Card5.src,
  Card6.src,
  Card7.src,
];

// --- HOOKS ---
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// --- Animation Variants ---
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

// --- Global Styles ---
const GlobalStyle = createGlobalStyle`
  :root {
    --glass-bg: rgba(255, 255, 255, 0.65);
    --glass-border: 1px solid rgba(0, 0, 0, 0.06);
    --glass-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
    --accent: #ff385c;
  }
  body {
    background-color: #ffffff;
    overflow-x: hidden;
  }
`;

// --- Styled Components ---
const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Spinner = styled(Loader2)`
  animation: ${rotate} 1s linear infinite;
`;

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  padding-top: 100px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  color: #222222;
  background: #ffffff;
  position: relative;
  overflow-x: hidden;

  @media (max-width: 768px) {
    padding-top: 70px;
  }
`;

const Container = styled.div`
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

/* --- TYPOGRAPHY --- */
const Headline = styled.h1`
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 600;
  color: #222222;
  line-height: 0.9;
  letter-spacing: -0.02em;
  text-align: center;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 12px;
  }
`;

const SubHeadline = styled.p`
  font-size: clamp(1rem, 2vw, 1.125rem);
  font-weight: 400;
  color: #222222;
  text-align: center;
  margin-bottom: 24px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.5;
`;

const SectionTitle = styled.h2`
  font-size: clamp(1.75rem, 4vw, 4rem);
  font-weight: 600;
  color: #222222;
  text-align: center;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
  line-height: 1.1;
`;

const EyebrowLabel = styled.p`
  color: #ff385c;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
  text-align: center;
`;

const HeroBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 56, 92, 0.07);
  color: #ff385c;
  border: 1px solid rgba(255, 56, 92, 0.18);
  border-radius: 999px;
  padding: 7px 16px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 22px;
`;

// Changed from styled.a to styled.button to fix "Link not crawlable" error
// when used for actions instead of navigation.
const LinkButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: #222222;
  text-decoration: underline;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  text-align: center;
  display: block;
  margin-top: 10px;

  &:hover {
    color: #000000;
  }
`;

// New styled component for actual Links
const StyledLink = styled(Link)`
  color: #222222;
  text-decoration: underline;
  font-weight: 600;
  cursor: pointer;
  font-size: inherit;

  &:hover {
    color: #000000;
  }
`;

/* --- BUTTONS --- */
const BuyButton = styled(motion.button)`
  background: #ff385c;
  color: #ffffff;
  border: none;
  height: 50px;
  font-weight: 600;
  margin-bottom: 20px;
  font-size: 15px;
  padding: 0 36px;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 20px rgba(255, 56, 92, 0.3);
  transition: background 0.2s, box-shadow 0.2s, transform 0.15s;

  &:hover {
    background: #d9324e;
    box-shadow: 0 6px 24px rgba(255, 56, 92, 0.4);
    transform: translateY(-1px);
  }
`;

const DarkButton = styled(motion.button)`
  background: #222222;
  color: #ffffff;
  border: none;
  height: 48px;
  padding: 0 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
`;

const SelectButton = styled(motion.button)`
  color: white;
  background: #ff385c;
  border: none;
  padding: 12px 28px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;

  &:hover {
    background: #d9324e;
  }

  &:disabled {
    background: #d9324e;
    opacity: 0.8;
    cursor: wait;
    pointer-events: none;
  }
`;

/* --- HERO --- */
const HeroSection = styled.section`
  padding: 20px 0 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: visible;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 10px 0 0 0;
  }
`;

const HeroVisual = styled.div`
  position: relative;
  width: 100%;
  height: 650px;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 5%;
    z-index: 10;
    pointer-events: none;
  }

  &::before {
    left: 0;
    background: linear-gradient(to right, #ffffff 10%, transparent 100%);
  }

  &::after {
    right: 0;
    background: linear-gradient(to left, #ffffff 10%, transparent 100%);
  }

  @media (max-width: 768px) {
    height: 380px;
    margin-top: 20px;

    &::before,
    &::after {
      width: 5%;
    }
  }
`;

/* --- FALLBACK COMPONENT --- */
const CanvasFallback = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
`;

/* --- VALUE PROP SECTION --- */
const TextSection = styled.section`
  padding: 60px 0 40px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 32px 0 24px;
  }
`;

/* --- NITRO CAROUSEL SECTION --- */
const CarouselSection = styled.section`
  overflow: hidden;
  scroll-margin-top: 100px;
  margin-bottom: 20px;
`;

const CarouselWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 400px;

  @media (max-width: 768px) {
    height: 320px;
  }
`;

const ArrowButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  border: 1px solid #eee;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 50;
  color: #222;
  transition: all 0.2s;

  ${(props) =>
    props.$left
      ? css`
          left: 20px;
        `
      : css`
          right: 20px;
        `}

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.9);
    ${(props) =>
      props.$left
        ? css`
            left: 8px;
          `
        : css`
            right: 8px;
          `}
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: #f7f7f7;
    transform: translateY(-50%) scale(1.05);
  }
`;

/* --- FEATURES 3-COL --- */
const FeatureSection = styled.section`
  padding: 20px 0 80px 0;

  @media (max-width: 768px) {
    padding: 20px 0 56px 0;
  }
`;

const FeatureSectionHeader = styled.div`
  text-align: center;
  margin-bottom: 52px;

  @media (max-width: 768px) {
    margin-bottom: 36px;
  }
`;

const FeatureSectionTitle = styled.h2`
  font-size: clamp(1.6rem, 3.5vw, 2.6rem);
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.025em;
  line-height: 1.1;
  margin-bottom: 10px;
`;

const FeatureSectionSubtitle = styled.p`
  font-size: 1rem;
  color: #6e6e73;
  line-height: 1.5;
  max-width: 500px;
  margin: 0 auto;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const FeatureCard = styled(motion.article)`
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--glass-border);
  border-radius: 20px;
  padding: 32px;
  text-align: left;
  box-shadow: var(--glass-shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.09);
  }

  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const FeatureIconCircle = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 56, 92, 0.08);
  color: #ff385c;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
`;

const FeatureTitle = styled.h4`
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const FeatureText = styled.p`
  font-size: 0.9rem;
  color: #6e6e73;
  line-height: 1.6;
`;

/* --- CORPORATE SECTION --- */
const CorporateSection = styled.section`
  background: #f7f7f9;
  padding: 80px 0;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 48px 0;
  }
`;

const TwoColumnContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
  gap: 60px;

  @media (max-width: 900px) {
    flex-direction: column;
    gap: 30px;
    align-items: center;
    text-align: center;
  }
`;

const TextColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: left;
  width: 100%;

  @media (max-width: 900px) {
    align-items: center;
  }
`;

const VisualColumn = styled.div`
  flex: 1;
  height: 500px;
  width: 100%;
  position: relative;

  @media (max-width: 900px) {
    height: 350px;
    order: -1;
    margin-bottom: -20px;
  }
`;

/* --- FAQ SECTION --- */
const FAQSection = styled.section`
  padding: 80px 0 100px;
  max-width: 800px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 48px 0 64px;
  }
`;

const FAQGlassCard = styled.div`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 24px;
  padding: 0 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 0 20px;
    border-radius: 16px;
  }
`;

const FAQItem = styled.div`
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  &:last-child {
    border-bottom: none;
  }
`;

const FAQTrigger = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;

  span {
    font-size: 1.05rem;
    font-weight: 500;
    color: #1a1a1a;
    padding-right: 16px;
  }

  &:hover span {
    color: #000;
  }

  @media (max-width: 768px) {
    padding: 18px 0;
    span {
      font-size: 0.95rem;
    }
  }
`;

const FAQContent = styled(motion.div)`
  overflow: hidden;
  color: #6e6e73;
  font-size: 0.95rem;
  line-height: 1.6;
`;

// ─── Diagonal Section Divider (same pattern as BusinessWelcomePage) ──────────
const DiagonalDivider = ({
  fromBg = "#ffffff",
  toBg = "#ffffff",
  flip = false,
}) => (
  <div
    style={{
      lineHeight: 0,
      background: toBg,
      display: "block",
      overflow: "hidden",
      position: "relative",
      zIndex: 1,
    }}
  >
    <svg
      viewBox="0 0 1440 44"
      preserveAspectRatio="none"
      width="100%"
      height="44"
      style={{ display: "block", transform: flip ? "scaleX(-1)" : "none" }}
    >
      <path d="M0,0 L1440,0 L0,44 Z" fill={fromBg} />
      <line
        x1="0"
        y1="0"
        x2="1440"
        y2="44"
        stroke="rgba(248,30,62,0.10)"
        strokeWidth="1.5"
      />
    </svg>
  </div>
);

// --- SHARED 3D RESOURCES ---
const CARD_WIDTH = 3;
const CARD_HEIGHT = 1.9;
const CARD_RADIUS = 0.2;
const CARD_THICKNESS = 0.05;

const cardShape = new THREE.Shape();
const w = CARD_WIDTH;
const h = CARD_HEIGHT;
const r = CARD_RADIUS;
const x = -w / 2;
const y = -h / 2;

cardShape.moveTo(x + r, y);
cardShape.lineTo(x + w - r, y);
cardShape.quadraticCurveTo(x + w, y, x + w, y + r);
cardShape.lineTo(x + w, y + h - r);
cardShape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
cardShape.lineTo(x + r, y + h);
cardShape.quadraticCurveTo(x, y + h, x, y + h - r);
cardShape.lineTo(x, y + r);
cardShape.quadraticCurveTo(x, y, x + r, y);

const extrudeSettings = {
  depth: CARD_THICKNESS,
  bevelEnabled: false,
};

const GlossyCardMesh = React.forwardRef(
  ({ textureUrl, envMapIntensity = 0.25, ...props }, ref) => {
    const texture = useTexture(textureUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    const geometryRef = useRef();

    useLayoutEffect(() => {
      if (geometryRef.current) {
        geometryRef.current.computeBoundingBox();
        const { min, max } = geometryRef.current.boundingBox;
        const uvAttribute = geometryRef.current.attributes.uv;
        const posAttribute = geometryRef.current.attributes.position;
        for (let i = 0; i < posAttribute.count; i++) {
          const xPos = posAttribute.getX(i);
          const yPos = posAttribute.getY(i);
          const u = (xPos - min.x) / (max.x - min.x);
          const v = (yPos - min.y) / (max.y - min.y);
          uvAttribute.setXY(i, u, v);
        }
        uvAttribute.needsUpdate = true;
      }
    }, []);

    return (
      <mesh ref={ref} castShadow {...props}>
        <extrudeGeometry
          ref={geometryRef}
          args={[cardShape, extrudeSettings]}
        />
        <meshPhysicalMaterial
          attach="material-0"
          map={texture}
          color="#ffffff"
          emissive="#ffffff"
          emissiveMap={texture}
          emissiveIntensity={0.2}
          metalness={0.1}
          roughness={0.2}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          ior={1.5}
          reflectivity={0.9}
          envMapIntensity={envMapIntensity}
        />
        <meshStandardMaterial
          attach="material-1"
          color="#ffffff"
          roughness={0.3}
        />
      </mesh>
    );
  },
);
GlossyCardMesh.displayName = "GlossyCardMesh";

// --- 3D HERO COMPONENTS ---

function AutoRotateRig({ children, isMobile }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    groupRef.current.rotation.y += delta * 0.1;
    easing.damp3(
      state.camera.position,
      [0, isMobile ? 4.5 : 1.9, 10],
      0.3,
      delta,
    );
    state.camera.lookAt(0, 0, 0);
  });
  return <group ref={groupRef}>{children}</group>;
}

function GiftCardCarousel({ radius = 2.4 }) {
  const images = HERO_CARD_IMAGES;
  const count = images.length;
  return Array.from({ length: count }, (_, i) => (
    <GiftCard
      key={i}
      url={images[i]}
      position={[
        Math.sin((i / count) * Math.PI * 2) * radius,
        0,
        Math.cos((i / count) * Math.PI * 2) * radius,
      ]}
      rotation={[0, Math.PI + (i / count) * Math.PI * 2, 0]}
    />
  ));
}

function GiftCard({ url, ...props }) {
  const meshRef = useRef();
  const [hovered, hover] = useState(false);
  const baseScale = 0.5;

  useFrame((state, delta) => {
    easing.damp3(
      meshRef.current.scale,
      hovered ? baseScale * 1.05 : baseScale,
      0.1,
      delta,
    );
  });

  return (
    <group
      {...props}
      onPointerOver={(e) => (e.stopPropagation(), hover(true))}
      onPointerOut={() => hover(false)}
    >
      <GlossyCardMesh ref={meshRef} textureUrl={url} envMapIntensity={2} />
    </group>
  );
}

const HeroCarouselScene = ({ isMobile }) => (
  <>
    <color attach="background" args={["#ffffff"]} />
    <ambientLight intensity={1} />
    <directionalLight
      position={[5, 5, 10]}
      intensity={0.5}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0001}
    />
    <Environment preset="city" />
    <AutoRotateRig isMobile={isMobile}>
      <GiftCardCarousel radius={isMobile ? 1.8 : 2.4} />
    </AutoRotateRig>
    <ContactShadows
      position={[0, -0.7, 0]}
      opacity={1}
      scale={10}
      blur={1.5}
      far={4.5}
    />
  </>
);

// --- 3D BUSINESS COMPONENT ---
function ShuffleDeck({ isMobile }) {
  const indices = [5, 4, 6];
  const [order, setOrder] = useState([0, 1, 2]);

  useEffect(() => {
    const interval = setInterval(() => {
      setOrder((prev) => {
        const [first, ...rest] = prev;
        return [...rest, first];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <group position={[0, -0.2, 0]}>
      {order.map((textureIndex, i) => (
        <ShufflingCard
          key={indices[textureIndex]}
          url={HERO_CARD_IMAGES[indices[textureIndex]]}
          positionIndex={i}
          isMobile={isMobile}
        />
      ))}
    </group>
  );
}

function ShufflingCard({ url, positionIndex, isMobile }) {
  const ref = useRef();
  const spreadFactor = isMobile ? 0.1 : 0.15;
  const x = positionIndex * spreadFactor;
  const y = positionIndex * 0.05;
  const z = positionIndex * -0.2;
  const rotY = -positionIndex * 0.1;
  const rotZ = -positionIndex * 0.05;

  useFrame((state, delta) => {
    easing.damp3(ref.current.position, [x, y, z], 0.3, delta);
    easing.damp3(ref.current.rotation, [0.1, rotY, rotZ], 0.3, delta);
  });

  return (
    <group ref={ref}>
      <GlossyCardMesh textureUrl={url} scale={0.85} envMapIntensity={2} />
    </group>
  );
}

const BusinessScene = ({ isMobile }) => (
  <>
    <color attach="background" args={["#f7f7f7"]} />
    <ambientLight intensity={1} />
    <directionalLight
      position={[5, 5, 10]}
      intensity={0.5}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0001}
    />
    <Environment preset="city" />
    <ShuffleDeck isMobile={isMobile} />
    <ContactShadows
      position={[0, -1.0, 0]}
      opacity={0.4}
      scale={10}
      blur={5}
      far={4}
      color="#000000"
    />
  </>
);

const MobileButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 10px;
  width: 100%;
`;

function NitroCard3D({
  index,
  activeIndex,
  textureUrl,
  onSelect,
  onSetIndex,
  isMobile,
  isNavigating,
}) {
  const groupRef = useRef();
  const offset = index - activeIndex;
  const isActive = offset === 0;

  useFrame((state, delta) => {
    const spacing = isMobile ? 2.3 : 3.2;
    const targetX = offset * spacing;
    const targetZ = isActive ? 0 : -Math.abs(offset) * (isMobile ? 1.0 : 1.5);
    let targetRotY = offset * -0.15;
    const baseScale = isMobile ? 0.9 : 1.0;
    const targetScale = isActive ? baseScale * 1.1 : baseScale * 0.85;

    easing.damp(groupRef.current.position, "x", targetX, 0.25, delta);
    easing.damp(groupRef.current.position, "z", targetZ, 0.25, delta);
    easing.damp(groupRef.current.rotation, "y", targetRotY, 0.25, delta);
    easing.damp(groupRef.current.scale, "x", targetScale, 0.25, delta);
    easing.damp(groupRef.current.scale, "y", targetScale, 0.25, delta);
    easing.damp(groupRef.current.scale, "z", targetScale, 0.25, delta);
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        if (isActive) {
          onSelect(textureUrl);
        } else {
          onSetIndex(index);
        }
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <GlossyCardMesh textureUrl={textureUrl} envMapIntensity={2} />
      {isActive && !isMobile && (
        <Html
          position={[0, -1.4, 0]}
          center
          distanceFactor={5}
          zIndexRange={[100, 0]}
          transform
          style={{ opacity: 1, pointerEvents: "none" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              position: "relative",
              display: "inline-block",
              pointerEvents: "none",
            }}
          >
            {/* Invisible hit area shifted up so click area matches visible button */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Select Design"
              onClick={(e) => {
                e.stopPropagation();
                if (!isNavigating) onSelect(textureUrl);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (!isNavigating) onSelect(textureUrl);
                }
              }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: -28,
                height: 76,
                pointerEvents: "auto",
                cursor: "pointer",
                zIndex: 0,
              }}
            />
            <SelectButton
              as="span"
              style={{ pointerEvents: "none", position: "relative", zIndex: 1 }}
              whileTap={{ scale: 0.95 }}
              disabled={isNavigating}
            >
              Select Design
            </SelectButton>
          </motion.div>
        </Html>
      )}
    </group>
  );
}

const NitroCarouselScene = ({
  activeIndex,
  setActiveIndex,
  onSelect,
  isMobile,
  isNavigating,
}) => {
  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight
        position={[5, 5, 10]}
        intensity={0.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      <Environment preset="city" />
      <group position={[0, 0, 0]}>
        {HERO_CARD_IMAGES.map((url, i) => (
          <NitroCard3D
            key={i}
            index={i}
            activeIndex={activeIndex}
            textureUrl={url}
            onSelect={onSelect}
            onSetIndex={setActiveIndex}
            isMobile={isMobile}
            isNavigating={isNavigating}
          />
        ))}
      </group>
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.4}
        scale={20}
        blur={2}
        far={3.5}
      />
    </>
  );
};

// --- DATA ---
const FAQS = [
  {
    q: "Are gift cards physical or digital?",
    a: "Our gift cards are 100% digital. We believe experiences are better than plastic waste. They land in emails instantly (or when you schedule them).",
  },
  {
    q: "What exactly can they book?",
    a: "Anything! From a pottery session in a local studio to a guided food tour downtown. If it's on our platform, they can book it.",
  },
  {
    q: "Do gift cards expire?",
    a: "Nope. No expiration dates, no hidden fees. The money stays theirs until they use it.",
  },
  {
    q: "Can I send one to a friend abroad?",
    a: "Absolutely, provided the currency matches. If they're in the US or Europe, our system usually handles the heavy lifting on conversion.",
  },
];

export default function GiftCardsPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const router = useRouter();
  const selectionSectionRef = useRef(null);
  const isMobile = useIsMobile();
  const [carouselIndex, setCarouselIndex] = useState(3);
  const [canvasKey, setCanvasKey] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // Defer Canvas mount until after layout so R3F's event system has a non-null container ref (avoids addEventListener on null)
  useEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setCanvasKey((prev) => prev + 1);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, []);

  // Prefetch the checkout page to minimize delay
  useEffect(() => {
    router.prefetch("/giftcards/checkout");
  }, [router]);

  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);
  const handleUnsupported = () =>
    message.info("Our developers are building this! Check back soon.");

  const scrollToSelection = () => {
    selectionSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelect = (url) => {
    setIsNavigating(true);
    const index = HERO_CARD_IMAGES.indexOf(url);
    if (index !== -1) {
      router.push(`/giftcards/checkout?designIndex=${index}`);
    }
  };

  const handleNext = () =>
    setCarouselIndex((prev) => Math.min(prev + 1, HERO_CARD_IMAGES.length - 1));
  const handlePrev = () => setCarouselIndex((prev) => Math.max(prev - 1, 0));

  // --- STRUCTURED DATA (JSON-LD) ---
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "ClassEasily Digital Gift Card",
    image: HERO_CARD_IMAGES[2],
    description:
      "Give the gift of creative experiences. Valid for workshops, classes, and tours.",
    brand: {
      "@type": "Brand",
      name: "ClassEasily",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: "50.00",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <ConfigProvider theme={theme}>
      <GlobalStyle />
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <ExploreHeader showOptionsWrapper={false} />

      <PageWrapper>
        {/* HERO SECTION */}
        <HeroSection>
          <Container>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              style={{ textAlign: "center" }}
            >

              <motion.div variants={fadeUp}>
                <Headline>
                  ClassEasily
                  <br />
                  gift cards
                </Headline>
              </motion.div>
              <motion.div variants={fadeUp}>
                <SubHeadline>
                  So many fun experiences to discover. Give them the freedom to
                  explore.
                </SubHeadline>
              </motion.div>
              <motion.div variants={fadeUp}>
                <BuyButton whileTap={{ scale: 0.95 }} onClick={scrollToSelection}>
                  Buy now
                </BuyButton>
              </motion.div>
            </motion.div>
            <HeroVisual>
              <Suspense
                fallback={
                  <CanvasFallback aria-hidden="true">
                    <Spinner size={32} />
                  </CanvasFallback>
                }
              >
                {canvasKey > 0 && (
                  <Canvas
                    key={`hero-${canvasKey}`}
                    shadows
                    camera={{ position: [0, 0, 10], fov: isMobile ? 22 : 20 }}
                    gl={{ antialias: true, alpha: true }}
                    dpr={[1, 2]}
                  >
                    <HeroCarouselScene isMobile={isMobile} />
                  </Canvas>
                )}
              </Suspense>
            </HeroVisual>
          </Container>
        </HeroSection>

        <DiagonalDivider fromBg="#ffffff" toBg="#ffffff" />

        {/* VALUE PROP TEXT */}
        <TextSection>
          <Container>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={stagger}
            >
              <motion.div variants={fadeUp}>
                <EyebrowLabel>Perfect for every occasion</EyebrowLabel>
              </motion.div>
              <motion.div variants={fadeUp}>
                <SectionTitle>You give. They go.</SectionTitle>
              </motion.div>
              <motion.p
                variants={fadeUp}
                style={{
                  maxWidth: 560,
                  margin: "0 auto",
                  lineHeight: "1.6",
                  color: "#6e6e73",
                  fontSize: "1rem",
                }}
              >
                Give the gift of unforgettable experiences. Our gift cards unlock
                a world of activities, from making something tasty to making neon
                signs. Perfect for birthdays, holidays, or just because.
              </motion.p>
              <motion.div
                variants={fadeUp}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginTop: 24,
                }}
              >
                <span style={{ fontSize: "0.875rem", color: "#888" }}>
                  Interested in corporate gifting?
                </span>
                <LinkButton onClick={handleUnsupported}>
                  Check out corporate options
                </LinkButton>
              </motion.div>
            </motion.div>
          </Container>
        </TextSection>

        {/* 3D SELECTION CAROUSEL */}
        <CarouselSection ref={selectionSectionRef}>
          <Container>
            <CarouselWrapper>
              <ArrowButton
                onClick={handlePrev}
                disabled={carouselIndex === 0}
                $left
                aria-label="Previous Design"
              >
                <ChevronLeft size={isMobile ? 20 : 24} />
              </ArrowButton>

              <Suspense
                fallback={
                  <CanvasFallback aria-hidden="true">
                    <Spinner size={28} />
                  </CanvasFallback>
                }
              >
                {canvasKey > 0 && (
                  <Canvas
                    key={`select-${canvasKey}`}
                    shadows
                    camera={{
                      position: [0, 0, isMobile ? 5.5 : 8],
                      fov: isMobile ? 40 : 35,
                    }}
                    gl={{ antialias: true }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <NitroCarouselScene
                      activeIndex={carouselIndex}
                      setActiveIndex={setCarouselIndex}
                      onSelect={handleSelect}
                      isMobile={isMobile}
                      isNavigating={isNavigating}
                    />
                  </Canvas>
                )}
              </Suspense>

              <ArrowButton
                onClick={handleNext}
                disabled={carouselIndex === HERO_CARD_IMAGES.length - 1}
                aria-label="Next Design"
              >
                <ChevronRight size={isMobile ? 20 : 24} />
              </ArrowButton>
            </CarouselWrapper>

            {isMobile && (
              <MobileButtonWrapper>
                <SelectButton
                  onClick={() => handleSelect(HERO_CARD_IMAGES[carouselIndex])}
                  whileTap={{ scale: 0.95 }}
                  style={{ justifyContent: "center" }}
                  disabled={isNavigating}
                >
                  Select Design
                </SelectButton>
              </MobileButtonWrapper>
            )}
          </Container>
        </CarouselSection>


        {/* FEATURES */}
        <FeatureSection>
          <Container>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
            >
              <FeatureSectionHeader>
                <motion.div variants={fadeUp}>
                  <EyebrowLabel>Why gift cards</EyebrowLabel>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <FeatureSectionTitle>Everything you need,<br />nothing you don&apos;t</FeatureSectionTitle>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <FeatureSectionSubtitle>
                    Simple, flexible, and lasting. Gift cards that actually get used.
                  </FeatureSectionSubtitle>
                </motion.div>
              </FeatureSectionHeader>

              <FeatureGrid>
                <FeatureCard variants={fadeUp}>
                  <FeatureIconCircle>
                    <Sliders size={22} />
                  </FeatureIconCircle>
                  <FeatureTitle>You choose the amount</FeatureTitle>
                  <FeatureText>
                    Pick a design, set the budget, write a personal note. Done.
                    They handle the rest.
                  </FeatureText>
                </FeatureCard>

                <FeatureCard variants={fadeUp}>
                  <FeatureIconCircle>
                    <Zap size={22} />
                  </FeatureIconCircle>
                  <FeatureTitle>Zero lag time</FeatureTitle>
                  <FeatureText>
                    Send it via email instantly or schedule it for the exact
                    right moment — birthdays, anniversaries, you name it.
                  </FeatureText>
                </FeatureCard>

                <FeatureCard variants={fadeUp}>
                  <FeatureIconCircle>
                    <ShieldCheck size={22} />
                  </FeatureIconCircle>
                  <FeatureTitle>Forever valid</FeatureTitle>
                  <FeatureText>
                    Life gets busy. That&apos;s why our credits never expire —
                    no fine print, no hidden fees.
                  </FeatureText>
                </FeatureCard>
              </FeatureGrid>
            </motion.div>
          </Container>
        </FeatureSection>

        <DiagonalDivider fromBg="#ffffff" toBg="#f7f7f7" />

        {/* CORPORATE SECTION */}
        <CorporateSection>
          <TwoColumnContainer>
            <TextColumn>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={stagger}
              >
                <motion.div variants={fadeUp}>
                  <p
                    style={{
                      color: "#ff385c",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: "0.7rem",
                      letterSpacing: "0.08em",
                      marginBottom: 12,
                    }}
                  >
                    For Teams &amp; Companies
                  </p>
                </motion.div>
                <motion.h2
                  variants={fadeUp}
                  style={{
                    fontSize: isMobile ? "2rem" : "clamp(2rem, 4vw, 2.5rem)",
                    fontWeight: 700,
                    margin: "0 0 20px 0",
                    lineHeight: 1.1,
                    letterSpacing: "-0.025em",
                    color: "#1a1a1a",
                  }}
                >
                  Team building, <br /> just got upgraded.
                </motion.h2>

                <motion.p
                  variants={fadeUp}
                  style={{
                    fontSize: "1rem",
                    color: "#6e6e73",
                    marginBottom: 28,
                    lineHeight: 1.6,
                  }}
                >
                  Give something that creates genuine excitement, not just
                  clutter. Our gift cards unlock a world of experiences, perfect
                  for showing appreciation to teams and clients alike.
                </motion.p>

                <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
                  <span style={{ fontSize: "0.875rem", color: "#888" }}>
                    Planning a big order?
                  </span>
                  {/* FIXED: Changed span to StyledLink for crawlability */}
                  <StyledLink
                    href="/corporate-gifting"
                    style={{ marginLeft: 6 }}
                    onClick={(e) => {
                      e.preventDefault();
                      handleUnsupported();
                    }}
                  >
                    Talk to our sales team
                  </StyledLink>
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  style={{ display: "flex", justifyContent: "inherit" }}
                >
                  <DarkButton
                    onClick={handleUnsupported}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start a bulk order
                  </DarkButton>
                </motion.div>
              </motion.div>
            </TextColumn>

            {/* RIGHT COLUMN: The 3D Canvas */}
            <VisualColumn>
              <Suspense
                fallback={
                  <CanvasFallback aria-hidden="true">
                    <Spinner size={28} />
                  </CanvasFallback>
                }
              >
                {canvasKey > 0 && (
                  <Canvas
                    key={`biz-${canvasKey}`}
                    shadows
                    camera={{
                      position: [0, 0, isMobile ? 3.8 : 4.5],
                      fov: isMobile ? 35 : 40,
                    }}
                    gl={{ antialias: true }}
                    dpr={[1, 2]}
                  >
                    <BusinessScene isMobile={isMobile} />
                  </Canvas>
                )}
              </Suspense>
            </VisualColumn>
          </TwoColumnContainer>
        </CorporateSection>

        <DiagonalDivider fromBg="#f7f7f7" toBg="#ffffff" />

        {/* FAQ */}
        <Container>
          <FAQSection>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={stagger}
            >
              <motion.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 40 }}>
                <EyebrowLabel>Got questions?</EyebrowLabel>
                <h2
                  style={{
                    fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    letterSpacing: "-0.025em",
                    lineHeight: 1.15,
                  }}
                >
                  Frequently asked questions
                </h2>
              </motion.div>
              <motion.div variants={fadeUp}>
                <FAQGlassCard>
                  {FAQS.map((item, index) => (
                    <FAQItem
                      key={index}
                      itemScope
                      itemType="https://schema.org/Question"
                    >
                      <FAQTrigger onClick={() => toggleFaq(index)}>
                        <span itemProp="name">{item.q}</span>
                        {openFaq === index ? (
                          <ChevronUp size={20} color="#ff385c" />
                        ) : (
                          <ChevronDown size={20} color="#aaa" />
                        )}
                      </FAQTrigger>
                      <AnimatePresence>
                        {openFaq === index && (
                          <FAQContent
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            itemScope
                            itemType="https://schema.org/Answer"
                          >
                            <div style={{ paddingBottom: 24 }} itemProp="text">
                              {item.a}
                            </div>
                          </FAQContent>
                        )}
                      </AnimatePresence>
                    </FAQItem>
                  ))}
                </FAQGlassCard>
              </motion.div>
              <motion.div
                variants={fadeUp}
                style={{
                  marginTop: 28,
                  fontSize: "0.875rem",
                  color: "#888",
                  textAlign: "center",
                }}
              >
                Have more burning questions? Visit the{" "}
                <StyledLink href="/help-center">Help Center</StyledLink>.
              </motion.div>
            </motion.div>
          </FAQSection>
        </Container>
      </PageWrapper>
      <FooterClient />
    </ConfigProvider>
  );
}
