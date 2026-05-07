"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import styled from "styled-components";
import { CircleCheck } from "lucide-react";
import { corporateBookingService } from "@/services/apiService";
import ExploreHeader from "@/components/explore/ExploreHeader";
import Footer from "@/components/homepage/Footer";
import { formatMoney } from "@/components/corporate/shortlist/formatMoney";
import JourneyStepper from "@/components/corporate/shortlist/JourneyStepper";
import BookingStatusPanel from "@/components/corporate/shortlist/BookingStatusPanel";
import { ACCENT_DARK, BORDER, BRAND_RED, HERO_MUTED, SURFACE_MUTED, TEXT_BODY } from "@/components/corporate/tokens";

const Wrap = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, ${SURFACE_MUTED} 0%, #fff 100%);
`;

const Inner = styled.div`
  width: min(640px, 100% - 2rem);
  margin: 0 auto;
  padding: 2.5rem 0 4rem;
`;

const Panel = styled.div`
  text-align: center;
`;

const Headline = styled.h1`
  color: ${ACCENT_DARK};
  font-size: clamp(1.5rem, 4vw, 2rem);
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Lead = styled.p`
  color: ${TEXT_BODY};
  font-size: 1.05rem;
  line-height: 1.6;
  margin: 0 0 1.25rem;
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

const BookingWrap = styled.div`
  text-align: left;
  margin-bottom: 1.5rem;
`;

function ConfirmedInner({ token }) {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking");
  const [booking, setBooking] = useState(null);
  const [err, setErr] = useState("");
  const prevStatusRef = useRef(null);

  useEffect(() => {
    if (!bookingId) return;
    let t;
    const poll = async () => {
      try {
        const b = await corporateBookingService.getBooking(token, bookingId);
        setBooking(b);
        const prev = prevStatusRef.current;
        const successStates = ["deposit_paid", "invoiced", "fully_paid"];
        if (prev === "pending_deposit" && successStates.includes(b.status)) {
          try {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.65 } });
          } catch {
            /* optional */
          }
        }
        prevStatusRef.current = b.status;
        if (successStates.includes(b.status)) {
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
  }, [token, bookingId]);

  if (!bookingId) {
    return <p style={{ color: "#b91c1c" }}>Invalid confirmation link.</p>;
  }

  if (err) {
    return <p style={{ color: "#b91c1c" }}>{err}</p>;
  }

  if (!booking) {
    return (
      <Panel>
        <Headline>
          <Pulse aria-hidden />
          Confirming your payment…
        </Headline>
        <Lead>Hang tight while we confirm your payment with the bank.</Lead>
      </Panel>
    );
  }

  const pending = booking.status === "pending_deposit";
  const cur = booking.currency || "usd";

  return (
    <Panel>
      <JourneyStepper currentStep={pending ? "pay" : "done"} />

      <BookingWrap>
        <BookingStatusPanel booking={booking} token={token} currency={cur} />
      </BookingWrap>

      {pending ? (
        <>
          <Headline>
            <Pulse aria-hidden />
            Confirming your payment…
          </Headline>
          <Lead>Your deposit is processing. This usually takes a few seconds.</Lead>
        </>
      ) : (
        <>
          <Headline>
            <CircleCheck size={32} color={BRAND_RED} strokeWidth={2.25} aria-hidden />
            You&apos;re in
          </Headline>
          <Lead>
            Reference <strong>{booking.reference}</strong>
            <br />
            Deposit: {formatMoney(booking.deposit_cents, cur)}
            <br />
            Remaining balance will be invoiced to your work email.
          </Lead>
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
