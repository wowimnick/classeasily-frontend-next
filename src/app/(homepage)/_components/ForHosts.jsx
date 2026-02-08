"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Link from "next/link";
import { Button } from "antd";
import {
  ArrowRight,
  Check,
  LayoutDashboard,
  Calendar,
  Settings,
  User,
  Loader2,
} from "lucide-react";

// --- Styled Components ---

const Section = styled.section`
  padding: 4rem 1rem;
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: #fbfbfb;
  overflow: hidden;
`;

const Container = styled.div`
  max-width: 1200px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5rem;
  align-items: center;

  @media (max-width: 992px) {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    align-items: center;
  }
`;

const TextContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 992px) {
    align-items: center;
    text-align: center;
    order: 3;
    width: 100%;
  }
`;

const Heading = styled.h2`
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  color: #111;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;

  span {
    color: #f81e3e;
  }

  @media (max-width: 992px) {
    display: none;
  }
`;

const MobileHeading = styled.h2`
  display: none;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  color: #111;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
  text-align: center;
  order: 1;

  span {
    color: #f81e3e;
  }

  @media (max-width: 992px) {
    display: block;
  }
`;

const SubText = styled.p`
  font-size: 1.125rem;
  line-height: 1.6;
  color: #000;
  margin: 0;
  max-width: 480px;

  @media (max-width: 992px) {
    font-size: 1rem;
  }
`;

const VisualWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 992px) {
    height: 340px;
    order: 2;
    margin-bottom: 1rem;
  }
`;

const MobileScaleWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;

  @media (max-width: 500px) {
    transform: scale(0.85);
    transform-origin: center center;
  }
`;

// --- Animation Components ---

const CardBase = styled(motion.div)`
  background: white;
  border-radius: 16px;
  box-shadow:
    0 20px 40px -5px rgba(0, 0, 0, 0.1),
    0 10px 20px -5px rgba(0, 0, 0, 0.04);
  position: absolute;
  z-index: 2;
  border: 1px solid rgba(0, 0, 0, 0.03);
  overflow: hidden;
  will-change: transform; /* Performance Hint */
`;

const BookingCard = styled(CardBase)`
  width: 260px;
  bottom: 0;
  left: 30px;
  z-index: 10;
  padding: 20px;

  @media (max-width: 992px) {
    left: 50%;
    transform: translateX(-50%) !important;
    bottom: 20px;
  }
`;

const DashboardCard = styled(CardBase)`
  width: 340px;
  height: 280px;
  top: 0;
  right: 30px;
  z-index: 1;
  display: flex;
  flex-direction: row;

  @media (max-width: 992px) {
    right: 50%;
    transform: translateX(50%) !important;
    top: 10px;
  }
`;

const Sidebar = styled.div`
  width: 50px;
  background: #f9fafb;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
  gap: 20px;
`;

const DashContent = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const DashHeader = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.div`
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #000;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-bottom: 4px;
`;

const BalanceDisplay = styled(motion.div)`
  font-size: 2rem;
  font-weight: 700;
  color: #111;
  letter-spacing: -0.5px;
`;

const ListContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
  position: relative;
`;

const ListItem = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  font-size: 0.85rem;
  will-change: transform, opacity;
`;

const Avatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${(props) => props.$bg || "#ddd"};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: white;
  font-weight: bold;
`;

const Cursor = styled(motion.div)`
  width: 20px;
  height: 20px;
  position: absolute;
  z-index: 20;
  pointer-events: none;
  will-change: transform; /* Critical for smooth movement */

  svg {
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));
  }
`;

const PaymentParticle = styled(motion.div)`
  position: absolute;
  background: #22c55e;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
  z-index: 15;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  will-change: transform, opacity;
`;

// --- Simulation Logic ---

const INITIAL_BALANCE = 1425;

const NAMES = [
  "Sarah J.",
  "Mike T.",
  "Jenny L.",
  "Alex K.",
  "Emma W.",
  "David R.",
];
const EVENTS = [
  "Pottery 101",
  "Wine Tasting",
  "Sushi Rolling",
  "Cooking Workshop",
];
const COLORS = ["#f81e3e", "#3b82f6", "#f59e0b", "#8b5cf6"];

const getRandomBooking = () => ({
  id: Math.random(),
  name: NAMES[Math.floor(Math.random() * NAMES.length)],
  event: EVENTS[Math.floor(Math.random() * EVENTS.length)],
  amount: "+$75",
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
});

const INITIAL_BOOKINGS = [
  {
    id: 1,
    name: "Mike T.",
    event: "Wine Tasting",
    amount: "+$75",
    color: "#3b82f6",
  },
  {
    id: 2,
    name: "Jenny L.",
    event: "Pottery 101",
    amount: "+$75",
    color: "#f59e0b",
  },
];

const RevenueSimulation = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { margin: "0px 0px -100px 0px" });

  // Use a ref to track view state inside the interval loop without restarting it
  const shouldAnimate = useRef(false);

  const [step, setStep] = useState(0);
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [isMobile, setIsMobile] = useState(false);

  // Sync ref with view state
  useEffect(() => {
    shouldAnimate.current = isInView;
  }, [isInView]);

  useEffect(() => {
    // Debounced resize handler
    let timeoutId;
    const checkMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth <= 992);
      }, 100);
    };

    // Initial check
    checkMobile();

    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const runSequence = async () => {
      while (mounted) {
        // PERF: Pause loop if not in view
        if (!shouldAnimate.current) {
          await wait(1000);
          continue;
        }

        await wait(1000);
        if (!mounted) break;
        setStep(1); // Hover
        await wait(800);
        if (!mounted) break;
        setStep(2); // Click
        await wait(200);
        if (!mounted) break;
        setStep(3); // Loading
        await wait(1200);
        if (!mounted) break;
        setStep(4); // Success
        await wait(600);
        if (!mounted) break;
        setStep(5); // Fly
        await wait(800);
        if (!mounted) break;
        setBalance((prev) => prev + 75);
        setBookings((prev) => [getRandomBooking(), ...prev.slice(0, 1)]);
        setStep(6); // Arrive
        await wait(2000);
        if (!mounted) break;
        setStep(0); // Reset
        await wait(500);
      }
    };

    runSequence();

    return () => {
      mounted = false;
    };
  }, []); // Empty deps ensuring loop starts once

  const getCursorVariants = useCallback(() => {
    if (isMobile) {
      return {
        initial: { x: 300, y: 400, opacity: 0 },
        hover: { x: 170, y: 275, opacity: 1 },
        click: { scale: 0.8 },
      };
    }
    return {
      initial: { x: 300, y: 450, opacity: 0 },
      hover: { x: 160, y: 365, opacity: 1 },
      click: { scale: 0.8 },
    };
  }, [isMobile]);

  const variants = getCursorVariants();

  return (
    <MobileScaleWrapper ref={containerRef}>
      {/* --- DASHBOARD --- */}
      <DashboardCard
        animate={{ scale: step === 6 ? 1.02 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        <Sidebar>
          <LayoutDashboard size={20} color="#111" />
          <Calendar size={20} color="#ccc" />
          <User size={20} color="#ccc" />
          <Settings
            size={20}
            color="#ccc"
            style={{ marginTop: "auto", marginBottom: 20 }}
          />
        </Sidebar>

        <DashContent>
          <DashHeader>
            <Label>Total Earnings</Label>
            <BalanceDisplay
              key={balance}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ${balance.toLocaleString()}
            </BalanceDisplay>
          </DashHeader>

          <Label>Recent Activity</Label>
          <ListContainer>
            <AnimatePresence mode="popLayout" initial={false}>
              {bookings.map((booking) => (
                <ListItem
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4 }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Avatar $bg={booking.color}>
                      {booking.name.charAt(0)}
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 600 }}>{booking.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#111" }}>
                        {booking.event}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: "#22c55e", fontWeight: 600 }}>
                    {booking.amount}
                  </div>
                </ListItem>
              ))}
            </AnimatePresence>
          </ListContainer>
        </DashContent>
      </DashboardCard>

      {/* --- GUEST BOOKING WIDGET --- */}
      <BookingCard>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: "#f81e3e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: 12,
            }}
          >
            IMG
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Pottery 101</div>
            <div style={{ fontSize: 13, color: "#111" }}>Sat, 2:00 PM</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 13, color: "#111" }}>Total</span>
          <span style={{ fontSize: 16, fontWeight: 700 }}>$75.00</span>
        </div>

        <motion.button
          style={{
            width: "100%",
            height: 44,
            borderRadius: 8,
            border: "none",
            background: step >= 4 ? "#22c55e" : "#111",
            padding: "1rem 2.5rem",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
          animate={{ scale: step === 2 ? 0.95 : 1 }}
        >
          <AnimatePresence mode="wait">
            {step >= 4 ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Check size={18} /> Booked
              </motion.div>
            ) : step === 3 ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{
                  rotate: { repeat: Infinity, duration: 1, ease: "linear" },
                }}
              >
                <Loader2 size={18} />
              </motion.div>
            ) : (
              <motion.span
                key="text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Book Now
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </BookingCard>

      {/* --- FLYING PARTICLE --- */}
      <AnimatePresence>
        {step === 5 && (
          <PaymentParticle
            initial={{ bottom: 22, left: 100, opacity: 0, scale: 0.5 }}
            animate={{
              bottom: "auto",
              left: "auto",
              top: 30,
              right: 120,
              opacity: [0, 1, 1, 0],
              scale: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            +$75.00
          </PaymentParticle>
        )}
      </AnimatePresence>

      {/* --- CURSOR --- */}
      <Cursor
        animate={{
          x:
            step === 0
              ? variants.initial.x
              : step >= 1
                ? variants.hover.x
                : variants.initial.x,
          y:
            step === 0
              ? variants.initial.y
              : step >= 1
                ? variants.hover.y
                : variants.initial.y,
          opacity:
            step === 0 ? variants.initial.opacity : variants.hover.opacity,
          scale: step === 2 ? variants.click.scale : 1,
        }}
        transition={{ duration: 0.8, type: "spring" }}
        style={{ top: 0, left: 0 }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M9.5 5L24 18L15.5 19.5L12 27L9.5 5Z"
            fill="black"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      </Cursor>
    </MobileScaleWrapper>
  );
};

// --- Main Component ---

const ForHosts = () => {
  return (
    <Section aria-labelledby="for-hosts-title">
      <Container>
        {/* Mobile Title */}
        <MobileHeading>
          Turn your passion into <br />
          <span>predictable revenue.</span>
        </MobileHeading>

        {/* Animation Area */}
        <VisualWrapper>
          <RevenueSimulation />
        </VisualWrapper>

        {/* Text Content */}
        <TextContent>
          <Heading id="for-hosts-title">
            Turn your passion into <br />
            predictable revenue.
          </Heading>

          <SubText data-nosnippet>
            Expand your reach by tapping into our community of experience
            seekers. We'll handle the bookings, payments, and admin - you focus
            on what you do best.
          </SubText>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Link href="/business" passHref legacyBehavior>
              <Button
                type="primary"
                size="large"
                style={{
                  padding: "1rem 2.5rem",
                  height: "auto",
                  lineHeight: "1.5",
                }}
              >
                Start Hosting <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </TextContent>
      </Container>
    </Section>
  );
};

export default ForHosts;
