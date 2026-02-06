"use client";

import React, {
  useState,
  Suspense,
  useRef,
  useLayoutEffect,
  useEffect,
  memo,
} from "react";
import styled, { createGlobalStyle, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Mail,
  User,
  Gift,
  Check,
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
// --- ANT DESIGN IMPORTS ---
import { ConfigProvider, Input, message } from "antd";
import { theme } from "@/components/theme";
import dayjs from "dayjs";

import Header from "@/components/layout/SharedMainClientHeader";
import FooterClient from "@/components/homepage/FooterClient";

// --- THREE JS IMPORTS ---
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, ContactShadows, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";

// --- ASSETS ---
import Card1 from "@/assets/card1.png";
import Card2 from "@/assets/Card 7.png";
import Card3 from "@/assets/Card 8.png";
import Card4 from "@/assets/Card 6.png";
import Card5 from "@/assets/Card 9.png";
import Card6 from "@/assets/Card 10.png";
import Card7 from "@/assets/Card 11.png";

const CARD_IMAGES = [
  Card1.src,
  Card2.src,
  Card3.src,
  Card4.src,
  Card5.src,
  Card6.src,
  Card7.src,
];

// --- PRELOAD TEXTURES TO PREVENT FLICKERING ---
CARD_IMAGES.forEach((url) => useTexture.preload(url));

// --- 3D GEOMETRY ---
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

const extrudeSettings = { depth: CARD_THICKNESS, bevelEnabled: false };

// --- 3D COMPONENTS ---

const GlossyCardMesh = React.forwardRef(
  (
    {
      textureUrl,
      envMapIntensity = 1,
      opacity = 1,
      transparent = true,
      ...props
    },
    ref,
  ) => {
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
    }, [textureUrl]);

    return (
      <mesh ref={ref} castShadow receiveShadow {...props}>
        <extrudeGeometry
          ref={geometryRef}
          args={[cardShape, extrudeSettings]}
        />
        {/* Material 0: The Front Face (Textured) */}
        <meshPhysicalMaterial
          attach="material-0"
          map={texture}
          color="#ffffff"
          roughness={0.15}
          metalness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          ior={1.5}
          reflectivity={0.5}
          envMapIntensity={envMapIntensity}
          transparent={transparent}
          opacity={opacity}
        />
        {/* Material 1: The Sides/Back (Plain) */}
        <meshStandardMaterial
          attach="material-1"
          color="#f5f5f5"
          roughness={0.3}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>
    );
  },
);
GlossyCardMesh.displayName = "GlossyCardMesh";

function FlippableCard({ targetTextureUrl }) {
  const groupRef = useRef();

  // Refs to access the meshes directly for performance-heavy opacity updates
  const primaryMeshRef = useRef();
  const secondaryMeshRef = useRef();

  // State to manage which textures are currently on the stage
  // current = the one we are transitioning TO
  // previous = the one we are transitioning FROM
  const [textureState, setTextureState] = useState({
    current: targetTextureUrl,
    previous: null,
  });

  const rotationTarget = useRef(0);
  const currentRotation = useRef(0);

  // Fade progress: 0 = "previous" is fully visible, 1 = "current" is fully visible
  const fadeProgress = useRef(1);

  useEffect(() => {
    // Detect if the target texture has changed
    if (targetTextureUrl !== textureState.current) {
      // 1. Spin the card
      rotationTarget.current += Math.PI * 2;

      // 2. Set up the fade
      // add sleep
      setTimeout(() => {
        setTextureState({
          previous: textureState.current,
          current: targetTextureUrl,
        });
        // Reset fade progress to 0 (start fading)
        fadeProgress.current = 0;
      }, 200);
    }
  }, [targetTextureUrl, textureState.current]);

  useFrame((state, delta) => {
    // --- 1. Rotation Logic ---
    easing.damp(currentRotation, "current", rotationTarget.current, 0.4, delta);

    const MAX_TILT = 0.3;
    const mouseX = THREE.MathUtils.clamp(
      state.pointer.x * 0.5,
      -MAX_TILT,
      MAX_TILT,
    );
    const mouseY = THREE.MathUtils.clamp(
      state.pointer.y * 0.5,
      -MAX_TILT,
      MAX_TILT,
    );

    const t = state.clock.getElapsedTime();
    const floatY = Math.sin(t / 2) * 0.1;

    if (groupRef.current) {
      groupRef.current.rotation.y = currentRotation.current + mouseX;
      groupRef.current.rotation.x = -mouseY + Math.cos(t / 2) * 0.05;
      groupRef.current.position.y = floatY;
    }

    // --- 2. Fade Logic ---
    // If we have a 'previous' texture, we are in a transition or finishing one
    if (textureState.previous) {
      // Advance fade progress quickly (0.2 damping is fast)
      easing.damp(fadeProgress, "current", 1, 0.2, delta);

      const alpha = fadeProgress.current;

      // Primary Mesh (The New Card): Fades IN (0 -> 1)
      if (primaryMeshRef.current) {
        // We access materials array: [0] is face, [1] is sides
        if (primaryMeshRef.current.material[0])
          primaryMeshRef.current.material[0].opacity = alpha;
        if (primaryMeshRef.current.material[1])
          primaryMeshRef.current.material[1].opacity = alpha;
      }

      // Secondary Mesh (The Old Card): Fades OUT (1 -> 0)
      if (secondaryMeshRef.current) {
        if (secondaryMeshRef.current.material[0])
          secondaryMeshRef.current.material[0].opacity = 1 - alpha;
        if (secondaryMeshRef.current.material[1])
          secondaryMeshRef.current.material[1].opacity = 1 - alpha;
      }

      // Cleanup: If fade is basically done (0.999), remove the 'previous' from state to stop rendering it
      if (alpha > 0.999) {
        setTextureState((prev) => ({ ...prev, previous: null }));
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* 
        PRIMARY MESH: The "Current" or "New" Card.
        Always visible.
      */}
      <GlossyCardMesh
        ref={primaryMeshRef}
        textureUrl={textureState.current}
        envMapIntensity={1.5}
        // If we are transitioning, we scale this slightly larger to prevent Z-fighting
        // with the fading-out card underneath it.
        scale={textureState.previous ? [1.002, 1.002, 1.002] : [1, 1, 1]}
      />

      {/* 
        SECONDARY MESH: The "Previous" or "Old" Card.
        Only rendered during transition.
      */}
      {textureState.previous && (
        <GlossyCardMesh
          ref={secondaryMeshRef}
          textureUrl={textureState.previous}
          envMapIntensity={1.5}
          // Opacity is handled in useFrame
        />
      )}
    </group>
  );
}

// Separate scene to avoid re-mounting Canvas
const GiftCardScene = memo(({ textureUrl }) => (
  <Canvas
    shadows
    camera={{ position: [0, 0, 4.5], fov: 45 }}
    gl={{ antialias: true, alpha: true }}
  >
    <ambientLight intensity={0.8} />
    <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

    {/* By putting Suspense INSIDE, the lights/env stay alive even if card suspends */}
    <Suspense fallback={null}>
      <Environment preset="city" />
      <FlippableCard targetTextureUrl={textureUrl} />
    </Suspense>

    <ContactShadows
      position={[0, -1.2, 0]}
      opacity={0.4}
      scale={10}
      blur={2.5}
      far={4}
    />
  </Canvas>
));
GiftCardScene.displayName = "GiftCardScene";

// --- CUSTOM CALENDAR COMPONENT ---

const CalContainer = styled.div`
  width: 100%;
  max-width: 320px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  padding: 20px;
  user-select: none;
`;

const CalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #000;
  }
`;

const CalNavBtn = styled.button`
  background: transparent;
  border: 1px solid #eee;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #000;
  transition: all 0.2s;

  &:hover {
    background: #f7f7f7;
    border-color: #ddd;
  }
`;

const CalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const CalDayLabel = styled.div`
  text-align: center;
  font-size: 0.75rem;
  color: #888;
  font-weight: 600;
  margin-bottom: 8px;
`;

const CalDayBtn = styled.button`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: 500;
  color: #000;
  cursor: pointer;
  position: relative;

  ${(props) =>
    props.disabled &&
    css`
      color: #ccc;
      cursor: not-allowed;
      text-decoration: line-through;
    `}

  ${(props) =>
    !props.disabled &&
    !props.$selected &&
    css`
      &:hover {
        background: #f0f0f0;
        font-weight: 600;
      }
    `}

  ${(props) =>
    props.$selected &&
    css`
      background: #ff385c;
      color: white;
      font-weight: 600;
    `}
  
  ${(props) =>
    props.$today &&
    !props.$selected &&
    css`
      color: #ff385c;
      font-weight: 700;

      &::after {
        content: "";
        position: absolute;
        bottom: 6px;
        width: 4px;
        height: 4px;
        background: #ff385c;
        border-radius: 50%;
      }
    `}
`;

function CustomCalendar({ value, onChange }) {
  const [currentMonth, setCurrentMonth] = useState(dayjs(value || undefined));

  const today = dayjs();
  const selectedDate = value ? dayjs(value) : null;

  const startOfMonth = currentMonth.startOf("month");
  const daysInMonth = currentMonth.daysInMonth();
  const startDayOfWeek = startOfMonth.day(); // 0 = Sunday

  const handlePrevMonth = () =>
    setCurrentMonth(currentMonth.subtract(1, "month"));
  const handleNextMonth = () => setCurrentMonth(currentMonth.add(1, "month"));

  const handleDayClick = (day) => {
    const newDate = currentMonth.date(day);
    onChange(newDate);
  };

  const daysArray = [];
  // Empty slots for previous month
  for (let i = 0; i < startDayOfWeek; i++) {
    daysArray.push(null);
  }
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <CalContainer>
      <CalHeader>
        <CalNavBtn onClick={handlePrevMonth}>
          <ChevronLeft size={16} />
        </CalNavBtn>
        <h4>{currentMonth.format("MMMM YYYY")}</h4>
        <CalNavBtn onClick={handleNextMonth}>
          <ChevronRight size={16} />
        </CalNavBtn>
      </CalHeader>

      <CalGrid>
        {weekDays.map((d) => (
          <CalDayLabel key={d}>{d}</CalDayLabel>
        ))}

        {daysArray.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;

          const thisDate = currentMonth.date(day);
          const isPast = thisDate.isBefore(today, "day");
          const isSelected =
            selectedDate && thisDate.isSame(selectedDate, "day");
          const isToday = thisDate.isSame(today, "day");

          return (
            <CalDayBtn
              key={day}
              disabled={isPast}
              $selected={isSelected}
              $today={isToday}
              onClick={() => !isPast && handleDayClick(day)}
            >
              {day}
            </CalDayBtn>
          );
        })}
      </CalGrid>
    </CalContainer>
  );
}

// --- STYLES ---

const CORPORATE_COLOR = "#ff385c";

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  padding-top: 100px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #000;

  @media (max-width: 768px) {
    padding-top: 80px;
  }
`;

const MainContainer = styled.div`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 24px;

  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 80px;
  position: relative;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 350px;
    gap: 40px;
  }

  @media (max-width: 900px) {
    display: flex;
    flex-direction: column;
    padding: 20px 16px;
    padding-bottom: 120px;
    gap: 0;
  }
`;

const LeftColumn = styled.div`
  width: 100%;
  @media (max-width: 900px) {
    order: 2;
  }
`;

const RightColumn = styled.div`
  position: sticky;
  top: 120px;
  align-self: start;
  height: fit-content;

  @media (max-width: 900px) {
    display: none;
  }
`;

const MobileVisualHeader = styled.div`
  display: none;
  width: 100%;
  height: 280px;
  background: #f9f9f9;
  border-radius: 16px;
  margin-bottom: 32px;
  overflow: hidden;
  order: 1;

  @media (max-width: 900px) {
    display: block;
  }
`;

const MobileStickyFooter = styled.div`
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: white;
  padding: 16px 24px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  z-index: 100;
  border-top: 1px solid #f0f0f0;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 900px) {
    display: flex;
  }
`;

const MobilePrice = styled.div`
  display: flex;
  flex-direction: column;

  span:first-child {
    font-size: 0.8rem;
    color: #666;
  }
  span:last-child {
    font-size: 1.1rem;
    font-weight: 700;
    color: #000;
  }
`;

const MobileCheckoutBtn = styled(motion.button)`
  background: ${CORPORATE_COLOR};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
`;

const SectionHeader = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SectionBlock = styled.section`
  margin-bottom: 48px;
`;

const DesignGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
`;

const DesignOption = styled.button`
  position: relative;
  aspect-ratio: 1.58/1;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid
    ${(props) => (props.$selected ? CORPORATE_COLOR : "transparent")};
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  background: #f0f0f0;

  &:hover {
    transform: scale(1.02);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AmountGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
`;

const AmountChip = styled.button`
  padding: 12px 24px;
  border-radius: 30px;
  border: 1px solid ${(props) => (props.$selected ? CORPORATE_COLOR : "#ddd")};
  background: ${(props) => (props.$selected ? CORPORATE_COLOR : "white")};
  color: ${(props) => (props.$selected ? "white" : "#000")};
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${CORPORATE_COLOR};
  }
`;

const CustomAmountInput = styled.div`
  position: relative;
  max-width: 160px;

  .ant-input {
    border-radius: 30px;
    padding-left: 24px;
    height: 45px;
    font-weight: 600;
  }

  span {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    font-weight: 600;
    color: #000;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #444;
`;

const InputGroup = styled.div`
  margin-bottom: 24px;
`;

const DeliveryToggle = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const ToggleOption = styled.button`
  flex: 1;
  padding: 16px;
  border: 1px solid ${(props) => (props.$selected ? CORPORATE_COLOR : "#eee")};
  border-radius: 12px;
  background: ${(props) => (props.$selected ? "#fff5f7" : "white")};
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;

  &:hover {
    border-color: ${CORPORATE_COLOR};
  }

  h4 {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0;
    color: ${(props) => (props.$selected ? CORPORATE_COLOR : "#000")};
  }

  p {
    font-size: 0.8rem;
    color: #666;
    margin: 4px 0 0 0;
  }
`;

const StickyCard = styled.div`
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
`;

const CanvasContainer = styled.div`
  width: 100%;
  height: 250px;
  background: #f9f9f9;
  border-radius: 16px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 0.95rem;
  color: #000;

  &.total {
    margin-top: 12px;
    padding-top: 16px;
    border-top: 1px solid #eee;
    font-weight: 700;
    font-size: 1.125rem;
    color: #000;
  }

  span {
    font-weight: 600;
  }
`;

const CheckoutButton = styled(motion.button)`
  background: ${CORPORATE_COLOR};
  color: white;
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  margin-top: 16px;
  cursor: pointer;

  &:hover {
    background: #d9324e;
  }
`;

const BottomContainer = styled.div`
  max-width: 800px;
  margin: 0 auto 80px auto;
  padding: 0 24px;
  border-top: 1px solid #eee;
  padding-top: 60px;
`;

const FAQItem = styled.div`
  border-bottom: 1px solid #eee;
`;

const FAQTrigger = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 1rem;
  font-weight: 500;
  color: #000;
`;

const FAQContent = styled(motion.div)`
  overflow: hidden;
  color: #000;
  font-size: 0.95rem;
  line-height: 1.6;
`;

const PRESET_AMOUNTS = [25, 50, 100, 150, 200];
const FAQS = [
  {
    q: "Are gift cards physical or digital?",
    a: "Our gift cards are 100% digital. They land in emails instantly (or when you schedule them).",
  },
  {
    q: "What exactly can they book?",
    a: "Anything! From a pottery session in a local studio to a guided food tour downtown.",
  },
  {
    q: "Do gift cards expire?",
    a: "Nope. No expiration dates, no hidden fees. The money stays theirs until they use it.",
  },
  {
    q: "Can I send one to a friend abroad?",
    a: "Absolutely, provided the currency matches.",
  },
];

export default function GiftcardCheckoutPage() {
  const searchParams = useSearchParams();
  const initialIndex = parseInt(searchParams.get("designIndex") || "0");

  const [selectedDesignIndex, setSelectedDesignIndex] = useState(
    initialIndex >= 0 && initialIndex < CARD_IMAGES.length ? initialIndex : 0,
  );
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("email");
  const [openFaq, setOpenFaq] = useState(null);

  // Scheduling State
  const [isScheduled, setIsScheduled] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientEmail: "",
    senderName: "",
    message: "",
    date: null,
  });

  const handleCustomAmountChange = (e) => {
    setCustomAmount(e.target.value);
    setAmount(null);
  };

  const handlePresetClick = (val) => {
    setAmount(val);
    setCustomAmount("");
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const finalAmount = amount || (customAmount ? parseFloat(customAmount) : 0);

  const handleCheckout = () => {
    if (!finalAmount || finalAmount <= 0)
      return message.error("Please enter a valid amount");
    if (deliveryMethod === "email" && !formData.recipientEmail)
      return message.error("Please enter recipient email");

    message.loading("Processing...");
    setTimeout(() => {
      message.success("Proceeding to payment gateway!");
    }, 1000);
  };

  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);

  return (
    <ConfigProvider theme={theme}>
      <Header
        hamburgerColor="#111"
        dropdownButtonColor="#111"
        dropdownButtonHoverColor={CORPORATE_COLOR}
        dropdownButtonOutlineColor="#111"
        logoTitleColor={CORPORATE_COLOR}
      />

      <PageWrapper>
        <MainContainer>
          <MobileVisualHeader>
            {/* The preloading ensures this doesn't flicker even if it suspends briefly */}
            <GiftCardScene textureUrl={CARD_IMAGES[selectedDesignIndex]} />
          </MobileVisualHeader>

          {/* --- LEFT SIDE: CONFIGURATION --- */}
          <LeftColumn>
            {/* 1. Design Selection */}
            <SectionBlock>
              <SectionHeader>
                <lord-icon
                  src="https://cdn.lordicon.com/hwfggmas.json"
                  trigger="in"
                ></lord-icon>
                Select a design
              </SectionHeader>
              <DesignGrid>
                {CARD_IMAGES.map((img, idx) => (
                  <DesignOption
                    key={idx}
                    $selected={selectedDesignIndex === idx}
                    onClick={() => setSelectedDesignIndex(idx)}
                  >
                    <Image
                      src={img}
                      alt={`Card design ${idx}`}
                      width={200}
                      height={126}
                    />
                    {selectedDesignIndex === idx && (
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "#000",
                          borderRadius: "50%",
                          padding: 2,
                        }}
                      >
                        <Check size={14} color="white" />
                      </div>
                    )}
                  </DesignOption>
                ))}
              </DesignGrid>
            </SectionBlock>

            {/* 2. Amount Selection */}
            <SectionBlock>
              <SectionHeader>
                <CreditCard size={22} color={CORPORATE_COLOR} />
                Choose amount
              </SectionHeader>
              <AmountGrid>
                {PRESET_AMOUNTS.map((val) => (
                  <AmountChip
                    key={val}
                    $selected={amount === val}
                    onClick={() => handlePresetClick(val)}
                  >
                    ${val}
                  </AmountChip>
                ))}
                <CustomAmountInput>
                  <span>$</span>
                  <Input
                    type="number"
                    placeholder="Other"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    onFocus={() => setAmount(null)}
                  />
                </CustomAmountInput>
              </AmountGrid>
            </SectionBlock>

            {/* 3. Delivery Method */}
            <SectionBlock>
              <SectionHeader>
                <Mail size={22} color={CORPORATE_COLOR} />
                How would you like to send it?
              </SectionHeader>
              <DeliveryToggle>
                <ToggleOption
                  $selected={deliveryMethod === "email"}
                  onClick={() => setDeliveryMethod("email")}
                >
                  <Mail
                    size={20}
                    color={
                      deliveryMethod === "email" ? CORPORATE_COLOR : "#444"
                    }
                  />
                  <div>
                    <h4>Email to recipient</h4>
                    <p>We'll send it directly to them.</p>
                  </div>
                </ToggleOption>
                <ToggleOption
                  $selected={deliveryMethod === "self"}
                  onClick={() => setDeliveryMethod("self")}
                >
                  <User
                    size={20}
                    color={deliveryMethod === "self" ? CORPORATE_COLOR : "#444"}
                  />
                  <div>
                    <h4>Email to me</h4>
                    <p>Print it out or forward it later.</p>
                  </div>
                </ToggleOption>
              </DeliveryToggle>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                  marginBottom: 20,
                }}
              >
                <InputGroup>
                  <Label>Recipient Name</Label>
                  <Input
                    size="large"
                    placeholder="e.g. Alice"
                    value={formData.recipientName}
                    onChange={(e) =>
                      handleInputChange("recipientName", e.target.value)
                    }
                  />
                </InputGroup>
                {deliveryMethod === "email" && (
                  <InputGroup>
                    <Label>Recipient Email</Label>
                    <Input
                      size="large"
                      type="email"
                      placeholder="alice@example.com"
                      value={formData.recipientEmail}
                      onChange={(e) =>
                        handleInputChange("recipientEmail", e.target.value)
                      }
                    />
                  </InputGroup>
                )}
              </div>

              <InputGroup>
                <Label>Your Name</Label>
                <Input
                  size="large"
                  placeholder="e.g. Bob"
                  value={formData.senderName}
                  onChange={(e) =>
                    handleInputChange("senderName", e.target.value)
                  }
                />
              </InputGroup>

              <InputGroup>
                <Label>Personal Message (Optional)</Label>
                <Input.TextArea
                  rows={4}
                  placeholder="Hope you enjoy this gift! Let's do something fun."
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                />
              </InputGroup>
            </SectionBlock>

            {/* 4. Scheduling */}
            <SectionBlock>
              <SectionHeader>
                <Clock size={22} color={CORPORATE_COLOR} />
                When should we send it?
              </SectionHeader>

              <DeliveryToggle style={{ marginBottom: 10 }}>
                <ToggleOption
                  $selected={!isScheduled}
                  onClick={() => setIsScheduled(false)}
                >
                  <Clock
                    size={20}
                    color={!isScheduled ? CORPORATE_COLOR : "#444"}
                  />
                  <div>
                    <h4>Send Instantly</h4>
                    <p>We'll send it as soon as you pay.</p>
                  </div>
                </ToggleOption>
                <ToggleOption
                  $selected={isScheduled}
                  onClick={() => setIsScheduled(true)}
                >
                  <CalendarIcon
                    size={20}
                    color={isScheduled ? CORPORATE_COLOR : "#444"}
                  />
                  <div>
                    <h4>Schedule for Later</h4>
                    <p>Choose a specific date.</p>
                  </div>
                </ToggleOption>
              </DeliveryToggle>

              <AnimatePresence>
                {isScheduled && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ marginTop: 24 }}>
                      <CustomCalendar
                        value={formData.date}
                        onChange={(val) => handleInputChange("date", val)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </SectionBlock>
          </LeftColumn>

          {/* --- RIGHT SIDE: STICKY PREVIEW --- */}
          <RightColumn>
            <StickyCard>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.2rem" }}>
                Preview
              </h3>

              <CanvasContainer>
                <GiftCardScene textureUrl={CARD_IMAGES[selectedDesignIndex]} />
              </CanvasContainer>

              <div>
                <SummaryRow>
                  <span>Gift Card Value</span>
                  <span>
                    ${finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"}
                  </span>
                </SummaryRow>
                <SummaryRow>
                  <span>Delivery</span>
                  <span style={{ color: "#008a05", fontWeight: 600 }}>
                    Free
                  </span>
                </SummaryRow>
                <SummaryRow className="total">
                  <span>Total</span>
                  <span>
                    ${finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"}
                  </span>
                </SummaryRow>
              </div>

              <CheckoutButton
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckout}
              >
                Checkout
              </CheckoutButton>

              <div
                style={{
                  textAlign: "center",
                  marginTop: 16,
                  fontSize: "0.8rem",
                  color: "#888",
                }}
              >
                Secure SSL Encrypted Payment
              </div>
            </StickyCard>

            <div
              style={{
                marginTop: 24,
                textAlign: "center",
                fontSize: "0.9rem",
                color: "#666",
              }}
            >
              Looking to buy in bulk? <br />
              <a
                href="#"
                style={{
                  textDecoration: "underline",
                  color: "#000",
                  fontWeight: 600,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  message.info("Redirecting to corporate page...");
                }}
              >
                Visit our corporate gift card page.
              </a>
            </div>
          </RightColumn>
        </MainContainer>

        {/* --- MOBILE STICKY FOOTER --- */}
        <MobileStickyFooter>
          <MobilePrice>
            <span>Total</span>
            <span>${finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"}</span>
          </MobilePrice>
          <MobileCheckoutBtn
            whileTap={{ scale: 0.95 }}
            onClick={handleCheckout}
          >
            Checkout
          </MobileCheckoutBtn>
        </MobileStickyFooter>

        {/* --- FAQ SECTION --- */}
        <BottomContainer>
          <SectionHeader>Frequently asked questions</SectionHeader>
          {FAQS.map((item, index) => (
            <FAQItem key={index}>
              <FAQTrigger onClick={() => toggleFaq(index)}>
                <span>{item.q}</span>
                {openFaq === index ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
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
        </BottomContainer>
      </PageWrapper>
      <FooterClient />
    </ConfigProvider>
  );
}
