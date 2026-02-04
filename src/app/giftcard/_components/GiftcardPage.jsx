"use client";

import React, { useState, Suspense, useRef, useEffect } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import Image from "next/image";
import { ConfigProvider, message } from "antd";
import { theme } from "@/components/theme";
import Header from "@/components/layout/SharedMainClientHeader";
import FooterClient from "@/components/homepage/FooterClient";

// --- THREE JS IMPORTS ---
import { Canvas, useFrame, extend } from "@react-three/fiber";
import {
  Image as DreiImage,
  Environment,
  ContactShadows,
  RoundedBox,
  useTexture,
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

const HERO_CARD_IMAGES = [
  Card1.src,
  Card2.src,
  Card3.src,
  Card4.src,
  Card5.src,
  Card6.src,
  Card7.src,
];

// --- Custom Geometries ---
class BentPlaneGeometry extends THREE.PlaneGeometry {
  constructor(radius, ...args) {
    super(...args);
    let p = this.parameters;
    let hw = p.width * 0.5;
    let a = new THREE.Vector2(-hw, 0);
    let b = new THREE.Vector2(0, radius);
    let c = new THREE.Vector2(hw, 0);
    let ab = new THREE.Vector2().subVectors(a, b);
    let bc = new THREE.Vector2().subVectors(b, c);
    let ac = new THREE.Vector2().subVectors(a, c);
    let r =
      (ab.length() * bc.length() * ac.length()) / (2 * Math.abs(ab.cross(ac)));
    let center = new THREE.Vector2(0, radius - r);
    let baseV = new THREE.Vector2().subVectors(a, center);
    let baseAngle = baseV.angle() - Math.PI * 0.5;
    let arc = baseAngle * 2;
    let uv = this.attributes.uv;
    let pos = this.attributes.position;
    let mainV = new THREE.Vector2();
    for (let i = 0; i < uv.count; i++) {
      let uvRatio = 1 - uv.getX(i);
      let y = pos.getY(i);
      mainV.copy(c).rotateAround(center, arc * uvRatio);
      pos.setXYZ(i, mainV.x, y, -mainV.y);
    }
    pos.needsUpdate = true;
  }
}

extend({ BentPlaneGeometry });

// --- Global Styles ---
const GlobalStyle = createGlobalStyle`
  body {
    background-color: #ffffff;
    overflow-x: hidden;
  }
`;

// --- Styled Components ---
const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  color: #222222;
  background: #ffffff;
`;

const Container = styled.div`
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;

  @media (max-width: 768px) {
    padding: 0 20px;
  }
`;

/* --- TYPOGRAPHY --- */
const Headline = styled.h1`
  font-size: clamp(3rem, 6vw, 4.5rem);
  font-weight: 800;
  color: #222222;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-align: center;
  margin-bottom: 20px;
`;

const SubHeadline = styled.p`
  font-size: 1.125rem;
  font-weight: 400;
  color: #222222;
  text-align: center;
  margin-bottom: 32px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const SectionTitle = styled.h2`
  font-size: 4rem;
  font-weight: 700;
  color: #222222;
  text-align: center;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const LinkText = styled.a`
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

/* --- BUTTONS --- */
const BuyButton = styled(motion.button)`
  background: #ff385c;
  color: #ffffff;
  border: none;
  height: 56px;
  padding: 0 32px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease;

  &:hover {
    background: #d9324e;
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

/* --- HERO --- */
const HeroSection = styled.section`
  padding: 80px 0 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: visible;
`;

const HeroVisual = styled.div`
  margin-top: 40px;
  position: relative;
  width: 100%;
  height: 700px;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 15%;
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
    height: 500px;
    margin-top: 20px;
    &::before,
    &::after {
      width: 15%;
    }
  }
`;

/* --- VALUE PROP SECTION --- */
const TextSection = styled.section`
  padding: 60px 0;
  text-align: center;
`;

/* --- DESIGN GRID --- */
const DesignGridSection = styled.section`
  padding: 40px 0 80px 0;
`;

const GridTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 32px;
  text-align: center;
  color: #222222;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  position: relative;
  z-index: 1;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const DesignCard = styled(motion.div)`
  aspect-ratio: 1.58/1;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  background: #f0f0f0;
`;

/* --- MODAL OVERLAY --- */
const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const ModalContent = styled(motion.div)`
  width: 100%;
  max-width: 440px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalImageContainer = styled(motion.div)`
  width: 100%;
  aspect-ratio: 1.58/1;
  position: relative;
  overflow: hidden;
`;

const ModalBody = styled(motion.div)`
  padding: 20px;
  text-align: left;
`;

const FormSection = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #222;
  margin-bottom: 8px;
`;

const AmountGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 10px;
`;

const AmountButton = styled(motion.button)`
  padding: 10px;
  border: 2px solid ${(props) => (props.$selected ? "#ff385c" : "#e0e0e0")};
  background: ${(props) => (props.$selected ? "#fff5f7" : "white")};
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  color: ${(props) => (props.$selected ? "#ff385c" : "#222")};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #ff385c;
    background: #fff5f7;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #ff385c;
  }

  &::placeholder {
    color: #999;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  min-height: 70px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #ff385c;
  }

  &::placeholder {
    color: #999;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;

  &:hover {
    background: white;
  }
`;

/* --- FEATURES 3-COL --- */
const FeatureSection = styled.section`
  padding: 60px 0;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 48px;
  text-align: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const FeatureTitle = styled.h4`
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #222222;
`;

const FeatureText = styled.p`
  font-size: 0.95rem;
  color: #222222;
  line-height: 1.4;
`;

/* --- CORPORATE SECTION --- */
const CorporateSection = styled.section`
  background: #f7f7f7;
  padding: 80px 0;
  margin: 40px 0;
`;

const CorporateLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 60px;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    text-align: center;
    button {
      margin: 0 auto;
    }
  }
`;

const Corp3DWrapper = styled.div`
  position: relative;
  height: 500px;
  width: 100%;

  @media (max-width: 900px) {
    height: 400px;
    margin-top: 40px;
  }
`;

/* --- FAQ SECTION --- */
const FAQSection = styled.section`
  padding: 80px 0;
  max-width: 800px;
  margin: 0 auto;
`;

const FAQItem = styled.div`
  border-bottom: 1px solid #dddddd;
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
    font-size: 1.125rem;
    color: #222;
  }
`;

const FAQContent = styled(motion.div)`
  overflow: hidden;
  color: #222222;
  font-size: 1rem;
  line-height: 1.6;
`;

// --- 3D COMPONENTS (HERO & CAROUSEL) ---

function AutoRotateRig({ children }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    groupRef.current.rotation.y += delta * 0.1;
    easing.damp3(
      state.camera.position,
      [-state.pointer.x * 2, state.pointer.y + 1.5, 10],
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
  const ref = useRef();
  const [hovered, hover] = useState(false);
  const pointerOver = (e) => (e.stopPropagation(), hover(true));
  const pointerOut = () => hover(false);

  useFrame((state, delta) => {
    easing.damp3(ref.current.scale, hovered ? 1.25 : 1, 0.1, delta);
    easing.damp(
      ref.current.material,
      "radius",
      hovered ? 0.2 : 0.05,
      0.2,
      delta,
    );
    easing.damp(ref.current.material, "zoom", 1, 0.2, delta);
  });

  return (
    <DreiImage
      ref={ref}
      url={url}
      transparent
      side={THREE.FrontSide}
      onPointerOver={pointerOver}
      onPointerOut={pointerOut}
      // Explicitly enable shadow casting on the underlying mesh
      castShadow
      {...props}
    >
      <bentPlaneGeometry args={[0.05, 1.6, 1, 20, 20]} />
    </DreiImage>
  );
}

const HeroCarouselScene = () => {
  return (
    <>
      <color attach="background" args={["#ffffff"]} />
      <fog attach="fog" args={["#f0f0f0", 8, 14]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-bias={-0.001}
      />
      <directionalLight position={[-5, 3, -3]} intensity={0.4} />
      <Environment preset="city" />

      <AutoRotateRig>
        <GiftCardCarousel />
      </AutoRotateRig>

      <ContactShadows
        position={[0, -1.2, 0]} // Ground plane positioned below cards
        opacity={0.6}
        scale={12}
        blur={2.5}
        far={3}
        color="#000000"
      />
    </>
  );
};

// --- 3D COMPONENTS (BUSINESS SECTION SHUFFLE) ---

function ShuffleDeck() {
  // Select specific diverse cards from your imported list
  const [textures] = useTexture([
    HERO_CARD_IMAGES[0], // Card 1 (Usually the primary)
    HERO_CARD_IMAGES[4], // Card 5 (A different style/color)
    HERO_CARD_IMAGES[6], // Card 7 (Another unique one)
  ]);
  const [order, setOrder] = useState([0, 1, 2]); // Indices of textures

  // Cycle the cards every few seconds
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
      {/* 
          We render 3 cards. 
          The logical "order" array determines which texture goes where physically.
          order[0] = Front card
          order[1] = Middle card
          order[2] = Back card
       */}
      {order.map((textureIndex, i) => (
        <ShufflingCard
          key={textureIndex}
          texture={textures[textureIndex]}
          positionIndex={i} // 0 is front, 2 is back
        />
      ))}
    </group>
  );
}

function ShufflingCard({ texture, positionIndex }) {
  const ref = useRef();

  // Calculate target transforms based on stack position (0 = front)
  // Front: 0,0,0
  // Mid: 0.15, 0.05, -0.2
  // Back: 0.3, 0.1, -0.4

  const x = positionIndex * 0.15;
  const y = positionIndex * 0.05;
  const z = positionIndex * -0.2;
  const rotY = -positionIndex * 0.1;
  const rotZ = -positionIndex * 0.05;

  useFrame((state, delta) => {
    // Smoothly animate to the target position based on current index
    easing.damp3(ref.current.position, [x, y, z], 0.3, delta);
    easing.damp3(ref.current.rotation, [0.1, rotY, rotZ], 0.3, delta);
  });

  return (
    <RoundedBox
      ref={ref}
      args={[2.6, 1.6, 0.02]} // Thin box for card
      radius={0.08} // Rounded corners
      smoothness={4}
      castShadow
      receiveShadow
    >
      {/* 
         Material array for Box: 
         0:right, 1:left, 2:top, 3:bottom, 4:front, 5:back 
         We only want the texture on the front face (index 4).
      */}
      <meshStandardMaterial attach="material-0" color="#f0f0f0" />
      <meshStandardMaterial attach="material-1" color="#f0f0f0" />
      <meshStandardMaterial attach="material-2" color="#f0f0f0" />
      <meshStandardMaterial attach="material-3" color="#f0f0f0" />
      <meshStandardMaterial attach="material-4" map={texture} roughness={0.4} />
      <meshStandardMaterial attach="material-5" color="#eeeeee" />
    </RoundedBox>
  );
}

const BusinessScene = () => {
  return (
    <>
      <color attach="background" args={["#f7f7f7"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[-5, 5, 5]} intensity={1} castShadow />
      <Environment preset="studio" />

      <ShuffleDeck />

      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
        color="#000000"
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
  const [selectedId, setSelectedId] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleUnsupported = () => {
    message.info("Our developers are building this! Check back in a few days.");
  };

  const handleBuy = () => {
    message.success("Added to cart!");
    setSelectedId(null);
  };

  return (
    <ConfigProvider theme={theme}>
      <GlobalStyle />
      <Header
        hamburgerColor="#111"
        dropdownButtonColor="#111"
        dropdownButtonHoverColor="#ff385c"
        dropdownButtonOutlineColor="#111"
        logoTitleColor="#ff385c"
      />

      <PageWrapper>
        {/* HERO SECTION */}
        <HeroSection>
          <Container>
            <Headline>
              ClassEasily
              <br />
              gift cards
            </Headline>
            <SubHeadline>
              So many fun experiences to discover. Give them the freedom to
              explore.
            </SubHeadline>
            <div style={{ textAlign: "center" }}>
              <BuyButton whileTap={{ scale: 0.95 }}>Buy now</BuyButton>
            </div>

            <HeroVisual>
              <Suspense fallback={null}>
                <Canvas
                  shadows
                  camera={{ position: [0, 0, 10], fov: 15 }}
                  gl={{ antialias: true, alpha: true }}
                  dpr={[1, 2]}
                >
                  <HeroCarouselScene />
                </Canvas>
              </Suspense>
            </HeroVisual>
          </Container>
        </HeroSection>

        {/* VALUE PROP TEXT */}
        <TextSection>
          <Container>
            <SectionTitle>You give. They go.</SectionTitle>
            <p
              style={{
                maxWidth: 600,
                margin: "0 auto",
                lineHeight: "1.5",
                color: "#222",
              }}
            >
              Give the gift of unforgettable experiences. Our gift cards unlock
              a world of activities, from making something tasty to making neon
              signs. Perfect for birthdays, holidays, or just because.
            </p>
            <div style={{ marginTop: 24 }}>
              <span style={{ fontSize: "0.9rem", color: "#222" }}>
                Interested in corporate gifting?
              </span>
              <LinkText onClick={handleUnsupported}>
                Check out corporate options
              </LinkText>
            </div>
          </Container>
        </TextSection>

        {/* CARD GRID WITH FRAMER MOTION TRANSITION */}
        <DesignGridSection>
          <Container>
            <GridTitle>Pick the vibe</GridTitle>
            <CardGrid>
              {HERO_CARD_IMAGES.slice(0, 6).map((src, i) => (
                <DesignCard
                  key={i}
                  layoutId={src}
                  onClick={() => setSelectedId(src)}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                >
                  <Image
                    src={src}
                    alt="Card design"
                    fill
                    style={{ objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      left: 16,
                      zIndex: 2,
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    </svg>
                  </div>
                </DesignCard>
              ))}
            </CardGrid>
          </Container>

          {/* EXPANDED CARD MODAL */}
          <AnimatePresence>
            {selectedId && (
              <Overlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                onClick={() => setSelectedId(null)}
              >
                <ModalContent
                  layoutId={selectedId}
                  onClick={(e) => e.stopPropagation()}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 40,
                    mass: 0.5,
                    restDelta: 0.001,
                  }}
                >
                  <ModalImageContainer>
                    <Image
                      src={selectedId}
                      alt="Selected card"
                      fill
                      style={{ objectFit: "cover" }}
                    />
                    <CloseButton onClick={() => setSelectedId(null)}>
                      <X size={18} color="#222" />
                    </CloseButton>
                  </ModalImageContainer>

                  <ModalBody
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.1,
                      duration: 0.25,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.15rem",
                        fontWeight: 700,
                        marginBottom: "4px",
                      }}
                    >
                      Customize your gift
                    </h3>
                    <p
                      style={{
                        marginBottom: "16px",
                        color: "#666",
                        fontSize: "0.875rem",
                      }}
                    >
                      Choose an amount and add a personal touch
                    </p>

                    <FormSection>
                      <Label>Gift Amount</Label>
                      <AmountGrid>
                        <AmountButton
                          type="button"
                          $selected={false}
                          whileTap={{ scale: 0.95 }}
                        >
                          $25
                        </AmountButton>
                        <AmountButton
                          type="button"
                          $selected={true}
                          whileTap={{ scale: 0.95 }}
                        >
                          $50
                        </AmountButton>
                        <AmountButton
                          type="button"
                          $selected={false}
                          whileTap={{ scale: 0.95 }}
                        >
                          $100
                        </AmountButton>
                      </AmountGrid>
                      <Input
                        type="number"
                        placeholder="Or enter custom amount"
                      />
                    </FormSection>

                    <FormSection>
                      <Label>Recipient Email</Label>
                      <Input type="email" placeholder="friend@example.com" />
                    </FormSection>

                    <FormSection>
                      <Label>Personal Message (Optional)</Label>
                      <TextArea placeholder="Write a thoughtful note..." />
                    </FormSection>

                    <BuyButton
                      onClick={handleBuy}
                      style={{ width: "100%" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Continue to Payment
                    </BuyButton>
                  </ModalBody>
                </ModalContent>
              </Overlay>
            )}
          </AnimatePresence>
        </DesignGridSection>

        {/* FEATURES */}
        <FeatureSection>
          <Container>
            <FeatureGrid>
              <div>
                <FeatureTitle>You choose the amount</FeatureTitle>
                <FeatureText>
                  Pick a design, set the budget, write a note. Done. They handle
                  the rest (the fun part).
                </FeatureText>
              </div>
              <div>
                <FeatureTitle>Zero lag time</FeatureTitle>
                <FeatureText>
                  Forgot a birthday? We won't tell. Send it via email instantly
                  or schedule it for the exact right moment.
                </FeatureText>
              </div>
              <div>
                <FeatureTitle>Forever valid</FeatureTitle>
                <FeatureText>
                  Life gets busy. That's why our credits never expire. The
                  experience will be waiting whenever they are.
                </FeatureText>
              </div>
            </FeatureGrid>
          </Container>
        </FeatureSection>

        {/* CORPORATE SECTION */}
        <CorporateSection>
          <CorporateLayout>
            <div>
              <h2
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  margin: "0 0 16px 0",
                  lineHeight: 1.1,
                  color: "#222",
                }}
              >
                Team building, <br /> just got upgraded.
              </h2>
              <p
                style={{
                  fontSize: "1rem",
                  color: "#222",
                  marginBottom: 24,
                  lineHeight: 1.5,
                }}
              >
                Give something that creates genuine excitement, not just
                clutter. Our gift cards unlock a world of experiences, perfect
                for showing appreciation to teams and clients alike.
              </p>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: "0.9rem", color: "#222" }}>
                  Planning a big order?
                </span>
                <span
                  onClick={handleUnsupported}
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    textDecoration: "underline",
                    cursor: "pointer",
                    color: "#222",
                    marginLeft: 4,
                  }}
                >
                  Talk to our sales team
                </span>
              </div>
              <DarkButton
                onClick={handleUnsupported}
                whileTap={{ scale: 0.95 }}
              >
                Start a bulk order
              </DarkButton>
            </div>

            <Corp3DWrapper>
              <Suspense fallback={null}>
                <Canvas
                  shadows
                  camera={{ position: [0, 0, 4.5], fov: 40 }}
                  gl={{ antialias: true }}
                  dpr={[1, 2]}
                >
                  <BusinessScene />
                </Canvas>
              </Suspense>
            </Corp3DWrapper>
          </CorporateLayout>
        </CorporateSection>

        {/* FAQ */}
        <Container>
          <FAQSection>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                marginBottom: 40,
                color: "#222",
              }}
            >
              Frequently asked questions
            </h2>
            {FAQS.map((item, index) => (
              <FAQItem key={index}>
                <FAQTrigger onClick={() => toggleFaq(index)}>
                  <span style={{ color: "#222" }}>{item.q}</span>
                  {openFaq === index ? (
                    <ChevronUp size={20} color="#222" />
                  ) : (
                    <ChevronDown size={20} color="#222" />
                  )}
                </FAQTrigger>
                <AnimatePresence>
                  {openFaq === index && (
                    <FAQContent
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div style={{ paddingBottom: 24 }}>{item.a}</div>
                    </FAQContent>
                  )}
                </AnimatePresence>
              </FAQItem>
            ))}
            <div style={{ marginTop: 32, fontSize: "0.9rem", color: "#222" }}>
              Have more burning questions? Visit the{" "}
              <span
                style={{
                  fontWeight: 600,
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Help Center
              </span>
              .
            </div>
          </FAQSection>
        </Container>
      </PageWrapper>
      <FooterClient />
    </ConfigProvider>
  );
}
