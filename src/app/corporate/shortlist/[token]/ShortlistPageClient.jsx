"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { corporateBookingService } from "@/services/apiService";
import ExploreHeader from "@/components/explore/ExploreHeader";
import Footer from "@/components/homepage/Footer";
import ShortlistHero from "./_components/ShortlistHero";
import OptionCard from "./_components/OptionCard";
import OptionDetailModal from "./_components/OptionDetailModal";
import ChooseFlow from "./_components/ChooseFlow";
import CostBreakdown from "./_components/CostBreakdown";
import BookingStatusPanel from "./_components/BookingStatusPanel";
const PageWrap = styled.div`
  min-height: 100vh;
  background: #fff;
`;

const Container = styled.div`
  width: min(1160px, 100% - 2rem);
  margin: 0 auto;
  padding: 2rem 0 4rem;
`;

export default function ShortlistPageClient({ token }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gone, setGone] = useState(false);
  const [data, setData] = useState(null);
  const [detailOption, setDetailOption] = useState(null);
  const [chooseOption, setChooseOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const d = await corporateBookingService.getShortlist(token);
      setData(d);
    } catch (e) {
      if (e?.response?.status === 410) {
        setGone(true);
      } else {
        setError(e?.response?.data?.detail || "Could not load this page.");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const inquiry = data?.inquiry;
  const options = data?.options || [];
  const active = data?.active_booking;
  const currency = data?.currency || "usd";
  const depPct = data?.deposit_percent ?? 25;

  const onChoose = async (payload) => {
    setSubmitting(true);
    try {
      const res = await corporateBookingService.selectOption(token, {
        ...payload,
        confirmed_datetime: payload.confirmed_datetime,
      });
      const bid = res?.booking?.id;
      if (bid) {
        router.push(`/corporate/shortlist/${token}/checkout?booking=${bid}`);
      }
    } catch (e) {
      setError(
        e?.response?.data?.detail ||
          (typeof e?.response?.data === "object" && JSON.stringify(e?.response?.data)) ||
          "Could not save your selection.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageWrap>
        <ExploreHeader showOptionsWrapper={false} />
        <Container>
          <p style={{ color: "#64748b" }}>Loading your shortlist…</p>
        </Container>
      </PageWrap>
    );
  }

  if (gone) {
    return (
      <PageWrap>
        <ExploreHeader showOptionsWrapper={false} />
        <Container>
          <h1 style={{ color: "#0f172a" }}>This link is no longer available</h1>
          <p style={{ color: "#64748b" }}>Please contact your ClassEasily representative.</p>
        </Container>
        <Footer />
      </PageWrap>
    );
  }

  if (error && !data) {
    return (
      <PageWrap>
        <ExploreHeader showOptionsWrapper={false} />
        <Container>
          <p style={{ color: "#b91c1c" }}>{error}</p>
        </Container>
        <Footer />
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <ExploreHeader showOptionsWrapper={false} />
      <Container>
        <ShortlistHero
          companyName={inquiry?.company_name}
          introMessage={data?.intro_message}
          depositPercent={depPct}
        />

        {error ? (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "0.75rem 1rem",
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        ) : null}

        {active ? (
          <BookingStatusPanel booking={active} token={token} currency={currency} />
        ) : null}

        {active && active.status === "pending_deposit" ? (
          <p style={{ color: "#64748b", marginTop: 12 }}>
            You can return to this page any time using the same link in your email.
          </p>
        ) : null}

        {!active ? (
          <>
            {chooseOption ? (
              <ChooseFlow
                option={chooseOption}
                depositPercent={depPct}
                currency={currency}
                defaultEmail=""
                defaultName={inquiry?.contact_name}
                defaultCompany={inquiry?.company_name}
                onCancel={() => {
                  setChooseOption(null);
                  setError("");
                }}
                onSubmit={onChoose}
                submitting={submitting}
              />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                  gap: "1rem",
                }}
              >
                {options.map((opt, i) => (
                  <OptionCard
                    key={opt.id}
                    option={opt}
                    index={i}
                    currency={currency}
                    onDetails={() => setDetailOption(opt)}
                    onChoose={() => {
                      setChooseOption(opt);
                      setError("");
                    }}
                  />
                ))}
              </div>
            )}

            {!chooseOption && options[0] ? (
              <div style={{ maxWidth: 400, marginTop: "2rem" }}>
                <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: 8 }}>Example pricing</p>
                <CostBreakdown
                  totalCents={options[0].price_total_cents}
                  depositPercent={depPct}
                  depositCents={Math.max(1, Math.round((options[0].price_total_cents * depPct) / 100))}
                  balanceCents={Math.max(
                    0,
                    options[0].price_total_cents -
                      Math.max(1, Math.round((options[0].price_total_cents * depPct) / 100)),
                  )}
                  currency={currency}
                />
              </div>
            ) : null}
          </>
        ) : null}

        {active && active.status !== "pending_deposit" ? (
          <div style={{ marginTop: 24, color: "#64748b" }}>
            <p>Thank you. You can use the link in your email to return here for status updates.</p>
          </div>
        ) : null}
      </Container>

      <OptionDetailModal
        open={!!detailOption}
        option={detailOption}
        currency={currency}
        onClose={() => setDetailOption(null)}
        onChoose={(opt) => {
          setDetailOption(null);
          setChooseOption(opt);
        }}
      />
      <Footer />
    </PageWrap>
  );
}
