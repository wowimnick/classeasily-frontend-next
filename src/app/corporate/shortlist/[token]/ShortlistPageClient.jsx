"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { corporateBookingService } from "@/services/apiService";
import ExploreHeader from "@/components/explore/ExploreHeader";
import FooterSmart from "@/components/homepage/FooterSmart";
import { BP, down, up } from "@/components/corporate/tokens";
import ShortlistLandingIntro from "@/components/corporate/shortlist/ShortlistLandingIntro";
import ShortlistHero from "@/components/corporate/shortlist/ShortlistHero";
import ShortlistComparisonTable from "@/components/corporate/shortlist/ShortlistComparisonTable";
import ChooseFlow from "@/components/corporate/shortlist/ChooseFlow";
import BookingStatusPanel from "@/components/corporate/shortlist/BookingStatusPanel";
import JourneyStepper from "@/components/corporate/shortlist/JourneyStepper";
import { ShortlistMainSkeleton } from "./_components/ShortlistMainSkeleton";

const PageWrap = styled.div`
  min-height: 100dvh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow-x: clip;
`;

const MainContent = styled.main`
  flex: 1;
  min-width: 0;
`;

/**
 * Thin progress rail under the site header. `top` approximates sticky `ClientHeader`
 * height so this bar does not slide underneath it while scrolling.
 */
const StepperTrack = styled.div`
  position: sticky;
  z-index: 40;
  top: 52px;
  background: #ffffff;
  border-bottom: 1px solid #ebebeb;
  box-sizing: border-box;
  width: 100%;

  ${up(BP.MOBILE)} {
    top: 68px;
  }
`;

const StepperTrackInner = styled.div`
  box-sizing: border-box;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0.35rem max(1.25rem, env(safe-area-inset-left, 0px)) 0.35rem
    max(1.25rem, env(safe-area-inset-right, 0px));

  ${down(BP.MOBILE)} {
    padding: 0.3rem max(1rem, env(safe-area-inset-left, 0px)) 0.3rem max(1rem, env(safe-area-inset-right, 0px));
  }
`;

const Container = styled.div`
  box-sizing: border-box;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 1rem max(1.25rem, env(safe-area-inset-left, 0px)) 6rem
    max(1.25rem, env(safe-area-inset-right, 0px));

  ${down(BP.MOBILE)} {
    padding: 0.75rem max(1rem, env(safe-area-inset-left, 0px)) max(4rem, env(safe-area-inset-bottom, 0px))
      max(1rem, env(safe-area-inset-right, 0px));
  }
`;

const ErrorBanner = styled(motion.div)`
  background: #fff0f0;
  border: 1px solid #ffcccc;
  color: #cc0000;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  font-size: 0.95rem;
  font-weight: 500;
`;

const Note = styled.p`
  color: #000000;
  margin-top: 1rem;
  font-size: 1rem;
  line-height: 1.5;
  font-weight: 400;
`;

const ThankYou = styled.div`
  margin-top: 2rem;
  color: #000000;
  font-size: 1rem;
  line-height: 1.5;
  font-weight: 400;
`;

const EmptyState = styled(motion.div)`
  padding: 4rem 2rem;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #ebebeb;
  text-align: center;
  color: #000000;
  font-size: 1.125rem;
  max-width: 600px;
  margin: 4rem auto;
  font-weight: 400;
`;

const GoneTitle = styled.h1`
  color: #000000;
  font-size: 2rem;
  font-weight: 500;
  margin-bottom: 1rem;
`;

function deriveJourneyStep({ active, chooseOption }) {
  if (active) {
    if (active.status === "pending_deposit") return "pay";
    return "done";
  }
  if (chooseOption) return "details";
  return "choose";
}

function introStorageKey(token) {
  return `classeasily:corporate-shortlist-intro:${token}`;
}

function shouldAlwaysShowIntro() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "staging.classeasily.com";
}

export default function ShortlistPageClient({ token }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gone, setGone] = useState(false);
  const [data, setData] = useState(null);
  const [chooseOption, setChooseOption] = useState(null);
  const [highlightOption, setHighlightOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [introChecked, setIntroChecked] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

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

  /* Warm the intro chunk when this visit may show the landing walkthrough (first time or forced hosts). */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const forceIntro = shouldAlwaysShowIntro();
    let seen = false;
    if (!forceIntro) {
      try {
        seen = window.localStorage.getItem(introStorageKey(token)) === "1";
      } catch {
        seen = false;
      }
    }
    if (!(forceIntro || !seen)) return;
    void import("@/components/corporate/shortlist/ShortlistLandingIntro");
  }, [token]);

  useEffect(() => {
    if (introChecked) return;
    if (loading) return;
    if (!data || gone || (error && !data)) {
      setIntroChecked(true);
      setShowIntro(false);
      return;
    }

    const forceIntro = shouldAlwaysShowIntro();
    let seen = false;
    if (!forceIntro) {
      try {
        seen = window.localStorage.getItem(introStorageKey(token)) === "1";
      } catch {
        seen = false;
      }
    }

    setShowIntro(forceIntro || !seen);
    setIntroChecked(true);
  }, [data, error, gone, introChecked, loading, token]);

  const inquiry = data?.inquiry;
  const options = data?.options || [];
  const active = data?.active_booking;
  const currency = data?.currency || "usd";
  const depPct = data?.deposit_percent ?? 25;
  const introMessage = data?.intro_message;
  const presentation = data?.presentation || {};

  const journeyStep = deriveJourneyStep({ active, chooseOption });

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

  const continueFromIntro = () => {
    if (!shouldAlwaysShowIntro()) {
      try {
        window.localStorage.setItem(introStorageKey(token), "1");
      } catch {
        // Storage can be unavailable in privacy modes; continuing should still work.
      }
    }
    setShowIntro(false);
  };

  if (loading) {
    return (
      <PageWrap>
        <ExploreHeader showOptionsWrapper={false} />
        <MainContent aria-busy="true" aria-live="polite">
          <ShortlistMainSkeleton />
        </MainContent>
        <FooterSmart />
      </PageWrap>
    );
  }

  if (gone) {
    return (
      <PageWrap>
        <ExploreHeader showOptionsWrapper={false} />
        <MainContent>
          <Container>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <GoneTitle>This collection is no longer available</GoneTitle>
              <p style={{ color: "#000000", fontSize: "1.125rem", fontWeight: 400 }}>Please contact your ClassEasily representative for a new link.</p>
            </motion.div>
          </Container>
        </MainContent>
        <FooterSmart />
      </PageWrap>
    );
  }

  if (error && !data) {
    return (
      <PageWrap>
        <ExploreHeader showOptionsWrapper={false} />
        <MainContent>
          <Container>
            <ErrorBanner initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              {error}
            </ErrorBanner>
          </Container>
        </MainContent>
        <FooterSmart />
      </PageWrap>
    );
  }

  if (data && !introChecked) {
    return (
      <PageWrap>
        <ExploreHeader showOptionsWrapper={false} />
        <MainContent aria-busy="true" aria-live="polite">
          <ShortlistMainSkeleton />
        </MainContent>
        <FooterSmart />
      </PageWrap>
    );
  }

  if (showIntro) {
    return (
      <ShortlistLandingIntro
        companyName={inquiry?.company_name}
        optionCount={options.length}
        onContinue={continueFromIntro}
      />
    );
  }

  return (
    <PageWrap>
      <ExploreHeader showOptionsWrapper={false} />
      <MainContent>
        <StepperTrack>
          <StepperTrackInner>
            <JourneyStepper currentStep={journeyStep} />
          </StepperTrackInner>
        </StepperTrack>
        <Container>
          <ShortlistHero
            companyName={inquiry?.company_name}
            introMessage={introMessage}
            presentation={presentation}
          />

          <AnimatePresence>
            {error && (
              <ErrorBanner
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </ErrorBanner>
            )}
          </AnimatePresence>

          {active ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <BookingStatusPanel booking={active} token={token} currency={currency} />
              {active.status === "pending_deposit" ? (
                <Note>You can return to this page any time using the same link in your email.</Note>
              ) : (
                <ThankYou>
                  <p>Thank you. You can use the link in your email to return here for status updates.</p>
                </ThankYou>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {chooseOption ? (
                <motion.div
                  key="choose"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChooseFlow
                    token={token}
                    option={chooseOption}
                    depositPercent={depPct}
                    currency={currency}
                    defaultEmail={inquiry?.email || ""}
                    defaultName={inquiry?.contact_name}
                    defaultCompany={inquiry?.company_name}
                    onCancel={() => {
                      setChooseOption(null);
                      setError("");
                    }}
                    onSubmit={onChoose}
                    submitting={submitting}
                  />
                </motion.div>
              ) : options.length === 0 ? (
                <EmptyState
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  No experiences have been added to this collection yet. Please check back soon or contact your representative.
                </EmptyState>
              ) : (
                <ShortlistComparisonTable
                  key="grid"
                  options={options}
                  currency={currency}
                  depositPercent={depPct}
                  highlightOption={highlightOption}
                  onHighlight={setHighlightOption}
                  presentation={presentation}
                  onChoose={(opt) => {
                    setChooseOption(opt);
                    setError("");
                  }}
                />
              )}
            </AnimatePresence>
          )}
        </Container>
      </MainContent>

      <FooterSmart />
    </PageWrap>
  );
}
