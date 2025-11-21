"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { Modal } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { Award as AwardIcon, Plus } from "lucide-react";
import { LordIcon } from "@/services/ReactUtils";

// --- Styled Components --- (No changes needed)
const OffersContainer = styled(motion.div)`
  background: white;
  border-radius: 16px;
  max-width: 800px;
  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 12px;
  }
  @media (max-width: 480px) {
    padding: 1.25rem;
    border-radius: 10px;
  }
`;
const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #000;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  svg {
    color: #ff385c;
    flex-shrink: 0;
  }
  @media (max-width: 768px) {
    font-size: 1.375rem;
    margin-bottom: 1.25rem;
    gap: 0.625rem;
  }
  @media (max-width: 480px) {
    font-size: 1.25rem;
    margin-bottom: 1rem;
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
  align-items: center;
  padding: 1rem;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eaeaea;
  font-family: "ProximaSoft", sans-serif;
  font-weight: 500;
  font-size: 0.9375rem;
  color: #000;
  transition: all 0.2s ease;
  word-break: break-word;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-color: #ff385c;
  }
  @media (max-width: 768px) {
    padding: 0.875rem;
    font-size: 0.9rem;
    border-radius: 10px;
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
  }
  @media (max-width: 480px) {
    padding: 0.75rem 0.875rem;
    font-size: 0.875rem;
  }
`;
const Tag = styled(TagBase)``;
const ModalTag = styled(TagBase)`
  margin: 0;
  &:hover {
    background: #fff8f8;
  }
`;
const IconWrapper = styled.span`
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: ${(props) => (props.$highlighted ? "#fff8f8" : "#f8f8f8")};
  border-radius: 8px;
  color: #ff385c;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
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
    padding: 1.5rem;
    border-bottom: 1px solid #eaeaea;
  }
  .ant-modal-body {
    padding: 0;
    max-height: 70vh;
    overflow-y: auto;
  }
  .ant-modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #000;
  }
  .ant-modal-close {
    color: #000;
  }
  @media (max-width: 768px) {
    max-width: 95vw !important;
    .ant-modal-header {
      padding: 1.25rem;
    }
    .ant-modal-title {
      font-size: 1.125rem;
    }
  }
  @media (max-width: 480px) {
    .ant-modal-header {
      padding: 1rem;
    }
    .ant-modal-title {
      font-size: 1rem;
    }
  }
`;
const ModalSection = styled.div`
  padding: 1.5rem;
  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
  @media (max-width: 768px) {
    padding: 1.25rem;
  }
  @media (max-width: 480px) {
    padding: 1rem;
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

// --- Feature Icons ---
const featureIcons = {
  "all materials provided": {
    icon: {
      src: "https://cdn.lordicon.com/geexelvb.json",
      state: "hover-load",
      trigger: "in",
      colors:
        "primary:#ffc738,secondary:#ee6d66,tertiary:#2ca58d,quaternary:#b26836",
      delay: 2500,
    },
    highlight: true,
  },
  "hands-on experience": {
    icon: {
      src: "https://cdn.lordicon.com/cyrblumh.json",
      trigger: "in",
      state: "in-reveal",
      delay: 2500,
    },
    highlight: true,
  },
  "take-home creation": {
    icon: {
      src: "https://cdn.lordicon.com/dznelzdk.json",
      trigger: "in",
      delay: 2000,
    },
    highlight: true,
  },
  "no experience necessary": {
    icon: {
      src: "https://cdn.lordicon.com/zlpuwiky.json",
      trigger: "in",
      delay: 2500,
    },
    highlight: true,
  },
  "personalized feedback": {
    icon: {
      src: "https://cdn.lordicon.com/hbdydiyg.json",
      trigger: "in",
      delay: 3000,
      colors:
        "primary:#f4c89c,secondary:#2ca58d,tertiary:#4bb3fd,quaternary:#ebe6ef,quinary:#ee6d66",
    },
    highlight: true,
  },
  "free on-site parking": {
    icon: {
      src: "https://cdn.lordicon.com/zttzteli.json",
      trigger: "in",
      delay: 2000,
    },
    highlight: true,
  },
  "wheelchair accessible": {
    icon: {
      src: "https://cdn.lordicon.com/gjitbpzd.json",
      trigger: "in",
      delay: 2500,
      colors: "primary:#848484,secondary:#4bb3fd,tertiary:#3a3347",
    },
    highlight: true,
  },
  "date night special": {
    icon: {
      src: "https://cdn.lordicon.com/xryjrepg.json",
      trigger: "in",
      delay: 1500,
      state: "in-love",
      colors: "primary:#ff385c",
    },
    highlight: true,
  },
  "great for team-building": {
    icon: {
      src: "https://cdn.lordicon.com/jjhehowc.json",
      trigger: "in",
      delay: 2500,
    },
    highlight: true,
  },
  "family-friendly (all ages)": {
    icon: {
      src: "https://cdn.lordicon.com/ppnshiny.json",
      trigger: "in",
      delay: 2500,
      colors:
        "primary:#ebe6ef,secondary:#646e78,tertiary:#b26836,quaternary:#ffc738,quinary:#4bb3fd,senary:#92140c,septenary:#f4c89c,octonary:#3a3347",
    },
    highlight: true,
  },
  "intimate class setting": {
    icon: {
      src: "https://cdn.lordicon.com/kxdxjyeh.json",
      trigger: "in",
      delay: 2000,
    },
    highlight: false,
  },
  "suitable for all levels": {
    icon: {
      src: "https://cdn.lordicon.com/rmzgsfkm.json",
      trigger: "in",
      delay: 2500,
    },
    highlight: false,
  },
  "certificate of completion": {
    icon: {
      src: "https://cdn.lordicon.com/zqfagoml.json",
      trigger: "in",
      delay: 2000,
      colors: "primary:#b26836,secondary:#ffc738",
    },
    highlight: false,
  },
  "refreshments included": {
    icon: {
      src: "https://cdn.lordicon.com/blouikfz.json",
      colors: "primary:#848484,secondary:#ffc738",
      trigger: "in",
      delay: 2000,
    },
    highlight: false,
  },
  "flexible booking": {
    icon: {
      src: "https://cdn.lordicon.com/hqjsxtda.json",
      trigger: "in",
      delay: 2000,
    },
    highlight: false,
  },
  "in-class materials for purchase": {
    icon: {
      src: "https://cdn.lordicon.com/fcjhqaqo.json",
      trigger: "in",
      delay: 2000,
    },
    highlight: false,
  },
  "wear comfortable clothes": {
    icon: {
      src: "https://cdn.lordicon.com/olxnnpiq.json",
      trigger: "in",
      delay: 2000,
    },
    highlight: false,
  },
  "bilingual instructor": {
    icon: {
      src: "https://cdn.lordicon.com/tpougfas.json",
      trigger: "in",
      delay: 2000,
    },
    highlight: false,
  },
  default: {
    icon: {
      src: "https://cdn.lordicon.com/vjhdnjhx.json",
      trigger: "in",
      delay: 2000,
    },
    highlight: false,
  },
};

const FeatureTag = ({ feature, isModal = false, index }) => {
  const TagComponent = isModal ? ModalTag : Tag;
  const normalizedFeature =
    typeof feature === "string" ? feature.toLowerCase().trim() : "unknown";
  const featureConfig =
    featureIcons[normalizedFeature] || featureIcons["default"];
  const displayFeature = typeof feature === "string" ? feature : "Amenity";

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
      {displayFeature.charAt(0).toUpperCase() + displayFeature.slice(1)}
    </TagComponent>
  );
};

const ClassOffers = React.memo(({ features }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const validFeatures = Array.isArray(features)
    ? features.filter((f) => typeof f === "string" && f.trim() !== "")
    : [];
  if (validFeatures.length === 0) {
    return null; // Don't render the section if there are no features
  }

  const visibleFeatures = validFeatures.slice(0, 6);
  const hasMoreFeatures = validFeatures.length > 6;
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

  return (
    <OffersContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-labelledby="class-offers-title"
    >
      <Title id="class-offers-title">
        <AwardIcon size={24} aria-hidden="true" />
        What this class offers
      </Title>
      <TagsGrid role="list">
        <AnimatePresence>
          {visibleFeatures.map((feature, index) => (
            <FeatureTagListItem key={`visible-${feature}-${index}`}>
              <FeatureTag feature={feature} index={index} />
            </FeatureTagListItem>
          ))}
        </AnimatePresence>
      </TagsGrid>
      {hasMoreFeatures && (
        <ShowAllButton
          onClick={() => setIsModalVisible(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label={`Show all ${validFeatures.length} features and amenities`}
        >
          <Plus size={18} aria-hidden="true" />
          Show all {validFeatures.length} amenities
        </ShowAllButton>
      )}
      <StyledModal
        title={`What this place offers`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        centered
        aria-label="All class features and amenities"
      >
        {highlightedFeatures.length > 0 && (
          <ModalSection>
            <ModalSectionTitle>Key Features</ModalSectionTitle>
            <ModalTagsContainer role="list">
              <AnimatePresence>
                {highlightedFeatures.map((feature, index) => (
                  <FeatureTagListItem
                    key={`modal-highlight-${feature}-${index}`}
                  >
                    <FeatureTag
                      feature={feature}
                      isModal={true}
                      index={index}
                    />
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
                    <FeatureTag
                      feature={feature}
                      isModal={true}
                      index={index}
                    />
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
