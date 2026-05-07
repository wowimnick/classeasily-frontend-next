"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import styled from "styled-components";
import { corporateBookingService } from "@/services/apiService";
import ExploreHeader from "@/components/explore/ExploreHeader";
import Footer from "@/components/homepage/Footer";
import { formatMoney } from "@/components/corporate/shortlist/formatMoney";
import JourneyStepper from "@/components/corporate/shortlist/JourneyStepper";
import BookingStatusPanel from "@/components/corporate/shortlist/BookingStatusPanel";
import { ACCENT_DARK, BRAND_RED, HERO_MUTED, TEXT_BODY } from "@/components/corporate/tokens";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "");

const Wrap = styled.div`
  min-height: 100vh;
  background: #fff;
`;

const Inner = styled.div`
  width: min(640px, 100% - 2rem);
  margin: 0 auto;
  padding: 2rem 0 4rem;
`;

const Title = styled.h1`
  color: ${ACCENT_DARK};
  font-size: 1.75rem;
  margin: 0 0 1.25rem;
`;

const Lead = styled.p`
  color: ${TEXT_BODY};
  margin: 0 0 1rem;
  line-height: 1.5;
`;

const PayButton = styled.button`
  margin-top: 20px;
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 0.85rem;
  background: ${BRAND_RED};
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  font-size: 1rem;
  font-family: inherit;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${BRAND_RED};
    outline-offset: 2px;
  }
`;

const ErrText = styled.p`
  color: #b91c1c;
  margin-top: 12px;
`;

function PaymentSkeleton() {
  return (
    <div>
      <div className="ce-skel" style={{ height: 160, borderRadius: 16, marginBottom: 16 }} />
      <div className="ce-skel" style={{ height: 44, borderRadius: 10, marginBottom: 8 }} />
      <div className="ce-skel" style={{ height: 44, borderRadius: 10, marginBottom: 8 }} />
      <div className="ce-skel" style={{ height: 48, borderRadius: 12, width: "100%" }} />
    </div>
  );
}

function PayForm({ booking, currency, token, bookingId }) {
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
      <Lead>
        Pay <strong>{formatMoney(booking.deposit_cents, currency)}</strong> deposit for{" "}
        <strong>{booking.reference}</strong>
      </Lead>
      <PaymentElement />
      {err ? <ErrText>{err}</ErrText> : null}
      <PayButton type="button" onClick={handlePay} disabled={loading || !stripe}>
        {loading ? "Processing…" : "Pay deposit"}
      </PayButton>
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
    return <ErrText>Invalid link.</ErrText>;
  }

  if (error) {
    return <ErrText>{error}</ErrText>;
  }

  if (!booking || !clientSecret) {
    return (
      <div>
        <p style={{ color: HERO_MUTED, marginBottom: 16 }}>Preparing secure checkout…</p>
        <PaymentSkeleton />
      </div>
    );
  }

  const cur = booking.currency || "usd";

  return (
    <>
      <BookingStatusPanel booking={booking} token={token} currency={cur} />
      <Title style={{ marginTop: "1.5rem" }}>Pay deposit</Title>
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: BRAND_RED,
              borderRadius: "12px",
              fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            },
          },
        }}
      >
        <PayForm booking={booking} currency={cur} token={token} bookingId={bookingId} />
      </Elements>
    </>
  );
}

function CheckoutSuspenseFallback() {
  return (
    <div>
      <div className="ce-skel" style={{ height: 140, borderRadius: 16, marginBottom: 20 }} />
      <PaymentSkeleton />
    </div>
  );
}

export default function CheckoutClient({ token }) {
  return (
    <Wrap>
      <ExploreHeader showOptionsWrapper={false} />
      <Inner>
        <JourneyStepper currentStep="pay" />
        <Suspense fallback={<CheckoutSuspenseFallback />}>
          <CheckoutInner token={token} />
        </Suspense>
      </Inner>
      <Footer />
    </Wrap>
  );
}
