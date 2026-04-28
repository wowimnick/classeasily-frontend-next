"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import styled from "styled-components";
import { corporateBookingService } from "@/services/apiService";
import ExploreHeader from "@/components/explore/ExploreHeader";
import Footer from "@/components/homepage/Footer";
import { formatMoney } from "../_components/formatMoney";

const Wrap = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
`;
const Inner = styled.div`
  width: min(640px, 100% - 2rem);
  margin: 0 auto;
  padding: 2.5rem 0 4rem;
  text-align: center;
`;

function ConfirmedInner({ token }) {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking");
  const [booking, setBooking] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!bookingId) return;
    let t;
    const poll = async () => {
      try {
        const b = await corporateBookingService.getBooking(token, bookingId);
        setBooking(b);
        if (b.status === "deposit_paid" || b.status === "invoiced" || b.status === "fully_paid") {
          try {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.65 } });
          } catch {
            /* optional */
          }
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
    return <p style={{ color: "#64748b" }}>Confirming your payment…</p>;
  }

  return (
    <div>
      <h1 style={{ color: "#0f172a", fontSize: "2rem" }}>You are in</h1>
      <p style={{ color: "#475569", fontSize: "1.1rem", lineHeight: 1.6 }}>
        Reference <strong>{booking.reference}</strong>
        <br />
        Deposit: {formatMoney(booking.deposit_cents, booking.currency)}
        <br />
        Remaining balance will be invoiced to your work email.
      </p>
      <p style={{ marginTop: 24 }}>
        <Link
          href={`/corporate/shortlist/${token}`}
          style={{ color: "#0f172a", fontWeight: 700 }}
        >
          Back to your shortlist
        </Link>
      </p>
    </div>
  );
}

export default function ConfirmedClient({ token }) {
  return (
    <Wrap>
      <ExploreHeader showOptionsWrapper={false} />
      <Inner>
        <Suspense fallback={<p>Loading…</p>}>
          <ConfirmedInner token={token} />
        </Suspense>
      </Inner>
      <Footer />
    </Wrap>
  );
}
