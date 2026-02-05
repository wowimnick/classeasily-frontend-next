"use client";

import React, {
  useState,
  Suspense,
  useRef,
  useEffect,
  useMemo,
  useLayoutEffect,
} from "react";
import styled, { createGlobalStyle, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { ConfigProvider } from "antd";
import message from "@/lib/message";
import { theme } from "@/components/theme";
import Header from "@/components/layout/SharedMainClientHeader";
import FooterClient from "@/components/homepage/FooterClient";

// --- THREE JS IMPORTS ---
import { Canvas, useFrame, extend } from "@react-three/fiber";
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

const HERO_CARD_IMAGES = [
  Card1.src,
  Card2.src,
  Card3.src,
  Card4.src,
  Card5.src,
  Card6.src,
  Card7.src,
];

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
  padding-top: 100px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  color: #222222;
  background: #ffffff;

  @media (max-width: 768px) {
    padding-top: 80px;
  }
`;

const Container = styled.div`
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

/* --- TYPOGRAPHY --- */
const Headline = styled.h1`
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 800;
  color: #222222;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-align: center;
  margin-bottom: 16px;

  @media (max-width: 768px) {
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
`;

const SectionTitle = styled.h2`
  font-size: clamp(2rem, 4vw, 4rem);
  font-weight: 700;
  color: #222222;
  text-align: center;
  margin-bottom: 16px;
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
  height: 48px;
  padding: 0 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 56, 92, 0.2);

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
  padding: 20px 0 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: visible;

  @media (max-width: 768px) {
    padding: 10px 0 10px 0;
  }
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
    height: 400px;
    margin-top: 20px;

    &::before,
    &::after {
      width: 5%;
    }
  }
`;

/* --- VALUE PROP SECTION --- */
const TextSection = styled.section`
  padding: 60px 0;
  padding-top: 0px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 30px 0;
  }
`;

/* --- NITRO CAROUSEL SECTION --- */
const CarouselSection = styled.section`
  overflow: hidden;
  scroll-margin-top: 100px;
`;

const CarouselWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 400px;

  @media (max-width: 768px) {
    height: 350px;
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
    width: 40px;
    height: 40px;
    ${(props) =>
      props.$left
        ? css`
            left: 10px;
          `
        : css`
            right: 10px;
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

/* --- MODAL OVERLAY --- */
const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const ModalContent = styled(motion.div)`
  width: 100%;
  max-width: 440px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
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
  padding: 24px;
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
  padding: 12px;
  border: 2px solid ${(props) => (props.$selected ? "#ff385c" : "#e0e0e0")};
  background: ${(props) => (props.$selected ? "#fff5f7" : "white")};
  border-radius: 12px;
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
  padding: 12px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 0.9rem;
  font-family: inherit;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #ff385c;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #ff385c;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  color: white;

  &:hover {
    background: rgba(0, 0, 0, 0.7);
  }
`;

/* --- FEATURES 3-COL --- */
const FeatureSection = styled.section`
  padding: 60px 0;

  @media (max-width: 768px) {
    padding: 30px 0;
  }
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
  font-size: 21px;
  font-weight: 800;
  margin-bottom: 8px;
  color: #222222;
`;

const FeatureText = styled.p`
  font-size: 0.95rem;
  color: #555;
  line-height: 1.5;
`;

const CorporateSection = styled.section`
  background: #f7f7f7;
  padding: 80px 0;
  margin: 40px 0;

  @media (max-width: 768px) {
    padding: 40px 0;
    margin: 20px 0;
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
  }
`;

/* --- FAQ SECTION --- */
const FAQSection = styled.section`
  padding: 80px 0;
  max-width: 800px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 40px 0;
  }
`;

const FAQItem = styled.div`
  border-bottom: 1px solid #eee;
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
    font-weight: 500;
    color: #222;
  }

  @media (max-width: 768px) {
    padding: 16px 0;
    span {
      font-size: 1rem;
    }
  }
`;

const FAQContent = styled(motion.div)`
  overflow: hidden;
  color: #555;
  font-size: 1rem;
  line-height: 1.6;
`;

// --- SHARED 3D RESOURCES ---

// 1. Shared Geometry Definitions
const CARD_WIDTH = 3;
const CARD_HEIGHT = 1.9;
const CARD_RADIUS = 0.2;
const CARD_THICKNESS = 0.05;

// Define shape once
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

// 2. Shared Glossy Card Component
// Now accepts `envMapIntensity` so we can tune it per scene.
const GlossyCardMesh = React.forwardRef(
  ({ textureUrl, envMapIntensity = 0.25, ...props }, ref) => {
    const texture = useTexture(textureUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    const geometryRef = useRef();

    // Fix UVs for ExtrudeGeometry
    useLayoutEffect(() => {
      if (geometryRef.current) {
        geometryRef.current.computeBoundingBox();
        const { min, max } = geometryRef.current.boundingBox;
        const uvAttribute = geometryRef.current.attributes.uv;
        const posAttribute = geometryRef.current.attributes.position;

        for (let i = 0; i < posAttribute.count; i++) {
          const xPos = posAttribute.getX(i);
          const yPos = posAttribute.getY(i);
          // Normalize coordinates to 0..1 based on bounding box
          const u = (xPos - min.x) / (max.x - min.x);
          const v = (yPos - min.y) / (max.y - min.y);
          uvAttribute.setXY(i, u, v);
        }
        uvAttribute.needsUpdate = true;
      }
    }, []);

    return (
      <mesh ref={ref} castShadow receiveShadow {...props}>
        <extrudeGeometry
          ref={geometryRef}
          args={[cardShape, extrudeSettings]}
        />
        {/* Front/Back: Glossy Plastic/Laminated Look */}
        <meshPhysicalMaterial
          attach="material-0"
          map={texture}
          color="#ffffff"
          // 1. Base Material: Smooth plastic, not rough paper
          roughness={0.1}
          metalness={0.05} // A tiny bit of metalness helps plastic reflect environment better
          // 2. The Lamination Layer
          clearcoat={1.0}
          clearcoatRoughness={0.05} // Very sharp reflections
          // 3. Physics of Plastic
          ior={1.5} // Index of Refraction for typical PVC plastic
          reflectivity={0.5}
          // 4. Lighting
          envMapIntensity={envMapIntensity}
        />
        {/* Sides: White Plastic */}
        <meshStandardMaterial
          attach="material-1"
          color="#f5f5f5"
          roughness={0.3}
        />
      </mesh>
    );
  },
);
GlossyCardMesh.displayName = "GlossyCardMesh";

// --- 3D HERO COMPONENTS ---

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
  const meshRef = useRef();
  const [hovered, hover] = useState(false);
  const baseScale = 0.5; // Base scale for hero carousel cards

  useFrame((state, delta) => {
    // Animate the scale of the mesh directly
    easing.damp3(
      meshRef.current.scale,
      hovered ? baseScale * 1.15 : baseScale,
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
      <GlossyCardMesh
        ref={meshRef}
        textureUrl={url}
        // BOOSTED REFLECTION for open hero scene
        envMapIntensity={2}
      />
    </group>
  );
}

const HeroCarouselScene = () => (
  <>
    <color attach="background" args={["#ffffff"]} />
    <ambientLight intensity={1} />

    {/* FIX 1: HIGH QUALITY SHADOW MAPS */}
    <directionalLight
      position={[5, 5, 10]}
      intensity={1.5}
      castShadow
      shadow-mapSize={[2048, 2048]} // Increase shadow resolution
      shadow-bias={-0.0001} // Reduce shadow acne on cards
      shadow-camera-left={-10}
      shadow-camera-right={10}
      shadow-camera-top={10}
      shadow-camera-bottom={-10}
    />

    <Environment preset="city" />

    <AutoRotateRig>
      <GiftCardCarousel />
    </AutoRotateRig>

    {/* FIX 2: GROUND THE SHADOWS */}
    <ContactShadows
      position={[0, -1.0, 0]} // Moved up from -1.2 to -1.0 to touch card bottoms
      opacity={0.4}
      scale={20}
      blur={2.5}
      far={4}
      resolution={1024}
      color="#000000"
    />
  </>
);

// --- 3D BUSINESS COMPONENT ---
function ShuffleDeck() {
  const textures = HERO_CARD_IMAGES;
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
        />
      ))}
    </group>
  );
}

function ShufflingCard({ url, positionIndex }) {
  const ref = useRef();
  const x = positionIndex * 0.15;
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
      <GlossyCardMesh
        textureUrl={url}
        scale={0.85}
        // BOOSTED REFLECTION for business scene
        envMapIntensity={2}
      />
    </group>
  );
}

const BusinessScene = () => (
  <>
    <color attach="background" args={["#f7f7f7"]} />

    <ambientLight intensity={1} />
    {/* FIX 1: HIGH QUALITY SHADOW MAPS */}
    <directionalLight
      position={[-5, 8, 5]}
      intensity={1.5}
      castShadow
      shadow-mapSize={[2048, 2048]} // Higher resolution
      shadow-bias={-0.0001} // Fix artifacts
    />

    <Environment preset="city" />

    <ShuffleDeck />

    {/* FIX 2: GROUND THE SHADOWS */}
    <ContactShadows
      position={[0, -1.0, 0]} // Moved up from -1.2 to -1.0
      opacity={0.4}
      scale={10}
      blur={5}
      far={4}
      color="#000000"
    />
  </>
);

// --- NEW 3D NITRO CARD SELECTOR ---

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

  &:hover {
    background: #d9324e;
  }
`;

function NitroCard3D({ index, activeIndex, textureUrl, onSelect, onSetIndex }) {
  const groupRef = useRef();

  const offset = index - activeIndex;
  const isActive = offset === 0;

  useFrame((state, delta) => {
    const spacing = 3.2;
    const targetX = offset * spacing;
    const targetZ = isActive ? 0 : -Math.abs(offset) * 1.5;

    let targetRotY = offset * -0.15;

    // if (isActive) {
    //   targetRotY += state.pointer.x * 0.2;
    //   const tiltX = -state.pointer.y * 0.2;
    //   easing.damp(groupRef.current.rotation, "x", tiltX, 0.2, delta);
    // } else {
    //   easing.damp(groupRef.current.rotation, "x", 0, 0.2, delta);
    // }

    const targetScale = isActive ? 1.1 : 0.85;

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
      {/* 
        This is the "PERFECT" one. 
        We keep the default envMapIntensity (0.25) or set it explicitly.
      */}
      <GlossyCardMesh textureUrl={textureUrl} envMapIntensity={2} />

      {isActive && (
        <Html
          position={[0, -1.4, 0]}
          center
          distanceFactor={5}
          zIndexRange={[100, 0]}
          transform
          style={{ opacity: 1, pointerEvents: "auto" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SelectButton
              onClick={() => onSelect(textureUrl)}
              whileTap={{ scale: 0.95 }}
            >
              Select Design
            </SelectButton>
          </motion.div>
        </Html>
      )}
    </group>
  );
}

const NitroCarouselScene = ({ activeIndex, setActiveIndex, onSelect }) => {
  return (
    <>
      <ambientLight intensity={1} />
      {/* Updated light here too for consistency, though not requested explicitly */}
      <directionalLight
        position={[5, 5, 10]}
        intensity={1.5}
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
          />
        ))}
      </group>

      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.4}
        scale={20}
        blur={2}
        far={4.5}
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
  const selectionSectionRef = useRef(null);

  const [carouselIndex, setCarouselIndex] = useState(3);

  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);
  const handleUnsupported = () =>
    message.info("Our developers are building this! Check back soon.");
  const handleBuy = () => {
    message.success("Added to cart!");
    setSelectedId(null);
  };

  const scrollToSelection = () => {
    selectionSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNext = () =>
    setCarouselIndex((prev) => Math.min(prev + 1, HERO_CARD_IMAGES.length - 1));
  const handlePrev = () => setCarouselIndex((prev) => Math.max(prev - 1, 0));

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
              <BuyButton whileTap={{ scale: 0.95 }} onClick={scrollToSelection}>
                Buy now
              </BuyButton>
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

        {/* 3D SELECTION CAROUSEL */}
        <CarouselSection ref={selectionSectionRef}>
          <Container>
            <CarouselWrapper>
              {/* 2D ARROWS CONTROLLING 3D STATE */}
              <ArrowButton
                onClick={handlePrev}
                disabled={carouselIndex === 0}
                $left
              >
                <ChevronLeft size={24} />
              </ArrowButton>

              <Suspense fallback={null}>
                <Canvas
                  shadows
                  // A slightly wider FOV for the carousel to feel immersive
                  camera={{ position: [0, 0, 8], fov: 35 }}
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
                    onSelect={setSelectedId}
                  />
                </Canvas>
              </Suspense>

              <ArrowButton
                onClick={handleNext}
                disabled={carouselIndex === HERO_CARD_IMAGES.length - 1}
              >
                <ChevronRight size={24} />
              </ArrowButton>
            </CarouselWrapper>
          </Container>
        </CarouselSection>

        {/* MODAL (REUSED LOGIC) */}
        <AnimatePresence>
          {selectedId && (
            <Overlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
            >
              <ModalContent
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <ModalImageContainer>
                  <Image
                    src={selectedId}
                    alt="Selected card"
                    fill
                    style={{ objectFit: "cover" }}
                  />
                  <CloseButton onClick={() => setSelectedId(null)}>
                    <X size={18} />
                  </CloseButton>
                </ModalImageContainer>

                <ModalBody>
                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      marginBottom: "4px",
                    }}
                  >
                    Customize your gift
                  </h3>
                  <p
                    style={{
                      marginBottom: "20px",
                      color: "#666",
                      fontSize: "0.9rem",
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
                    <Input type="number" placeholder="Or enter custom amount" />
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
          <TwoColumnContainer>
            <TextColumn>
              <h2
                style={{
                  fontSize: "clamp(2rem, 4vw, 2.5rem)",
                  fontWeight: 700,
                  margin: "0 0 24px 0",
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

              <div
                style={{
                  display: "flex",
                  justifyContent: "inherit",
                }}
              >
                <DarkButton
                  onClick={handleUnsupported}
                  whileTap={{ scale: 0.95 }}
                >
                  Start a bulk order
                </DarkButton>
              </div>
            </TextColumn>

            {/* RIGHT COLUMN: The 3D Canvas */}
            <VisualColumn>
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
            </VisualColumn>
          </TwoColumnContainer>
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
                  <span>{item.q}</span>
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
