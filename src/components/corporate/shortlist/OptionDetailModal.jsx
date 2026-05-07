"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import styled from "styled-components";
import { formatMoney } from "./formatMoney";

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end;
  }
`;

const Panel = styled(motion.div)`
  position: relative;
  width: min(780px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    max-height: 95vh;
    border-radius: 24px 24px 0 0;
  }
`;

const CloseIconBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  color: #000000;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, background 0.2s;

  &:hover {
    transform: scale(1.05);
    background: #ffffff;
  }
`;

const Hero = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #f0f0f0;
  flex-shrink: 0;
`;

const GalleryStrip = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  overflow-x: auto;
  background: #ffffff;
  border-bottom: 1px solid #ebebeb;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Thumb = styled.button`
  position: relative;
  flex-shrink: 0;
  width: 80px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid ${(p) => (p.$active ? "#000000" : "transparent")};
  padding: 0;
  cursor: pointer;
  background: #f0f0f0;
  opacity: ${(p) => (p.$active ? 1 : 0.6)};
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const Body = styled.div`
  padding: 2rem 2rem 6rem;
  flex: 1;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 2rem;
  font-weight: 500;
  color: #000000;
  line-height: 1.2;
`;

const Host = styled.p`
  color: #000000;
  font-size: 1.125rem;
  margin-top: 0.5rem;
  font-weight: 400;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #ebebeb;
  margin: 2rem 0;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 500;
  color: #000000;
  margin-bottom: 1rem;
`;

const Desc = styled.p`
  color: #000000;
  line-height: 1.6;
  font-size: 1.125rem;
  white-space: pre-wrap;
  font-weight: 400;
`;

const IncList = styled.ul`
  color: #000000;
  line-height: 1.6;
  font-size: 1.125rem;
  padding-left: 1.5rem;
  margin: 0;
  font-weight: 400;

  li {
    margin-bottom: 0.5rem;
  }
`;

const BottomBar = styled.div`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-top: 1px solid #ebebeb;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
`;

const PriceCol = styled.div`
  display: flex;
  flex-direction: column;
`;

const Price = styled.span`
  font-weight: 500;
  font-size: 1.25rem;
  color: #000000;
`;

const PriceLabel = styled.span`
  color: #000000;
  font-size: 0.875rem;
  font-weight: 400;
`;

const ChooseButton = styled.button`
  background: #e51d53;
  color: #ffffff;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;

  &:hover {
    background: #d4164b;
  }

  &:active {
    transform: scale(0.98);
  }
`;

export default function OptionDetailModal({ open, option, currency, onClose, onChoose }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const [heroIdx, setHeroIdx] = useState(0);

  const gallery = option?.gallery_urls?.filter(Boolean) || [];
  const heroSources =
    option?.cover_image_url ? [option.cover_image_url, ...gallery] : [...gallery];

  useEffect(() => {
    if (!open) {
      setHeroIdx(0);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const activeSrc = heroSources[heroIdx] || null;

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!option) return null;

  return (
    <AnimatePresence>
      {open ? (
        <Backdrop
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <Panel
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <CloseIconBtn type="button" aria-label="Close" onClick={onClose}>
              <X size={20} strokeWidth={2.5} />
            </CloseIconBtn>
            
            <Hero>
              <AnimatePresence mode="wait">
                {activeSrc && (
                  <motion.div
                    key={activeSrc}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ width: "100%", height: "100%", position: "relative" }}
                  >
                    <Image
                      src={activeSrc}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 780px"
                      style={{ objectFit: "cover" }}
                      priority
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Hero>

            {gallery.length > 0 && (
              <GalleryStrip>
                {heroSources.map((url, i) => (
                  <Thumb
                    key={`${url}-${i}`}
                    type="button"
                    $active={i === heroIdx}
                    onClick={() => setHeroIdx(i)}
                    aria-label={`View image ${i + 1}`}
                  >
                    <Image src={url} alt="" fill sizes="80px" style={{ objectFit: "cover" }} />
                  </Thumb>
                ))}
              </GalleryStrip>
            )}

            <Body>
              <Title id={titleId}>{option.title}</Title>
              {option.host_name && <Host>Hosted by {option.host_name}</Host>}
              
              <Divider />
              
              {option.description && (
                <>
                  <SectionTitle>About this experience</SectionTitle>
                  <Desc>{option.description}</Desc>
                  <Divider />
                </>
              )}

              {option.inclusions?.length > 0 && (
                <>
                  <SectionTitle>What's included</SectionTitle>
                  <IncList>
                    {option.inclusions.map((x, i) => (
                      <li key={`${x}-${i}`}>{x}</li>
                    ))}
                  </IncList>
                </>
              )}
            </Body>

            <BottomBar>
              <PriceCol>
                <Price>{formatMoney(option.price_total_cents, currency)}</Price>
                <PriceLabel>Total before taxes</PriceLabel>
              </PriceCol>
              <ChooseButton onClick={() => onChoose(option)}>
                Reserve
              </ChooseButton>
            </BottomBar>
          </Panel>
        </Backdrop>
      ) : null}
    </AnimatePresence>
  );
}
