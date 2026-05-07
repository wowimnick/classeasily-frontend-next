"use client";

import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { Modal } from "antd";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
import { LordIcon } from "@/services/ReactUtils";
import { getClassFeatureDescription } from "@/app/classes/_constants/classFeatureDescriptions";

// --- Styled Components ---

const OffersContainer = styled(motion.div)`
  background: white;
  width: 100%;
  padding: 0 0 1rem;

  @media (max-width: 768px) {
    padding: 0 1.25rem 1rem;
  }
`;

const Title = styled.h2`
  font-size: clamp(20px, 0.95rem + 1.5vw, 23px);
  font-weight: 600;
  color: #111111;
  line-height: 1.25;
  margin: 0 0 1.25rem;
`;

/* 2-column on desktop, 1-column on mobile — items separated by divider lines */
const FeaturesGrid = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 1.5rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureRowItem = styled(motion.li)`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
`;

const IconWrap = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  margin-top: 1px;
  background: ${(props) => (props.$highlighted ? "#fff8f8" : "#f8f8f8")};
  border-radius: 8px;
`;

const FeatureTextStack = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const FeatureTitleText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #111111;
  line-height: 1.3;
`;

const FeatureDescText = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: #717171;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/* Matches ClassReviews ShowAllButton exactly */
const ShowAllButton = styled(motion.button)`
  background-color: rgb(251, 251, 251);
  border: none;
  font-weight: 700;
  font-family: inherit;
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
  color: #111111;
  width: 100%;
  margin: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: background 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    background: #f5f5f5;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
  &:focus-visible {
    outline: 2px solid #111111;
    outline-offset: 2px;
  }
`;

/* --- Desktop Ant Design modal --- */
const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
  }
  .ant-modal-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #f0f0f0;
  }
  .ant-modal-body {
    padding: 0;
    max-height: 70vh;
    overflow-y: auto;
  }
  .ant-modal-title {
    font-size: 18px;
    font-weight: 600;
    color: #111111;
  }
  .ant-modal-close {
    color: #111111;
  }
  @media (max-width: 768px) {
    max-width: 95vw !important;
  }
`;

const ModalSection = styled.div`
  padding: 1.25rem 1.5rem;
  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
`;

const ModalSectionLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #717171;
  margin: 0 0 0.75rem;
`;

const ModalFeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 1.5rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ModalFeatureRow = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
`;

/* --- Mobile Vaul drawer --- */
const AmenitiesDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 3000;
`;

const AmenitiesDrawerContent = styled(Drawer.Content)`
  background: #ffffff;
  display: flex;
  flex-direction: column;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  max-height: 85vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3001;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.1);
  outline: none;
`;

const AmenitiesDrawerHandle = styled.div`
  width: 40px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 12px auto;
  flex-shrink: 0;
`;

const AmenitiesDrawerBody = styled.div`
  padding: 0 1.25rem 1.5rem;
  overflow-y: auto;
  flex: 1;
`;

const AmenitiesDrawerTitle = styled.h2`
  font-size: clamp(20px, 0.95rem + 1.5vw, 23px);
  font-weight: 600;
  color: #111111;
  line-height: 1.25;
  margin: 0 0 1.25rem;
`;

const AmenitiesDrawerList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const AmenitiesDrawerRow = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

// --- Feature Icons Configuration ---
const ICONS = {
  materials: {
    src: "https://cdn.lordicon.com/geexelvb.json",
    state: "hover-load",
    trigger: "in",
    colors:
      "primary:#ffc738,secondary:#ee6d66,tertiary:#2ca58d,quaternary:#b26836",
    delay: 2500,
  },
  handsOn: {
    src: "https://cdn.lordicon.com/cyrblumh.json",
    trigger: "in",
    state: "in-reveal",
    delay: 2500,
  },
  gift: {
    src: "https://cdn.lordicon.com/dznelzdk.json",
    trigger: "in",
    delay: 2000,
  },
  beginner: {
    src: "https://cdn.lordicon.com/zlpuwiky.json",
    trigger: "in",
    delay: 2500,
  },
  feedback: {
    src: "https://cdn.lordicon.com/hbdydiyg.json",
    trigger: "in",
    delay: 3000,
    colors:
      "primary:#f4c89c,secondary:#2ca58d,tertiary:#4bb3fd,quaternary:#ebe6ef,quinary:#ee6d66",
  },
  car: {
    src: "https://cdn.lordicon.com/zttzteli.json",
    trigger: "in",
    delay: 2000,
  },
  accessibility: {
    src: "https://cdn.lordicon.com/gjitbpzd.json",
    trigger: "in",
    delay: 2500,
    colors: "primary:#848484,secondary:#4bb3fd,tertiary:#3a3347",
  },
  love: {
    src: "https://cdn.lordicon.com/ajzwsrcs.json",
    trigger: "in",
    delay: 1500,
    state: "morph-glitter",
    colors: "primary:#ff385c",
  },
  team: {
    src: "https://cdn.lordicon.com/jjhehowc.json",
    trigger: "in",
    delay: 2500,
  },
  family: {
    src: "https://cdn.lordicon.com/ppnshiny.json",
    trigger: "in",
    delay: 2500,
    colors:
      "primary:#ebe6ef,secondary:#646e78,tertiary:#b26836,quaternary:#ffc738,quinary:#4bb3fd,senary:#92140c,septenary:#f4c89c,octonary:#3a3347",
  },
  intimate: {
    src: "https://cdn.lordicon.com/kxdxjyeh.json",
    trigger: "in",
    delay: 2000,
  },
  certificate: {
    src: "https://cdn.lordicon.com/zqfagoml.json",
    trigger: "in",
    delay: 2000,
    colors: "primary:#b26836,secondary:#ffc738",
  },
  food: {
    src: "https://cdn.lordicon.com/blouikfz.json",
    colors: "primary:#848484,secondary:#ffc738",
    trigger: "in",
    delay: 2000,
  },
  time: {
    src: "https://cdn.lordicon.com/hqjsxtda.json",
    trigger: "in",
    delay: 2000,
  },
  shopping: {
    src: "https://cdn.lordicon.com/fcjhqaqo.json",
    trigger: "in",
    delay: 2000,
  },
  clothing: {
    src: "https://cdn.lordicon.com/olxnnpiq.json",
    trigger: "in",
    delay: 2000,
  },
  language: {
    src: "https://cdn.lordicon.com/tpougfas.json",
    trigger: "in",
    delay: 2000,
  },
  default: {
    src: "https://cdn.lordicon.com/xodeitpr.json",
    trigger: "in",
    state: "in-reveal",
    delay: 2000,
  },
};

const featureIcons = {
  "all supplies included": { icon: ICONS.materials, highlight: true },
  "beginner friendly": { icon: ICONS.beginner, highlight: true },
  "drinks included": { icon: ICONS.food, highlight: true },
  "food included": { icon: ICONS.food, highlight: true },
  "take-home creation": { icon: ICONS.gift, highlight: true },
  "small group": { icon: ICONS.intimate, highlight: true },
  "private group available": { icon: ICONS.team, highlight: true },
  "date night": { icon: ICONS.love, highlight: true },
  "family friendly": { icon: ICONS.family, highlight: true },
  "great for teams": { icon: ICONS.team, highlight: true },
  "free parking": { icon: ICONS.car, highlight: true },
  indoor: { icon: ICONS.accessibility, highlight: false },
  outdoor: { icon: ICONS.handsOn, highlight: false },
  "wheelchair accessible": { icon: ICONS.accessibility, highlight: true },
  "all materials provided": { icon: ICONS.materials, highlight: true },
  "hands-on experience": { icon: ICONS.handsOn, highlight: true },
  "no experience necessary": { icon: ICONS.beginner, highlight: true },
  "personalized feedback": { icon: ICONS.feedback, highlight: true },
  "free on-site parking": { icon: ICONS.car, highlight: true },
  "date night special": { icon: ICONS.love, highlight: true },
  "great for team-building": { icon: ICONS.team, highlight: true },
  "family-friendly (all ages)": { icon: ICONS.family, highlight: true },
  "intimate class setting": { icon: ICONS.intimate, highlight: false },
  "suitable for all levels": { icon: ICONS.beginner, highlight: false },
  "certificate of completion": { icon: ICONS.certificate, highlight: false },
  "refreshments included": { icon: ICONS.food, highlight: false },
  "flexible booking": { icon: ICONS.time, highlight: false },
  "in-class materials for purchase": { icon: ICONS.shopping, highlight: false },
  "wear comfortable clothes": { icon: ICONS.clothing, highlight: false },
  "bilingual instructor": { icon: ICONS.language, highlight: false },
  default: { icon: ICONS.default, highlight: false },
};

function FeatureLines({ feature }) {
  const normalized =
    typeof feature === "string" ? feature.toLowerCase().trim() : "unknown";
  const raw = typeof feature === "string" ? feature : "Amenity";
  const title = raw.charAt(0).toUpperCase() + raw.slice(1);
  const description = getClassFeatureDescription(normalized);
  return (
    <FeatureTextStack>
      <FeatureTitleText>{title}</FeatureTitleText>
      {description ? <FeatureDescText>{description}</FeatureDescText> : null}
    </FeatureTextStack>
  );
}

const ClassOffers = React.memo(({ features }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const drawerCloseRef = useRef(null);

  useEffect(() => {
    const check = () =>
      setIsMobile(typeof window !== "undefined" && window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isModalVisible || !isMobile) return;
    const id = setTimeout(() => drawerCloseRef.current?.focus?.(), 0);
    return () => clearTimeout(id);
  }, [isModalVisible, isMobile]);

  const validFeatures = Array.isArray(features)
    ? features.filter((f) => typeof f === "string" && f.trim() !== "")
    : [];

  if (validFeatures.length === 0) return null;

  const visibleFeatures = validFeatures.slice(0, 6);
  const hasMoreFeatures = validFeatures.length > 6;

  const highlightedFeatures = validFeatures.filter(
    (f) =>
      (featureIcons[f.toLowerCase().trim()] || featureIcons["default"]).highlight
  );
  const otherFeatures = validFeatures.filter(
    (f) =>
      !(featureIcons[f.toLowerCase().trim()] || featureIcons["default"]).highlight
  );

  const openAll = () => setIsModalVisible(true);
  const closeAll = () => setIsModalVisible(false);
  const setDrawerOpen = (open) => setIsModalVisible(!!open);

  return (
    <OffersContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-labelledby="class-offers-title"
    >
      <Title id="class-offers-title">Things to know</Title>

      <FeaturesGrid role="list">
        <AnimatePresence>
          {visibleFeatures.map((feature, index) => {
            const normalized =
              typeof feature === "string" ? feature.toLowerCase().trim() : "unknown";
            const config = featureIcons[normalized] || featureIcons["default"];
            return (
              <FeatureRowItem
                key={`feature-${feature}-${index}`}
                role="listitem"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: (index % 10) * 0.04 }}
              >
                <IconWrap $highlighted={config.highlight}>
                  <LordIcon {...config.icon} style={{ width: "22px", height: "22px" }} />
                </IconWrap>
                <FeatureLines feature={feature} />
              </FeatureRowItem>
            );
          })}
        </AnimatePresence>
      </FeaturesGrid>

      {hasMoreFeatures && (
        <ShowAllButton
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openAll();
          }}
          whileTap={{ scale: 0.98 }}
          aria-label={`Show all ${validFeatures.length} features and amenities`}
        >
          Show all {validFeatures.length} amenities
        </ShowAllButton>
      )}

      {/* Mobile: Vaul bottom sheet */}
      <Drawer.Root
        open={isModalVisible && isMobile}
        onOpenChange={setDrawerOpen}
        shouldScaleBackground
      >
        <Drawer.Portal>
          <AmenitiesDrawerOverlay />
          <AmenitiesDrawerContent aria-describedby={undefined}>
            <AmenitiesDrawerHandle aria-hidden />
            <AmenitiesDrawerBody>
              <AmenitiesDrawerTitle>Things to know</AmenitiesDrawerTitle>
              <AmenitiesDrawerList role="list">
                {validFeatures.map((feature, index) => {
                  const normalized =
                    typeof feature === "string" ? feature.toLowerCase().trim() : "unknown";
                  const config = featureIcons[normalized] || featureIcons["default"];
                  return (
                    <AmenitiesDrawerRow key={`drawer-${feature}-${index}`}>
                      <IconWrap $highlighted={config.highlight}>
                        <LordIcon {...config.icon} style={{ width: "22px", height: "22px" }} />
                      </IconWrap>
                      <FeatureLines feature={feature} />
                    </AmenitiesDrawerRow>
                  );
                })}
              </AmenitiesDrawerList>
            </AmenitiesDrawerBody>
          </AmenitiesDrawerContent>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Desktop: Ant Design modal */}
      <StyledModal
        title="Things to know"
        open={isModalVisible && !isMobile}
        onCancel={closeAll}
        footer={null}
        width={720}
        centered
        aria-label="All experience features and amenities"
      >
        {highlightedFeatures.length > 0 && (
          <ModalSection>
            <ModalSectionLabel>Key features</ModalSectionLabel>
            <ModalFeaturesList role="list">
              {highlightedFeatures.map((feature, index) => {
                const normalized =
                  typeof feature === "string" ? feature.toLowerCase().trim() : "unknown";
                const config = featureIcons[normalized] || featureIcons["default"];
                return (
                  <ModalFeatureRow key={`modal-hi-${feature}-${index}`}>
                    <IconWrap $highlighted={config.highlight}>
                      <LordIcon {...config.icon} style={{ width: "22px", height: "22px" }} />
                    </IconWrap>
                    <FeatureLines feature={feature} />
                  </ModalFeatureRow>
                );
              })}
            </ModalFeaturesList>
          </ModalSection>
        )}
        {otherFeatures.length > 0 && (
          <ModalSection>
            <ModalSectionLabel>Additional information</ModalSectionLabel>
            <ModalFeaturesList role="list">
              {otherFeatures.map((feature, index) => {
                const normalized =
                  typeof feature === "string" ? feature.toLowerCase().trim() : "unknown";
                const config = featureIcons[normalized] || featureIcons["default"];
                return (
                  <ModalFeatureRow key={`modal-other-${feature}-${index}`}>
                    <IconWrap $highlighted={config.highlight}>
                      <LordIcon {...config.icon} style={{ width: "22px", height: "22px" }} />
                    </IconWrap>
                    <FeatureLines feature={feature} />
                  </ModalFeatureRow>
                );
              })}
            </ModalFeaturesList>
          </ModalSection>
        )}
      </StyledModal>
    </OffersContainer>
  );
});

ClassOffers.displayName = "ClassOffers";
export default ClassOffers;
