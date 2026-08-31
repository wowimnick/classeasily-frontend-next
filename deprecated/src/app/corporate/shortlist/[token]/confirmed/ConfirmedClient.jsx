"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { corporateBookingService } from "@/services/apiService";
import ExploreHeader from "@/components/explore/ExploreHeader";
import Footer from "@/components/homepage/Footer";
import { formatMoney } from "@/components/corporate/shortlist/formatMoney";
import JourneyStepper from "@/components/corporate/shortlist/JourneyStepper";
import BookingStatusPanel from "@/components/corporate/shortlist/BookingStatusPanel";
import { ACCENT_DARK, BORDER, BRAND_RED, TEXT_BODY, TEXT_MUTED } from "@/components/corporate/tokens";

const Wrap = styled.div`
  min-height: 100vh;
  background: #fcfcfc;
`;

const Inner = styled.div`
  width: min(640px, 100% - 2rem);
  margin: 0 auto;
  padding: 2.5rem 0 4rem;
`;

const Panel = styled(motion.div)`
  text-align: center;
`;

const CheckCircle = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #fff0f3;
  margin-bottom: 1.25rem;

  svg {
    color: ${BRAND_RED};
  }
`;

const Headline = styled.h1`
  color: ${ACCENT_DARK};
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 0.75rem;
  line-height: 1.15;
`;

const Reference = styled.p`
  margin: 0 0 0.35rem;
  font-size: 15px;
  color: ${TEXT_MUTED};
  font-variant-numeric: tabular-nums;
`;

const Lead = styled.p`
  color: ${TEXT_BODY};
  font-size: 17px;
  line-height: 1.55;
  margin: 0 0 1.5rem;
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;
`;

const Timeline = styled.ol`
  list-style: none;
  margin: 0 auto 1.5rem;
  padding: 0;
  max-width: 360px;
  text-align: left;
`;

const TlItem = styled.li`
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 0.75rem;
  align-items: start;
  padding: 0.5rem 0;
  font-size: 14px;
  color: ${TEXT_BODY};
  line-height: 1.45;

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${BRAND_RED};
    margin-top: 6px;
  }
`;

const BookingWrap = styled.div`
  text-align: left;
  margin-bottom: 1.5rem;
`;

const SaveTip = styled.div`
  margin-top: 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  border: 1px solid ${BORDER};
  background: #fff;
  font-size: 0.9rem;
  color: ${TEXT_BODY};
  text-align: left;
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;
`;

const Pulse = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: ${BRAND_RED};
  animation: pulse 1.2s ease-in-out infinite;
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.45;
      transform: scale(0.85);
    }
  }
`;

const DEPOSIT_TIMELINE = [
  "Your deposit is confirmed and your date is reserved.",
  "We'll coordinate final details with your host.",
  "The remaining balance is invoiced before your event.",
];

const BALANCE_TIMELINE = [
  "Your balance payment is confirmed — you're paid in full.",
  "We'll send a receipt to your billing contact.",
  "Your host will reach out with final event details.",
];

function ConfirmedInner({ token }) {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking");
  const mode = searchParams.get("mode");
  const isBalanceMode = mode === "balance";
  const [booking, setBooking] = useState(null);
  const [err, setErr] = useState("");
  const prevStatusRef = useRef(null);
  const confettiFired = useRef(false);

  useEffect(() => {
    if (!bookingId) return;
    let t;
    const poll = async () => {
      try {
        const b = await corporateBookingService.getBooking(token, bookingId);
        setBooking(b);
        const prev = prevStatusRef.current;
        const depositSuccess = ["deposit_paid", "invoiced", "fully_paid"];
        const balanceSuccess = ["fully_paid"];
        const targetStates = isBalanceMode ? balanceSuccess : depositSuccess;
        if (prev && !targetStates.includes(prev) && targetStates.includes(b.status)) {
          if (!confettiFired.current) {
            confettiFired.current = true;
            try {
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.65 } });
            } catch {
              /* optional */
            }
          }
        }
        prevStatusRef.current = b.status;
        if (targetStates.includes(b.status)) {
          clearInterval(t);
        }
      } catch (e) {
        setErr(e?.response?.data?.detail || "Could not load booking.");
        clearInterval(t);
      }
    };
    poll();
    t = setInterval(poll, 2500);
    return () => clearInterval(t);
  }, [token, bookingId, isBalanceMode]);

  if (!bookingId) {
    return <p style={{ color: "#b91c1c" }}>Invalid confirmation link.</p>;
  }

  if (err) {
    return <p style={{ color: "#b91c1c" }}>{err}</p>;
  }

  if (!booking) {
    return (
      <Panel initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Headline>
          <Pulse aria-hidden /> Confirming your payment…
        </Headline>
        <Lead>Hang tight while we confirm your payment with the bank.</Lead>
      </Panel>
    );
  }

  const pending = booking.status === "pending_deposit";
  const awaitingBalance =
    isBalanceMode && booking.status !== "fully_paid" && booking.status !== "completed";
  const cur = booking.currency || "usd";
  const confirmed = isBalanceMode
    ? booking.status === "fully_paid" || booking.status === "completed"
    : !pending && booking.status !== "pending_deposit";
  const timeline = isBalanceMode ? BALANCE_TIMELINE : DEPOSIT_TIMELINE;

  return (
    <Panel initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <JourneyStepper currentStep={confirmed ? "done" : "pay"} />

      <BookingWrap>
        <BookingStatusPanel booking={booking} token={token} currency={cur} />
      </BookingWrap>

      {pending || awaitingBalance ? (
        <>
          <Headline>
            <Pulse aria-hidden /> Confirming your payment…
          </Headline>
          <Lead>
            {isBalanceMode
              ? "Your balance payment is processing. This usually takes a few seconds."
              : "Your deposit is processing. This usually takes a few seconds."}
          </Lead>
        </>
      ) : (
        <>
          <CheckCircle>
            <Check size={36} strokeWidth={2.5} aria-hidden />
          </CheckCircle>
          <Headline>{isBalanceMode ? "Paid in full" : "You're in"}</Headline>
          <Reference>Reference {booking.reference}</Reference>
          <Lead>
            {isBalanceMode ? (
              <>
                Total paid: {formatMoney(booking.total_cents, cur)}
                <br />
                Thank you — your corporate booking is fully settled.
              </>
            ) : (
              <>
                Deposit: {formatMoney(booking.deposit_cents, cur)}
                <br />
                Remaining balance will be invoiced to your billing contact.
              </>
            )}
          </Lead>
          <Timeline aria-label="What happens next">
            {timeline.map((step) => (
              <TlItem key={step}>{step}</TlItem>
            ))}
          </Timeline>
        </>
      )}

      <p style={{ marginTop: 24 }}>
        <Link href={`/corporate/shortlist/${token}`} style={{ color: ACCENT_DARK, fontWeight: 700 }}>
          Back to your shortlist
        </Link>
      </p>

      <SaveTip>
        <strong>Tip:</strong> bookmark this page or keep the email link handy — you can return any time for status
        updates.
      </SaveTip>
    </Panel>
  );
}

function ConfirmedFallback() {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        className="ce-skel"
        style={{ height: 36, width: "70%", borderRadius: 8, margin: "0 auto 1rem" }}
      />
      <div className="ce-skel" style={{ height: 120, borderRadius: 16, marginBottom: 12 }} />
    </div>
  );
}

export default function ConfirmedClient({ token }) {
  return (
    <Wrap>
      <ExploreHeader showOptionsWrapper={false} />
      <Inner>
        <Suspense fallback={<ConfirmedFallback />}>
          <ConfirmedInner token={token} />
        </Suspense>
      </Inner>
      <Footer />
    </Wrap>
  );
}
