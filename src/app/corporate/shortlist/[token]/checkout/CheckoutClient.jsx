"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import styled from "styled-components";
import { corporateBookingService } from "@/services/apiService";
import ExploreHeader from "@/components/explore/ExploreHeader";
import Footer from "@/components/homepage/Footer";
import { formatMoney } from "../_components/formatMoney";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "");

const Wrap = styled.div`
  min-height: 100vh;
  background: #fff;
`;
const Inner = styled.div`
  width: min(520px, 100% - 2rem);
  margin: 0 auto;
  padding: 2rem 0 4rem;
`;

function PayForm({ clientSecret, booking, currency, token, bookingId }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setErr("");
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/corporate/shortlist/${token}/confirmed?booking=${bookingId}`,
      },
      redirect: "if_required",
    });
    if (error) {
      setErr(error.message || "Payment failed");
      setLoading(false);
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      router.push(`/corporate/shortlist/${token}/confirmed?booking=${bookingId}`);
      return;
    }
    setLoading(false);
  };

  return (
    <div>
      <p style={{ color: "#334155", marginBottom: 16 }}>
        Pay <strong>{formatMoney(booking.deposit_cents, currency)}</strong> deposit for{" "}
        <strong>{booking.reference}</strong>
      </p>
      <PaymentElement />
      {err ? (
        <p style={{ color: "#b91c1c", marginTop: 12 }}>{err}</p>
      ) : null}
      <button
        type="button"
        onClick={handlePay}
        disabled={loading || !stripe}
        style={{
          marginTop: 20,
          width: "100%",
          border: "none",
          borderRadius: 12,
          padding: "0.85rem",
          background: "#0f172a",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {loading ? "Processing…" : "Pay deposit"}
      </button>
    </div>
  );
}

function CheckoutInner({ token }) {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking");
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    if (!bookingId) {
      setError("Missing booking.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const b = await corporateBookingService.getBooking(token, bookingId);
        if (cancelled) return;
        setBooking(b);
        if (b.status !== "pending_deposit") {
          setError("This booking is not awaiting a deposit.");
          return;
        }
        const pi = await corporateBookingService.createDepositIntent(token, bookingId);
        if (cancelled) return;
        setClientSecret(pi.client_secret);
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.detail || "Could not start checkout.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, bookingId]);

  if (!bookingId) {
    return <p style={{ color: "#b91c1c" }}>Invalid link.</p>;
  }

  if (error) {
    return <p style={{ color: "#b91c1c" }}>{error}</p>;
  }

  if (!booking || !clientSecret) {
    return <p style={{ color: "#64748b" }}>Preparing secure checkout…</p>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "stripe" },
      }}
    >
      <PayForm
        clientSecret={clientSecret}
        booking={booking}
        currency={booking.currency || "usd"}
        token={token}
        bookingId={bookingId}
      />
    </Elements>
  );
}

export default function CheckoutClient({ token }) {
  return (
    <Wrap>
      <ExploreHeader showOptionsWrapper={false} />
      <Inner>
        <h1 style={{ color: "#0f172a" }}>Pay deposit</h1>
        <Suspense fallback={<p>Loading…</p>}>
          <CheckoutInner token={token} />
        </Suspense>
      </Inner>
      <Footer />
    </Wrap>
  );
}
