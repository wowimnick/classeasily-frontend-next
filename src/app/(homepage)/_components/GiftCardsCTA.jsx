"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  Suspense,
} from "react";
import styled from "styled-components";
import { Button as AntButton } from "antd";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

// --- THREE JS IMPORTS ---
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  useTexture,
  Float,
} from "@react-three/drei";
import * as THREE from "three";

// --- ASSET IMPORTS ---
import Card1 from "@/assets/card1.png"; // Red/Pinkish card usually
import Card5 from "@/assets/Card 9.png"; // Dark/Premium card usually

const GiftCardSection = styled.section`
  padding: 5rem 2rem;
  position: relative;
  overflow: hidden;
  background: radial-gradient(
    circle at top center,
    rgba(255, 255, 255, 0.8),
    #ffffff 60%
  );

  @media (max-width: 1024px) {
    padding: 4rem 1.5rem;
  }
`;

// --- Layouts ---

const ContentWrapper = styled.div`
  max-width: 1300px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 4rem;
  align-items: center;

  @media (max-width: 1024px) {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: center;
  }
`;

const TextContent = styled(motion.div)`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  @media (max-width: 1024px) {
    align-items: center;
    text-align: center;
    order: 3;
    width: 100%;
  }
`;

const CardsArea = styled.div`
  position: relative;
  height: 500px; /* Increased slightly for 3D canvas headroom */
  width: 100%;
  z-index: 1;

  @media (max-width: 1024px) {
    height: 350px;
    order: 2;
    margin-top: -1rem;
    margin-bottom: -1rem;
  }

  @media (max-width: 480px) {
    height: 300px;
  }
`;

// --- Typography ---

const MobileTitle = styled.h2`
  display: none;
  font-size: clamp(2rem, 5vw, 2.5rem);
  font-weight: 700;
  line-height: 1.1;
  color: #111;
  text-align: center;
  margin: 0;
  width: 100%;
  order: 1;

  @media (max-width: 1024px) {
    display: block;
  }
`;

const DesktopTitle = styled.h2`
  font-size: clamp(2.2rem, 5vw, 3.2rem);
  font-weight: 700;
  margin-bottom: 1.2rem;
  line-height: 1.1;
  color: #1a1a1a;
  margin-top: 0;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const Description = styled.p`
  font-size: clamp(1rem, 1.5vw, 1.1rem);
  color: #111;
  line-height: 1.6;
  margin-bottom: 2.5rem;
  margin-top: 0;
  max-width: 50ch;

  @media (max-width: 1024px) {
    margin-bottom: 2rem;
    font-size: 1rem;
    padding: 0 1rem;
  }
`;

// --- 3D GEOMETRY & MATERIALS ---

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

// Reusable 3D Card Component
const GlossyCardMesh = React.forwardRef(
  ({ textureUrl, envMapIntensity = 0.8, ...props }, ref) => {
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
      <mesh ref={ref} castShadow receiveShadow {...props}>
        <extrudeGeometry
          ref={geometryRef}
          args={[cardShape, extrudeSettings]}
        />
        {/* Face Material */}
        <meshPhysicalMaterial
          attach="material-0"
          map={texture}
          color="#ffffff"
          metalness={0.1}
          roughness={0.2}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          ior={1.5}
          reflectivity={0.9}
          envMapIntensity={envMapIntensity}
        />
        {/* Edge Material */}
        <meshStandardMaterial
          attach="material-1"
          color="#f0f0f0"
          roughness={0.3}
        />
      </mesh>
    );
  },
);
GlossyCardMesh.displayName = "GlossyCardMesh";

// --- 3D SCENE LOGIC ---

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

const CTAScene = ({ isMobile }) => {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Environment preset="city" />

      <group
        position={[0, isMobile ? -0.2 : 0, 0]}
        scale={isMobile ? 0.9 : 1.1}
      >
        {/* Back Card (Dark/Premium) - Tilted left */}
        <Float
          speed={2}
          rotationIntensity={0.2}
          floatIntensity={0.5}
          position={[-0.8, 0.4, -1]}
        >
          <GlossyCardMesh
            textureUrl={Card5.src}
            rotation={[0.1, 0.3, -0.2]}
            scale={0.9}
          />
        </Float>

        {/* Front Card (Red/Vibrant) - Tilted right, overlapping */}
        <Float
          speed={2.5}
          rotationIntensity={0.4}
          floatIntensity={0.8}
          position={[0.5, -0.3, 0.5]}
        >
          <GlossyCardMesh textureUrl={Card1.src} rotation={[0, -0.2, 0.1]} />
        </Float>
      </group>

      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.5}
        scale={15}
        blur={2}
        far={4.5}
        color="#000000"
      />
    </>
  );
};

const GiftCardsCTA = () => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isNavigating, setIsNavigating] = useState(false);

  // FIX: Force remount logic to prevent WebGL Context crash on navigation
  const [canvasKey, setCanvasKey] = useState(0);

  useEffect(() => {
    // Increment key on mount to force fresh Canvas instance
    setCanvasKey((prev) => prev + 1);

    // Prefetch the giftcards page for instant navigation
    router.prefetch("/giftcards/");
  }, [router]);

  const handleBuyClick = () => {
    setIsNavigating(true);
    router.push("/giftcards/");
  };

  return (
    <GiftCardSection aria-labelledby="giftcard-title">
      <ContentWrapper>
        {/* Mobile Title (Order 1) */}
        <MobileTitle>Gift a fun experience</MobileTitle>

        {/* Text Content */}
        <TextContent
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <DesktopTitle>Gift a fun experience</DesktopTitle>

          <Description>
            The best gifts aren't things, they're moments. Let them pick their
            own vibe, from salsa dancing to sushi rolling. Instant delivery,
            zero wrapping paper required.
          </Description>

          <AntButton
            type="primary"
            size="large"
            onClick={handleBuyClick}
            loading={isNavigating} // Use Ant Design's native loading state
            style={{
              padding: "1rem 2.5rem",
              height: "auto",
              lineHeight: "1.5",
            }}
          >
            <>
              Purchase Gift Card{" "}
              <ArrowRight size={18} style={{ marginLeft: "8px" }} />
            </>
          </AntButton>
        </TextContent>

        {/* 3D Cards Area */}
        <CardsArea>
          <Suspense fallback={null}>
            {/* 
                FIX: Only render Canvas when canvasKey > 0 
                This ensures it mounts cleanly after client-side hydration
            */}
            {canvasKey > 0 && (
              <Canvas
                key={canvasKey}
                shadows
                dpr={[1, 2]}
                camera={{ position: [0, 0, 6], fov: 50 }}
                style={{ width: "100%", height: "100%" }}
              >
                <CTAScene isMobile={isMobile} />
              </Canvas>
            )}
          </Suspense>
        </CardsArea>
      </ContentWrapper>
    </GiftCardSection>
  );
};

export default GiftCardsCTA;
