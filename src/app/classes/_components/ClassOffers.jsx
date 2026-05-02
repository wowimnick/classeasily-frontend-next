"use client";

import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { Modal } from "antd";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
import { Award as AwardIcon, Plus, X } from "lucide-react";
import { LordIcon } from "@/services/ReactUtils";
import { getClassFeatureDescription } from "@/app/classes/_constants/classFeatureDescriptions";

// --- Styled Components ---
const OffersContainer = styled(motion.div)`
  background: white;
  border-radius: 16px;
  max-width: 800px;
  padding: 1rem;
  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 12px;
  }
  @media (max-width: 480px) {
    padding: 1rem;
    border-radius: 10px;
  }
`;
const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #000;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  svg {
    color: #ff385c;
    flex-shrink: 0;
  }
  @media (max-width: 768px) {
    margin-bottom: 0.75rem;
    gap: 0.625rem;
  }
  @media (max-width: 480px) {
    gap: 0.5rem;
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;
const TagsGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0;
  list-style: none;
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.875rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  @media (max-width: 480px) {
    margin-bottom: 1.25rem;
  }
`;

/* Mobile: single column, attached rows with divider lines (like CalendarStep timeslots) */
const MobileAmenitiesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
  display: none;
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
  }
`;
const MobileAmenityRow = styled(motion.li)`
  display: flex;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  font-family: "ProximaSoft", sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
  color: #000;
  word-break: break-word;
  &:first-of-type {
    border-top: none;
  }
  @media (max-width: 480px) {
    padding: 0.65rem 1rem;
    font-size: 0.8125rem;
  }
`;
const ModalTagsContainer = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  list-style: none;
  padding: 0;
  margin: 0;
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.875rem;
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;
const FeatureTagListItem = styled.li`
  display: contents;
`;
const TagBase = styled(motion.div)`
  display: flex;
  align-items: flex-start;
  gap: 0;
  padding: 0.75rem 0.875rem;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eaeaea;
  font-family: "ProximaSoft", sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
  color: #000;
  transition: all 0.2s ease;
  word-break: break-word;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-color: #ff385c;
  }
  @media (max-width: 768px) {
    padding: 0.625rem 0.75rem;
    font-size: 0.875rem;
    border-radius: 10px;
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
  }
  @media (max-width: 480px) {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
  }
`;
const Tag = styled(TagBase)``;
const ModalTag = styled(TagBase)`
  margin: 0;
  &:hover {
    background: #fff8f8;
  }
`;
const FeatureTextStack = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;
const FeatureTitleText = styled.span`
  font-weight: 500;
  color: #111;
  line-height: 1.25;
`;
const FeatureDescText = styled.span`
  font-size: 11px;
  font-weight: 400;
  color: #717171;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;
const IconWrapper = styled.span`
  margin-right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  margin-top: 1px;
  background: ${(props) => (props.$highlighted ? "#fff8f8" : "#f8f8f8")};
  border-radius: 8px;
  color: #ff385c;
  transition: background-color 0.2s ease;
  ${TagBase}:hover & {
    background: #fff8f8;
  }
  @media (max-width: 768px) {
    margin-right: 0.875rem;
    width: 32px;
    height: 32px;
    border-radius: 6px;
  }
  @media (max-width: 480px) {
    margin-right: 0.75rem;
    width: 30px;
    height: 30px;
  }
`;
const ShowAllButton = styled(motion.button)`
  background-color: white;
  border: 1px solid #eaeaea;
  font-family: "ProximaSoft", sans-serif;
  font-weight: 500;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9375rem;
  color: #000;
  width: 100%;
  max-width: 300px;
  transition: all 0.2s ease;
  margin: 0 auto;
  &:hover {
    background-color: #fff8f8;
    border-color: #ff385c;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  &:focus-visible {
    outline: 2px solid #ff385c;
    outline-offset: 2px;
    border-color: #ff385c;
  }
  svg {
    margin-right: 0.75rem;
    flex-shrink: 0;
  }
  @media (max-width: 768px) {
    max-width: 280px;
    padding: 0.875rem 1.25rem;
    font-size: 0.9rem;
    border-radius: 10px;
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
  }
  @media (max-width: 480px) {
    max-width: 100%;
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    svg {
      margin-right: 0.5rem;
      width: 16px;
      height: 16px;
    }
  }
`;
const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
  }
  .ant-modal-header {
    padding: 1rem;
    border-bottom: 1px solid #eaeaea;
  }
  .ant-modal-body {
    padding: 0;
    max-height: 70vh;
    overflow-y: auto;
  }
  .ant-modal-title {
    font-size: 20px;
    font-weight: 600;
    color: #000;
  }
  .ant-modal-close {
    color: #000;
  }
  @media (max-width: 768px) {
    max-width: 95vw !important;
    .ant-modal-title {
      font-size: 1.125rem;
    }
  }
  @media (max-width: 480px) {
    .ant-modal-title {
      font-size: 1rem;
    }
  }
`;
const ModalSection = styled.div`
  padding: 1rem;
  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
`;
const ModalSectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const DesktopTagsWrap = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

/* Mobile: Vaul drawer — same pattern as ClassPageClient date/time drawers (fixed bottom sheet) */
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
const AmenitiesDrawerList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
`;
const AmenitiesDrawerRow = styled.li`
  display: flex;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  font-family: "ProximaSoft", sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
  color: #000;
  word-break: break-word;
  &:first-of-type {
    border-top: none;
  }
`;
const AmenitiesDrawerTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #000;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  svg {
    color: #ff385c;
    flex-shrink: 0;
  }
`;
const AmenitiesDrawerClose = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #374151;
  &:hover {
    background: #e5e7eb;
    color: #111;
  }
`;
const AmenitiesDrawerBody = styled.div`
  padding: 0 1rem 1rem;
  overflow-y: auto;
  flex: 1;
  position: relative;
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
    src: "https://cdn.lordicon.com/xryjrepg.json",
    trigger: "in",
    delay: 1500,
    state: "in-love",
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

// Map feature text to specific icon configurations
const featureIcons = {
  // --- New "Local Experience" Mappings ---
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

  // --- Legacy Mappings (Maintained for compatibility) ---
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

  // Default fallback
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

const FeatureTag = ({ feature, isModal = false, index }) => {
  const TagComponent = isModal ? ModalTag : Tag;
  const normalizedFeature =
    typeof feature === "string" ? feature.toLowerCase().trim() : "unknown";
  const featureConfig =
    featureIcons[normalizedFeature] || featureIcons["default"];

  return (
    <TagComponent
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, delay: (index % 10) * 0.05 }}
    >
      <IconWrapper $highlighted={featureConfig.highlight}>
        <LordIcon
          {...featureConfig.icon}
          style={{ width: "24px", height: "24px" }}
        />
      </IconWrapper>
      <FeatureLines feature={feature} />
    </TagComponent>
  );
};

const MobileAmenityRowContent = ({ feature, index }) => {
  const normalizedFeature =
    typeof feature === "string" ? feature.toLowerCase().trim() : "unknown";
  const featureConfig =
    featureIcons[normalizedFeature] || featureIcons["default"];
  return (
    <MobileAmenityRow
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: (index % 10) * 0.03 }}
    >
      <IconWrapper $highlighted={featureConfig.highlight}>
        <LordIcon
          {...featureConfig.icon}
          style={{ width: "24px", height: "24px" }}
        />
      </IconWrapper>
      <FeatureLines feature={feature} />
    </MobileAmenityRow>
  );
};

const ClassOffers = React.memo(({ features }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const drawerCloseRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Move focus into the drawer when it opens so the trigger button (inside aria-hidden region) does not retain focus
  useEffect(() => {
    if (!isModalVisible || !isMobile) return;
    const id = setTimeout(() => drawerCloseRef.current?.focus?.(), 0);
    return () => clearTimeout(id);
  }, [isModalVisible, isMobile]);

  const validFeatures = Array.isArray(features)
    ? features.filter((f) => typeof f === "string" && f.trim() !== "")
    : [];
  if (validFeatures.length === 0) {
    return null; // Don't render if no features
  }

  const visibleFeatures = validFeatures.slice(0, 6);
  const hasMoreFeatures = validFeatures.length > 6;

  // Split features into Highlighted vs Others for the modal/drawer
  const highlightedFeatures = validFeatures.filter(
    (f) =>
      (featureIcons[f.toLowerCase().trim()] || featureIcons["default"])
        .highlight
  );
  const otherFeatures = validFeatures.filter(
    (f) =>
      !(featureIcons[f.toLowerCase().trim()] || featureIcons["default"])
        .highlight
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
      <Title id="class-offers-title">
        Things to know
      </Title>

      <DesktopTagsWrap>
        <TagsGrid role="list">
          <AnimatePresence>
            {visibleFeatures.map((feature, index) => (
              <FeatureTagListItem key={`visible-${feature}-${index}`}>
                <FeatureTag feature={feature} index={index} />
              </FeatureTagListItem>
            ))}
          </AnimatePresence>
        </TagsGrid>
      </DesktopTagsWrap>

      <MobileAmenitiesList role="list">
        {visibleFeatures.map((feature, index) => (
          <MobileAmenityRowContent key={`mobile-${feature}-${index}`} feature={feature} index={index} />
        ))}
      </MobileAmenitiesList>

      {hasMoreFeatures && (
        <ShowAllButton
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openAll();
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label={`Show all ${validFeatures.length} features and amenities`}
        >
          <Plus size={18} aria-hidden="true" />
          Show all {validFeatures.length} amenities
        </ShowAllButton>
      )}

      {/* Mobile: Vaul drawer — same pattern as ClassPageClient date/time drawers (fixed bottom) */}
      <Drawer.Root open={isModalVisible && isMobile} onOpenChange={setDrawerOpen} shouldScaleBackground>
        <Drawer.Portal>
          <AmenitiesDrawerOverlay />
          <AmenitiesDrawerContent aria-describedby={undefined}>
            <AmenitiesDrawerHandle aria-hidden />
            <AmenitiesDrawerBody>
              <AmenitiesDrawerTitle>
                Things to know
              </AmenitiesDrawerTitle>
              <AmenitiesDrawerList role="list">
                {validFeatures.map((feature, index) => {
                  const normalizedFeature =
                    typeof feature === "string" ? feature.toLowerCase().trim() : "unknown";
                  const featureConfig = featureIcons[normalizedFeature] || featureIcons["default"];
                  return (
                    <AmenitiesDrawerRow key={`drawer-${feature}-${index}`}>
                      <IconWrapper $highlighted={featureConfig.highlight}>
                        <LordIcon {...featureConfig.icon} style={{ width: "24px", height: "24px" }} />
                      </IconWrapper>
                      <FeatureLines feature={feature} />
                    </AmenitiesDrawerRow>
                  );
                })}
              </AmenitiesDrawerList>
            </AmenitiesDrawerBody>
          </AmenitiesDrawerContent>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Desktop: Ant Design modal with all amenities and mapped LordIcons */}
      <StyledModal
        title="What this experience offers"
        open={isModalVisible && !isMobile}
        onCancel={closeAll}
        footer={null}
        width={800}
        centered
        aria-label="All experience features and amenities"
      >
        {highlightedFeatures.length > 0 && (
          <ModalSection>
            <ModalSectionTitle>Key Features</ModalSectionTitle>
            <ModalTagsContainer role="list">
              <AnimatePresence>
                {highlightedFeatures.map((feature, index) => (
                  <FeatureTagListItem key={`modal-highlight-${feature}-${index}`}>
                    <FeatureTag feature={feature} isModal={true} index={index} />
                  </FeatureTagListItem>
                ))}
              </AnimatePresence>
            </ModalTagsContainer>
          </ModalSection>
        )}
        {otherFeatures.length > 0 && (
          <ModalSection>
            <ModalSectionTitle>Additional Information</ModalSectionTitle>
            <ModalTagsContainer role="list">
              <AnimatePresence>
                {otherFeatures.map((feature, index) => (
                  <FeatureTagListItem key={`modal-other-${feature}-${index}`}>
                    <FeatureTag feature={feature} isModal={true} index={index} />
                  </FeatureTagListItem>
                ))}
              </AnimatePresence>
            </ModalTagsContainer>
          </ModalSection>
        )}
      </StyledModal>
    </OffersContainer>
  );
});

ClassOffers.displayName = "ClassOffers";
export default ClassOffers;
