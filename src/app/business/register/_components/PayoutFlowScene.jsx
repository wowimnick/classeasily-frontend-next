"use client";

import { useState } from "react";
import styled from "styled-components";
import { AnimatePresence, motion, useAnimationFrame } from "framer-motion";
import { marketingTheme as tokens } from "@/components/marketing/tokens";
import LogoIcon from "@/components/common/logoIcon";

const CYCLE = 8600;
const PATH =
  "M 96 132 C 148 52, 196 52, 240 118 C 284 184, 332 184, 384 132";

const CAPTIONS = [
  {
    from: 0,
    to: 0.28,
    kicker: "On your site",
    text: "A customer reserves. Their card is charged for the booking — not your subscription.",
  },
  {
    from: 0.28,
    to: 0.58,
    kicker: "Stripe Connect",
    text: "Stripe processes the charge, fees, and identity checks. ClassEasily never holds the funds.",
  },
  {
    from: 0.58,
    to: 1,
    kicker: "Your bank",
    text: "The payout lands in 1–2 days. Same money, deposited to the account you connect.",
  },
];

function clamp(n, a = 0, b = 1) {
  return Math.max(a, Math.min(b, n));
}

function span(t, a, b) {
  return clamp((t - a) / (b - a));
}

function easeOut(t) {
  return 1 - (1 - t) ** 3;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
    y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
  };
}

function pointOnPath(s) {
  const u = clamp(s);
  if (u <= 0.5) {
    return cubic(
      { x: 96, y: 132 },
      { x: 148, y: 52 },
      { x: 196, y: 52 },
      { x: 240, y: 118 },
      u * 2,
    );
  }
  return cubic(
    { x: 240, y: 118 },
    { x: 284, y: 184 },
    { x: 332, y: 184 },
    { x: 384, y: 132 },
    (u - 0.5) * 2,
  );
}

const Wrap = styled.div`
  margin: 0 0 18px;
`;

const Stage = styled.div`
  position: relative;
  height: 248px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;

  @media (max-width: 640px) {
    height: 220px;
  }

  @media (max-width: 768px) and (max-height: 700px) {
    display: none;
  }
`;

const SvgLayer = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const Phone = styled(motion.div)`
  position: absolute;
  left: 18px;
  top: 38px;
  width: 118px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #ececec;
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.04);
  padding: 10px 10px 12px;
  transform-origin: center bottom;
`;

const Chrome = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #e8e8e8;
  }
`;

const Listing = styled.div`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #222;
`;

const Meta = styled.div`
  font-size: 10px;
  color: #111;
  margin: 3px 0 10px;
`;

const BookBtn = styled(motion.div)`
  height: 26px;
  border-radius: 999px;
  background: ${tokens.colors.primary};
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PayCard = styled(motion.div)`
  position: absolute;
  left: 28px;
  bottom: 22px;
  width: 96px;
  height: 58px;
  border-radius: 10px;
  padding: 8px 10px;
  color: #fff;
  background: linear-gradient(135deg, #1f1f1f 0%, #3a3a3a 55%, #111 100%);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
  font-size: 8px;
  letter-spacing: 0.12em;
  overflow: hidden;

  em {
    display: block;
    font-style: normal;
    font-size: 11px;
    letter-spacing: 0.16em;
    margin-top: 14px;
    font-weight: 600;
  }
`;

const Core = styled.div`
  position: absolute;
  left: 50%;
  top: 46%;
  width: 92px;
  height: 92px;
  margin: -46px 0 0 -46px;
`;

const Ring = styled(motion.div)`
  position: absolute;
  inset: ${(p) => p.$inset || 0};
  border-radius: 50%;
  border: ${(p) => p.$border || "1.5px solid rgba(252,64,86,0.28)"};
  border-top-color: ${(p) => p.$accent || tokens.colors.primary};
  border-right-color: transparent;
`;

const Hub = styled(motion.div)`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 52px;
  height: 52px;
  margin: -26px 0 0 -26px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
`;

const Bank = styled(motion.div)`
  position: absolute;
  right: 16px;
  top: 52px;
  width: 128px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #ececec;
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.04);
  padding: 12px 14px 14px;
`;

const BankKicker = styled.div`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #111;
`;

const BankAmt = styled.div`
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #222;
  margin: 4px 0 8px;
`;

const Status = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #059669;
`;

const Caption = styled.div`
  min-height: 58px;
  margin-top: 14px;
`;

const Kicker = styled.div`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${tokens.colors.primary};
  margin-bottom: 4px;
`;

const Body = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: #111;
`;

function CheckDraw({ show }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <motion.circle
        cx="7"
        cy="7"
        r="6"
        stroke="#059669"
        strokeWidth="1.4"
        fill="rgba(5,150,105,0.08)"
        initial={false}
        animate={{ pathLength: show ? 1 : 0, opacity: show ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      />
      <motion.path
        d="M4 7.2 L6.1 9.2 L10.2 4.8"
        stroke="#059669"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={false}
        animate={{ pathLength: show ? 1 : 0 }}
        transition={{ duration: 0.35, delay: show ? 0.12 : 0 }}
      />
    </svg>
  );
}

function BrandMark({ hot }) {
  return (
    <motion.div
      animate={{ scale: hot ? 1.08 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <LogoIcon
        size={22}
        isScrolled
        restingColor={tokens.colors.primary}
        activeColor={tokens.colors.primary}
      />
    </motion.div>
  );
}

export default function PayoutFlowScene({ reduceMotion }) {
  const [now, setNow] = useState(0);

  useAnimationFrame((time) => {
    if (reduceMotion) return;
    setNow(time);
  });

  const t = reduceMotion ? 0.7 : (now % CYCLE) / CYCLE;
  const press = span(t, 0.08, 0.14);
  const cardIn = easeOut(span(t, 0.14, 0.26));
  const travel = easeInOut(span(t, 0.26, 0.56));
  const hot = t > 0.32 && t < 0.62;
  const deposited = t > 0.58 && t < 0.92;
  const amount = Math.round(45 * easeOut(span(t, 0.58, 0.72)));
  const fadeOut = span(t, 0.9, 1);

  const caption = CAPTIONS.find((c) => t >= c.from && t < c.to) || CAPTIONS[0];

  const particles = [0, 1, 2, 3, 4].map((i) => {
    const local = clamp((travel - i * 0.08) / 0.68);
    const pt = pointOnPath(local);
    const visible = local > 0.02 && local < 0.98;
    return { i, ...pt, visible, local };
  });

  const ringSpeed = hot ? 1.6 : 7.5;

  if (reduceMotion) {
    return (
      <Wrap>
        <Stage>
          <Phone style={{ rotateY: -6 }}>
            <Chrome>
              <span />
              <span />
              <span />
            </Chrome>
            <Listing>Saturday booking</Listing>
            <Meta>10:00 AM · $45</Meta>
            <BookBtn>Reserved</BookBtn>
          </Phone>
          <Core>
            <Hub>
              <BrandMark hot />
            </Hub>
          </Core>
          <Bank>
            <BankKicker>Payout</BankKicker>
            <BankAmt>$45</BankAmt>
            <Status>
              <CheckDraw show />
              Deposited
            </Status>
          </Bank>
        </Stage>
        <Caption>
          <Kicker>Your bank</Kicker>
          <Body>{CAPTIONS[2].text}</Body>
        </Caption>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <Stage>
        <SvgLayer viewBox="0 0 480 248" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="payoutPath" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#fc4056" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#fc4056" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <path
            d={PATH}
            fill="none"
            stroke="#ececec"
            strokeWidth="2"
            strokeDasharray="5 7"
          />
          <motion.path
            d={PATH}
            fill="none"
            stroke="url(#payoutPath)"
            strokeWidth="2.4"
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: travel }}
            transition={{ duration: 0 }}
          />
          {particles.map(({ i, x, y, visible }) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={3.4 - i * 0.28}
              fill={i % 2 ? "#fc4056" : "#34d399"}
              opacity={visible ? 0.95 : 0}
            />
          ))}
        </SvgLayer>

        <Phone
          animate={{
            rotateY: -8,
            y: press > 0 && press < 1 ? 4 : 0,
            scale: 1 - press * 0.03,
            opacity: 1 - fadeOut * 0.15,
          }}
          style={{ transformPerspective: 900 }}
        >
          <Chrome>
            <span />
            <span />
            <span />
          </Chrome>
          <Listing>Saturday booking</Listing>
          <Meta>10:00 AM · $45</Meta>
          <BookBtn
            animate={{
              scale: press > 0.2 && press < 1 ? 0.94 : 1,
              backgroundColor: travel > 0.05 ? "#111" : tokens.colors.primary,
            }}
          >
            {travel > 0.05 ? "Paid" : "Reserve"}
          </BookBtn>
        </Phone>

        <PayCard
          initial={false}
          animate={{
            y: cardIn * -64,
            opacity: cardIn * (1 - span(t, 0.34, 0.42)),
            rotate: -12 + cardIn * 8,
          }}
        >
          VISA
          <em>•••• 4242</em>
        </PayCard>

        <Core>
          <Ring
            $inset="0"
            animate={{ rotate: 360 }}
            transition={{
              duration: ringSpeed,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <Ring
            $inset="10px"
            $border="1.5px dashed rgba(0,0,0,0.12)"
            $accent="#111"
            animate={{ rotate: -360 }}
            transition={{
              duration: ringSpeed * 1.4,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <Hub
            animate={{
              scale: hot ? 1.08 : 1,
              boxShadow: hot
                ? "0 10px 32px rgba(0, 0, 0, 0.14)"
                : "0 8px 24px rgba(0, 0, 0, 0.08)",
            }}
          >
              <BrandMark hot={hot} />
          </Hub>
        </Core>

        <Bank
          animate={{
            y: deposited ? -4 : 0,
            opacity: 1 - fadeOut * 0.15,
          }}
        >
          <BankKicker>Payout</BankKicker>
          <BankAmt>${amount}</BankAmt>
          <Status
            initial={false}
            animate={{ opacity: deposited ? 1 : 0.25, y: deposited ? 0 : 4 }}
          >
            <CheckDraw show={deposited} />
            {deposited ? "Deposited" : "Waiting"}
          </Status>
        </Bank>
      </Stage>
      <Caption>
        <AnimatePresence mode="wait">
          <motion.div
            key={caption.kicker}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <Kicker>{caption.kicker}</Kicker>
            <Body>{caption.text}</Body>
          </motion.div>
        </AnimatePresence>
      </Caption>
    </Wrap>
  );
}
