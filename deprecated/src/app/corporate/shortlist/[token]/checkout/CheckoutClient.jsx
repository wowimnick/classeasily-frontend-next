"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import styled from "styled-components";
import dayjs from "dayjs";
import { corporateBookingService } from "@/services/apiService";
import ExploreHeader from "@/components/explore/ExploreHeader";
import Footer from "@/components/homepage/Footer";
import { formatMoney } from "@/components/corporate/shortlist/formatMoney";
import JourneyStepper from "@/components/corporate/shortlist/JourneyStepper";
import BookingStatusPanel from "@/components/corporate/shortlist/BookingStatusPanel";
import { ACCENT_DARK, HERO_MUTED, TEXT_BODY, TEXT_MUTED } from "@/components/corporate/tokens";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "");

const Wrap = styled.div`
  min-height: 100vh;
  background: #fcfcfc;
`;

const Inner = styled.div`
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem max(1rem, env(safe-area-inset-left)) 4rem max(1rem, env(safe-area-inset-right));
  box-sizing: border-box;
`;

const StepGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  align-items: flex-start;

  .checkout-status-mobile {
    order: 1;
  }

  .checkout-summary-aside {
    order: 2;
  }

  .checkout-pay {
    order: 3;
  }

  @media (min-width: 1024px) {
    grid-template-columns: minmax(0, 1.2fr) 400px;
    gap: 40px;

    .checkout-status-mobile {
      display: none;
    }

    .checkout-pay,
    .checkout-summary-aside {
      order: 0;
    }
  }
`;

const PayColumn = styled.div`
  min-width: 0;
`;

const SummaryAside = styled.aside`
  min-width: 0;
`;

const StatusBlock = styled.div`
  margin-bottom: 1.25rem;

  @media (min-width: 1024px) {
    margin-bottom: 1.5rem;
  }
`;

const StatusMobileOnly = styled.div`
  @media (min-width: 1024px) {
    display: none;
  }
`;

const StatusDesktopOnly = styled.div`
  display: none;

  @media (min-width: 1024px) {
    display: block;
  }
`;

const Title = styled.h1`
  color: ${ACCENT_DARK};
  font-size: 1.5rem;
  margin: 0 0 0.75rem;
  font-weight: 700;

  @media (min-width: 1024px) {
    font-size: 1.75rem;
  }
`;

const Lead = styled.p`
  color: ${TEXT_BODY};
  margin: 0 0 1.25rem;
  line-height: 1.55;
  font-size: 0.95rem;
`;

const PayButton = styled.button`
  margin-top: 20px;
  width: 100%;
  border: 1px solid #000000;
  border-radius: 10px;
  padding: 0.85rem;
  background: #000000;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  font-size: 1rem;
  font-family: inherit;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid #000000;
    outline-offset: 2px;
  }
`;

const ErrText = styled.p`
  color: #b91c1c;
  margin-top: 12px;
`;

const SummaryCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 18px 20px;
  box-sizing: border-box;
`;

const SummaryTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const SummaryThumb = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f3f4f6;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const SummaryTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #111;
  line-height: 1.35;
`;

const SummaryMeta = styled.div`
  font-size: 13px;
  color: ${TEXT_MUTED};
  margin-top: 4px;
`;

const Divider = styled.div`
  height: 1px;
  background: #ebebeb;
  margin: 16px 0;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  font-size: 13px;
  color: #111827;

  &:first-of-type {
    margin-top: 0;
  }
`;

const RowLabel = styled.span`
  color: ${TEXT_MUTED};
`;

const RowVal = styled.span`
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`;

const RowStrong = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebebeb;
  font-weight: 700;
  font-size: 15px;
  color: #111;
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

function BookingSummaryCard({ option, booking, currency }) {
  const dt = booking?.confirmed_datetime
    ? dayjs(booking.confirmed_datetime).isValid()
      ? dayjs(booking.confirmed_datetime).format("ddd, MMM D, YYYY h:mm A")
      : String(booking.confirmed_datetime)
    : "—";

  return (
    <SummaryCard aria-label="Booking summary">
      <SummaryTop>
        {option?.cover_image_url ? (
          <SummaryThumb>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={option.cover_image_url} alt="" />
          </SummaryThumb>
        ) : (
          <SummaryThumb />
        )}
        <div style={{ minWidth: 0 }}>
          <SummaryTitle>{option?.title || "Your booking"}</SummaryTitle>
          {option?.host_name ? <SummaryMeta>{option.host_name}</SummaryMeta> : null}
        </div>
      </SummaryTop>
      <Divider />
      <Row>
        <RowLabel>Reference</RowLabel>
        <RowVal>{booking?.reference}</RowVal>
      </Row>
      <Row>
        <RowLabel>Date &amp; time</RowLabel>
        <RowVal style={{ textAlign: "right" }}>{dt}</RowVal>
      </Row>
      <Row>
        <RowLabel>Guests</RowLabel>
        <RowVal>
          {booking?.headcount}{" "}
          {Number(booking?.headcount) === 1 ? "guest" : "guests"}
        </RowVal>
      </Row>
      <Divider />
      <Row>
        <RowLabel>Total</RowLabel>
        <RowVal>{formatMoney(booking.total_cents, currency)}</RowVal>
      </Row>
      <Row>
        <RowLabel>Balance after deposit</RowLabel>
        <RowVal>{formatMoney(booking.balance_cents, currency)}</RowVal>
      </Row>
      <RowStrong>
        <span>Deposit due today</span>
        <span>{formatMoney(booking.deposit_cents, currency)}</span>
      </RowStrong>
    </SummaryCard>
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
      <Lead>Confirm your deposit to lock in this date. Your card is charged securely by Stripe.</Lead>
      <PaymentElement />
      {err ? <ErrText>{err}</ErrText> : null}
      <PayButton type="button" onClick={handlePay} disabled={loading || !stripe}>
        {loading ? "Processing…" : `Pay ${formatMoney(booking.deposit_cents, currency)} deposit`}
      </PayButton>
    </div>
  );
}

function CheckoutInner({ token }) {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking");
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);
  const [shortlistPayload, setShortlistPayload] = useState(null);
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    if (!bookingId) {
      setError("Missing booking.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [b, sl] = await Promise.all([
          corporateBookingService.getBooking(token, bookingId),
          corporateBookingService.getShortlist(token),
        ]);
        if (cancelled) return;
        setBooking(b);
        setShortlistPayload(sl);
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

  const selectedOption = useMemo(() => {
    if (!booking?.selected_option_id || !shortlistPayload?.options) return null;
    const sid = String(booking.selected_option_id);
    return shortlistPayload.options.find((o) => String(o.id) === sid) || null;
  }, [booking, shortlistPayload]);

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

  const appearance = {
    theme: "stripe",
    variables: {
      colorPrimary: "#111827",
      colorBackground: "#ffffff",
      colorText: "#111827",
      colorDanger: "#b91c1c",
      borderRadius: "10px",
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    },
    rules: {
      ".Input": {
        borderColor: "#e5e7eb",
        boxShadow: "none",
      },
    },
  };

  return (
    <StepGrid>
      <StatusMobileOnly className="checkout-status-mobile">
        <StatusBlock>
          <BookingStatusPanel booking={booking} token={token} currency={cur} />
        </StatusBlock>
      </StatusMobileOnly>
      <PayColumn className="checkout-pay">
        <StatusDesktopOnly>
          <StatusBlock>
            <BookingStatusPanel booking={booking} token={token} currency={cur} />
          </StatusBlock>
        </StatusDesktopOnly>
        <Title>Pay deposit</Title>
        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
          <PayForm booking={booking} currency={cur} token={token} bookingId={bookingId} />
        </Elements>
      </PayColumn>
      <SummaryAside className="checkout-summary-aside">
        <BookingSummaryCard option={selectedOption} booking={booking} currency={cur} />
      </SummaryAside>
    </StepGrid>
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
