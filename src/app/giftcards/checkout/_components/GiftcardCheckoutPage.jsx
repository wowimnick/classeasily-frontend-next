// --- START OF FILE GiftcardCheckoutPage.jsx ---

"use client";

import React, {
  useState,
  Suspense,
  useRef,
  useLayoutEffect,
  useEffect,
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
} from "lucide-react";
import Image from "next/image";
// --- ANT DESIGN IMPORTS ---
import { ConfigProvider, Input, DatePicker, message } from "antd";
import { theme } from "@/components/theme";

import Header from "@/components/layout/SharedMainClientHeader";
import FooterClient from "@/components/homepage/FooterClient";

// --- THREE JS IMPORTS ---
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  useTexture,
  Float,
} from "@react-three/drei";
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
  ({ textureUrl, envMapIntensity = 1, opacity = 1, ...props }, ref) => {
    // We use a key on the mesh parent to force re-mount if needed,
    // but here we just swap the map.
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
          transparent
          opacity={opacity}
        />
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

// Wrapper that handles the "Flip and Switch" logic
function FlippableCard({ targetTextureUrl }) {
  const meshRef = useRef();
  // We keep track of the texture currently displayed on the mesh
  const [displayedUrl, setDisplayedUrl] = useState(targetTextureUrl);

  // Ref to track rotation animation state
  // We accumulate rotation. If user clicks 3 times, we spin 3 times.
  const rotationTarget = useRef(0);
  const currentRotation = useRef(0);

  // Detect change in targetTextureUrl
  useEffect(() => {
    if (targetTextureUrl !== displayedUrl) {
      // Trigger a spin: Add 360 degrees (2 PI)
      rotationTarget.current += Math.PI * 2;

      // Swap the texture halfway through the spin (at 180 degrees / PI)
      // We use a timeout roughly matching the speed of the damp
      const swapTimer = setTimeout(() => {
        setDisplayedUrl(targetTextureUrl);
      }, 300); // 300ms matches the halfway point of the smooth animation roughly

      return () => clearTimeout(swapTimer);
    }
  }, [targetTextureUrl, displayedUrl]);

  useFrame((state, delta) => {
    // 1. Base Spin Animation (damp towards target)
    easing.damp(currentRotation, "current", rotationTarget.current, 0.4, delta);

    // 2. Mouse Tilt Interaction (Clamped)
    const MAX_TILT = 0.3; // Radians (~17 degrees)
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

    // 3. Floating Animation
    const t = state.clock.getElapsedTime();
    const floatY = Math.sin(t / 2) * 0.1;

    if (meshRef.current) {
      // Combine animations
      // Y Rotation = Spin Progress + Mouse Tilt
      meshRef.current.rotation.y = currentRotation.current + mouseX;
      // X Rotation = Mouse Tilt - Float
      meshRef.current.rotation.x = -mouseY + Math.cos(t / 2) * 0.05;
      // Z Position = Bobbing
      meshRef.current.position.y = floatY;
    }
  });

  return (
    <group>
      <GlossyCardMesh
        ref={meshRef}
        textureUrl={displayedUrl}
        envMapIntensity={1.5}
      />
    </group>
  );
}

// --- STYLES ---

const GlobalStyle = createGlobalStyle`
  body {
    background-color: #ffffff;
    overflow-x: hidden;
  }
  
  /* Ant Design Override Helpers */
  .ant-input, .ant-input-textarea, .ant-picker {
    border-radius: 8px;
    padding: 10px 12px;
    border-color: #d9d9d9;
    box-shadow: none !important;
  }
  .ant-input:hover, .ant-picker:hover {
    border-color: #222 !important;
  }
  .ant-input:focus, .ant-input-focused, .ant-picker-focused {
    border-color: #222 !important;
    box-shadow: 0 0 0 2px rgba(0,0,0,0.05) !important;
  }
`;

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  padding-top: 100px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #222;

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

  /* CUSTOM MOBILE LAYOUT START */
  @media (max-width: 900px) {
    display: flex;
    flex-direction: column;
    padding: 20px 16px;
    padding-bottom: 120px; /* Space for sticky footer */
    gap: 0;
  }
`;

const LeftColumn = styled.div`
  width: 100%;
  @media (max-width: 900px) {
    order: 2; /* Form comes after visual on mobile */
  }
`;

const RightColumn = styled.div`
  position: sticky;
  top: 120px;
  align-self: start;
  height: fit-content;

  @media (max-width: 900px) {
    display: none; /* Hide standard right column on mobile */
  }
`;

// --- MOBILE SPECIFIC HEADER ---
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

// --- MOBILE STICKY FOOTER ---
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
    color: #222;
  }
`;

const MobileCheckoutBtn = styled(motion.button)`
  background: #ff385c;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
`;

// --- SHARED UI COMPONENTS ---

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
  border: 3px solid ${(props) => (props.$selected ? "#222" : "transparent")};
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
  border: 1px solid ${(props) => (props.$selected ? "#222" : "#ddd")};
  background: ${(props) => (props.$selected ? "#222" : "white")};
  color: ${(props) => (props.$selected ? "white" : "#222")};
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #222;
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
    color: #222;
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
  border: 2px solid ${(props) => (props.$selected ? "#222" : "#eee")};
  border-radius: 12px;
  background: ${(props) => (props.$selected ? "#f7f7f7" : "white")};
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;

  h4 {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0;
  }

  p {
    font-size: 0.8rem;
    color: #666;
    margin: 4px 0 0 0;
  }
`;

const StickyCard = styled.div`
  background: white;
  border: 1px solid #ddd;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
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
  color: #555;

  &.total {
    margin-top: 12px;
    padding-top: 16px;
    border-top: 1px solid #eee;
    font-weight: 700;
    font-size: 1.125rem;
    color: #222;
  }
`;

const CheckoutButton = styled(motion.button)`
  background: #ff385c;
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
  color: #222;
`;

const FAQContent = styled(motion.div)`
  overflow: hidden;
  color: #555;
  font-size: 0.95rem;
  line-height: 1.6;
`;

// --- DATA ---
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

  // Reusable 3D Scene to keep things consistent between Mobile and Desktop
  const GiftCardScene = () => (
    <Canvas
      shadows
      camera={{ position: [0, 0, 4.5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <Environment preset="city" />
      <FlippableCard targetTextureUrl={CARD_IMAGES[selectedDesignIndex]} />
      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.4}
        scale={10}
        blur={2.5}
        far={4}
      />
    </Canvas>
  );

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
        <MainContainer>
          {/* --- MOBILE VISUAL (Shows on top only on mobile) --- */}
          <MobileVisualHeader>
            <Suspense
              fallback={
                <div
                  style={{ width: "100%", height: "100%", background: "#eee" }}
                />
              }
            >
              <GiftCardScene />
            </Suspense>
          </MobileVisualHeader>

          {/* --- LEFT SIDE: CONFIGURATION --- */}
          <LeftColumn>
            {/* 1. Design Selection */}
            <SectionBlock>
              <SectionHeader>
                <Gift size={22} color="#ff385c" />
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
                          background: "#222",
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
                <CreditCard size={22} color="#ff385c" />
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
                <Mail size={22} color="#ff385c" />
                How would you like to send it?
              </SectionHeader>
              <DeliveryToggle>
                <ToggleOption
                  $selected={deliveryMethod === "email"}
                  onClick={() => setDeliveryMethod("email")}
                >
                  <Mail size={20} />
                  <div>
                    <h4>Email to recipient</h4>
                    <p>We'll send it directly to them.</p>
                  </div>
                </ToggleOption>
                <ToggleOption
                  $selected={deliveryMethod === "self"}
                  onClick={() => setDeliveryMethod("self")}
                >
                  <User size={20} />
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

              <InputGroup>
                <Label>Delivery Date</Label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <DatePicker
                    size="large"
                    style={{ width: "100%", maxWidth: 200 }}
                    onChange={(date, dateString) =>
                      handleInputChange("date", dateString)
                    }
                    disabledDate={(current) => current && current < Date.now()}
                  />
                  {!formData.date && (
                    <span style={{ fontSize: "0.9rem", color: "#666" }}>
                      Sent instantly
                    </span>
                  )}
                </div>
              </InputGroup>
            </SectionBlock>
          </LeftColumn>

          {/* --- RIGHT SIDE: STICKY PREVIEW (Desktop Only) --- */}
          <RightColumn>
            <StickyCard>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.2rem" }}>
                Preview
              </h3>

              <CanvasContainer>
                <Suspense
                  fallback={
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "#eee",
                      }}
                    />
                  }
                >
                  <GiftCardScene />
                </Suspense>
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
                  color: "#222",
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
