"use client";

import styled, { keyframes } from "styled-components";
import ExploreHeader from "@/components/explore/ExploreHeader";
import FooterSmart from "@/components/homepage/FooterSmart";
import { BP, down, up } from "@/components/corporate/tokens";

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const Sk = styled.div`
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #f8f8f8 50%,
    #f0f0f0 100%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite linear;
  border-radius: ${(p) => p.$radius ?? "8px"};
`;

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
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.25rem 0.35rem;

  ${down(BP.MOBILE)} {
    padding: 0.3rem max(1rem, env(safe-area-inset-left, 0px)) 0.3rem
      max(1rem, env(safe-area-inset-right, 0px));
  }
`;

const StepperPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  padding: 0.12rem 0.4rem;
  border-radius: 999px;
`;

const Container = styled.div`
  box-sizing: border-box;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 1rem max(1.25rem, env(safe-area-inset-left, 0px)) 6rem
    max(1.25rem, env(safe-area-inset-right, 0px));

  ${down(BP.MOBILE)} {
    padding: 0.75rem max(1rem, env(safe-area-inset-left, 0px))
      max(4rem, env(safe-area-inset-bottom, 0px)) max(1rem, env(safe-area-inset-right, 0px));
  }
`;

/** Matches ShortlistHero `HeroPanel` grid */
const HeroPanel = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
  gap: clamp(1rem, 3vw, 2rem);
  align-items: center;
  padding: clamp(1rem, 2.5vw, 1.5rem);
  border: 1px solid #e8e8e8;
  border-radius: 28px;
  background: linear-gradient(135deg, #ffffff 0%, #fbfbfb 100%);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    border-radius: 20px;
    padding: clamp(0.85rem, 3vw, 1.25rem);
  }
`;

const CopyCol = styled.div`
  min-width: 0;
`;

const ProcessCard = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.85rem 0.9rem;
  border: 1px solid rgba(34, 34, 34, 0.1);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.06);
`;

const FlowRow = styled.div`
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 0.65rem;
  align-items: start;
`;

const CompareBundle = styled.div`
  margin-top: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
`;

const CompareScroll = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  min-width: 0;
`;

const TableGrid = styled.div`
  min-width: 720px;
  display: grid;
  grid-template-columns: minmax(140px, 26%) repeat(3, minmax(160px, 1fr));
`;

const ThRow = styled.div`
  display: contents;
`;

const ThCell = styled.div`
  padding: 12px 10px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
`;

const ThFeature = styled.div`
  padding: 12px 12px 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  align-items: flex-end;
  box-sizing: border-box;
  box-shadow: 1px 0 0 #e5e7eb;
`;

const TdRow = styled.div`
  display: contents;
`;

const TdFeature = styled.div`
  padding: 10px 12px 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  background: #fff;
  display: flex;
  align-items: center;
  box-shadow: 1px 0 0 #f3f4f6;
  box-sizing: border-box;
`;

const TdCell = styled.div`
  padding: 10px 8px;
  border-bottom: 1px solid #f3f4f6;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
`;

const SectionBand = styled.div`
  grid-column: 1 / -1;
  padding: 12px 14px 11px 18px;
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
`;

/**
 * Core layout skeleton: sticky stepper + hero (copy + process card) + comparison table block.
 */
export function ShortlistMainSkeleton() {
  return (
    <>
      <StepperTrack>
        <StepperTrackInner aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <StepperPill key={i}>
              <Sk $radius="50%" style={{ width: 14, height: 14, flexShrink: 0 }} />
              <Sk style={{ width: 52 + i * 6, height: 11, borderRadius: 6 }} />
            </StepperPill>
          ))}
        </StepperTrackInner>
      </StepperTrack>

      <Container>
        <HeroPanel>
          <CopyCol>
            <Sk style={{ width: "88%", maxWidth: 520, height: 36, borderRadius: 10, marginBottom: 12 }} />
            <Sk style={{ width: "72%", maxWidth: 440, height: 36, borderRadius: 10, marginBottom: 16 }} />
            <Sk style={{ width: "100%", maxWidth: 640, height: 14, borderRadius: 6, marginBottom: 8 }} />
            <Sk style={{ width: "92%", maxWidth: 580, height: 14, borderRadius: 6, marginBottom: 8 }} />
            <Sk style={{ width: "55%", maxWidth: 360, height: 14, borderRadius: 6 }} />
          </CopyCol>
          <ProcessCard>
            {[0, 1, 2, 3].map((i) => (
              <FlowRow key={i}>
                <Sk $radius="50%" style={{ width: 24, height: 24, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <Sk style={{ width: `calc(55% + ${i * 12}px)`, height: 12, borderRadius: 6, marginBottom: 8 }} />
                  <Sk style={{ width: "100%", height: 10, borderRadius: 5, marginBottom: 6 }} />
                  <Sk style={{ width: "78%", height: 10, borderRadius: 5 }} />
                </div>
              </FlowRow>
            ))}
          </ProcessCard>
        </HeroPanel>

        <CompareBundle>
          <CompareScroll>
            <TableGrid>
              <ThRow>
                <ThFeature>
                  <Sk style={{ width: 72, height: 12, borderRadius: 6 }} />
                </ThFeature>
                {[0, 1, 2].map((col) => (
                  <ThCell key={col}>
                    <Sk
                      style={{
                        width: "100%",
                        maxWidth: 200,
                        height: 112,
                        borderRadius: 10,
                      }}
                    />
                    <Sk style={{ width: "85%", height: 12, borderRadius: 6 }} />
                    <Sk style={{ width: "60%", height: 10, borderRadius: 5 }} />
                  </ThCell>
                ))}
              </ThRow>

              <SectionBand>
                <Sk style={{ width: 140, height: 11, borderRadius: 6 }} />
              </SectionBand>

              {[0, 1, 2, 3, 4].map((row) => (
                <TdRow key={row}>
                  <TdFeature>
                    <Sk style={{ width: `calc(70% + ${row * 5}px)`, height: 11, borderRadius: 5 }} />
                  </TdFeature>
                  {[0, 1, 2].map((col) => (
                    <TdCell key={col}>
                      <Sk style={{ width: row % 2 === 0 ? "78%" : "56%", height: row === 0 ? 26 : 16, borderRadius: 6 }} />
                    </TdCell>
                  ))}
                </TdRow>
              ))}

              <SectionBand style={{ borderTopWidth: 1 }}>
                <Sk style={{ width: 100, height: 11, borderRadius: 6 }} />
              </SectionBand>

              {[0, 1].map((row) => (
                <TdRow key={`p-${row}`}>
                  <TdFeature>
                    <Sk style={{ width: 96, height: 11, borderRadius: 5 }} />
                  </TdFeature>
                  {[0, 1, 2].map((col) => (
                    <TdCell key={col}>
                      <Sk style={{ width: "70%", height: 20, borderRadius: 6 }} />
                    </TdCell>
                  ))}
                </TdRow>
              ))}
            </TableGrid>
          </CompareScroll>
        </CompareBundle>
      </Container>
    </>
  );
}

/** Full segment shell for `loading.jsx` (header + skeleton + footer). */
export function ShortlistRouteSkeleton() {
  return (
    <PageWrap>
      <ExploreHeader showOptionsWrapper={false} />
      <MainContent>
        <ShortlistMainSkeleton />
      </MainContent>
      <FooterSmart />
    </PageWrap>
  );
}
