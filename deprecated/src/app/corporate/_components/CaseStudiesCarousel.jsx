"use client";

import useEmblaCarousel from "embla-carousel-react";
import styled from "styled-components";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Section = styled.section`
  padding: 72px 1.5rem 88px;
  background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
  color: #0f172a;
`;

const Inner = styled.div`
  max-width: 1040px;
  margin: 0 auto;
`;

const Kicker = styled.p`
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #e11d48;
`;

const Title = styled.h2`
  font-size: clamp(1.75rem, 4vw, 2.35rem);
  font-weight: 800;
  margin: 0 0 0.35rem;
  letter-spacing: -0.02em;
  color: #0f172a;
`;

const Disclaimer = styled.p`
  margin: 0 0 2rem;
  font-size: 0.85rem;
  color: #64748b;
  max-width: 42rem;
  line-height: 1.5;
`;

const Viewport = styled.div`
  overflow: hidden;
`;

const Container = styled.div`
  display: flex;
  gap: 1.25rem;
`;

const Slide = styled.div`
  flex: 0 0 92%;
  min-width: 0;
  @media (min-width: 720px) {
    flex: 0 0 52%;
  }
`;

const Card = styled.article`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 2rem 1.75rem 2.25rem;
  height: 100%;
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06);
`;

const Quote = styled.p`
  margin: 0 0 1.5rem;
  font-size: clamp(1.15rem, 2.4vw, 1.45rem);
  line-height: 1.45;
  font-weight: 600;
  color: #334155;
  border-left: 3px solid #e11d48;
  padding-left: 1rem;
`;

const Meta = styled.footer`
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.02em;
`;

const NavRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const NavBtn = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    border-color: #cbd5e1;
    background: #f8fafc;
  }
`;

/**
 * MOCK testimonials  —  composite fictional quotes for layout / copy testing only.
 * Replace with real customer stories when available.
 */
const CASES = [
  {
    quote:
      "We booked a ceramics night for eighteen — zero back-and-forth. The host had everything staged and our team still talks about it.",
    meta: "People Ops Lead · 20-person product team",
  },
  {
    quote:
      "ClassEasily gave us three curated options inside our budget. One invoice-friendly path beat chasing five random studios.",
    meta: "Office Manager · hybrid org",
  },
  {
    quote:
      "Our client event needed something fresh. The cooking class read premium on the floor — and the photos looked incredible.",
    meta: "Agency producer · client entertaining",
  },
];

export default function CaseStudiesCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });

  return (
    <Section id="case-studies">
      <Inner>
        <Kicker>Outcomes</Kicker>
        <Title>Designed for teams who care about the details</Title>
        <Disclaimer>
          The quotes below are illustrative composites for design purposes — not
          attributed testimonials.
        </Disclaimer>
        <Viewport ref={emblaRef}>
          <Container>
            {CASES.map((c) => (
              <Slide key={c.meta}>
                <Card>
                  <Quote>&ldquo;{c.quote}&rdquo;</Quote>
                  <Meta>{c.meta}</Meta>
                </Card>
              </Slide>
            ))}
          </Container>
        </Viewport>
        <NavRow>
          <NavBtn
            type="button"
            aria-label="Previous testimonial"
            onClick={() => emblaApi?.scrollPrev()}
          >
            <ChevronLeft size={22} />
          </NavBtn>
          <NavBtn
            type="button"
            aria-label="Next testimonial"
            onClick={() => emblaApi?.scrollNext()}
          >
            <ChevronRight size={22} />
          </NavBtn>
        </NavRow>
      </Inner>
    </Section>
  );
}
