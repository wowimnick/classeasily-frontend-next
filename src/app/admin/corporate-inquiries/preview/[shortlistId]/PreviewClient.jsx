"use client";

import React, { Suspense, useEffect, useState } from "react";
import styled from "styled-components";
import { message } from "antd";
import ClientHeader from "@/components/layout/ClientHeader";
import FooterClient from "@/components/homepage/FooterClient";
import { ExploreHeaderSkeleton } from "@/app/explore/_components/ExplorePageSkeleton";
import ShortlistHero from "@/components/corporate/shortlist/ShortlistHero";
import ShortlistLandingIntro from "@/components/corporate/shortlist/ShortlistLandingIntro";
import JourneyStepper from "@/components/corporate/shortlist/JourneyStepper";
import ShortlistComparisonTable from "@/components/corporate/shortlist/ShortlistComparisonTable";
import { corporateAdminService } from "@/services/adminDash";
import { ACCENT_DARK, BP, BRAND_RED, down } from "@/components/corporate/tokens";
import { adminShortlistToPreviewPayload } from "./adaptAdminToPreview";

const Banner = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  background: ${BRAND_RED};
  color: #fff;
  padding: 0.65rem 1rem;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
`;

const PageWrap = styled.div`
  min-height: 100vh;
  background: #fff;
`;

const Container = styled.div`
  width: min(1160px, 100% - 2rem);
  margin: 0 auto;
  padding: 2rem 0 4rem;

  ${down(BP.MOBILE)} {
    padding: 1.25rem 0 3rem;
  }
`;

export default function PreviewClient({ shortlistId }) {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [highlightOption, setHighlightOption] = useState(null);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const slRes = await corporateAdminService.getShortlist(shortlistId);
        const sl = slRes.data;
        const inqRes = await corporateAdminService.getInquiry(sl.inquiry);
        const mapped = adminShortlistToPreviewPayload(sl, inqRes.data);
        if (!cancelled) setPayload(mapped);
      } catch (e) {
        message.error(e?.response?.data?.detail || "Could not load preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shortlistId]);

  const options = payload?.options || [];
  const currency = payload?.currency || "usd";
  const depPct = payload?.deposit_percent ?? 25;

  const noopChoose = () => {
    message.info("Disabled in preview — no booking is created.");
  };

  const previewHeader = (
    <Suspense fallback={<ExploreHeaderSkeleton />}>
      <ClientHeader showOptionsWrapper={false} />
    </Suspense>
  );

  if (loading) {
    return (
      <PageWrap>
        <Banner>Admin preview — this is what the business sees. No emails are sent.</Banner>
        {previewHeader}
        <Container>
          <p style={{ color: "#64748b" }}>Loading preview…</p>
        </Container>
        <FooterClient collections={[]} />
      </PageWrap>
    );
  }

  if (!payload) {
    return (
      <PageWrap>
        <Banner>Admin preview — this is what the business sees. No emails are sent.</Banner>
        {previewHeader}
        <Container>
          <p style={{ color: ACCENT_DARK }}>Nothing to preview.</p>
        </Container>
        <FooterClient collections={[]} />
      </PageWrap>
    );
  }

  if (showIntro) {
    return (
      <ShortlistLandingIntro
        companyName={payload.inquiry?.company_name}
        optionCount={options.length}
        onContinue={() => setShowIntro(false)}
      />
    );
  }

  return (
    <PageWrap>
      <Banner>Admin preview — this is what the business sees. No emails are sent.</Banner>
      {previewHeader}
      <Container>
        <ShortlistHero companyName={payload.inquiry?.company_name} />
        <JourneyStepper currentStep="choose" />
        {options.length === 0 ? (
          <p style={{ color: "#64748b" }}>No active options on this shortlist.</p>
        ) : (
          <ShortlistComparisonTable
            options={options}
            currency={currency}
            depositPercent={depPct}
            highlightOption={highlightOption}
            onHighlight={setHighlightOption}
            onChoose={() => noopChoose()}
          />
        )}
      </Container>
      <FooterClient collections={[]} />
    </PageWrap>
  );
}
