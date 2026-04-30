"use client";

import React, { useState, useRef, useLayoutEffect } from "react";
import styled from "styled-components";
import { Button, Typography } from "antd";
import CollapsibleSection from "./CollapsibleSection";
import { renderTextWithBold } from "./formatDescriptionText";

const { Paragraph } = Typography;

const COLLAPSED_MAX_HEIGHT_PX = 200;

const InfoWrapper = styled.section`
  display: flex;
  flex-direction: column;
  width: 100%;
  background: #ffffff;
  padding-top: 0.25rem;
`;

const DescriptionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  @media (max-width: 768px) {
    padding: 0 1.25rem 0.5rem;
  }
  @media (max-width: 480px) {
    padding: 0 1.25rem 0.5rem;
  }
`;

const Description = styled(Paragraph)`
  &.ant-typography {
    font-size: 1rem;
    line-height: 1.6;
    color: #222;
    margin-bottom: 0 !important;
    word-wrap: break-word;
    white-space: pre-line;

    strong {
      font-weight: 600;
      color: #111;
    }
    max-height: ${(props) =>
      props.$canBeTruncated && !props.$expanded
        ? `${COLLAPSED_MAX_HEIGHT_PX}px`
        : "none"};
    overflow: hidden;
    position: relative;
    transition: max-height 0.3s ease-in-out;
    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 80px;
      background: linear-gradient(transparent, white);
      opacity: ${(props) =>
        props.$canBeTruncated && !props.$expanded ? "1" : "0"};
      transition: opacity 0.3s ease-out;
      pointer-events: none;
    }
    @media (max-width: 768px) {
      font-size: 0.95rem;
      max-height: ${(props) =>
        props.$canBeTruncated && !props.$expanded ? "180px" : "none"};
      &::after {
        height: 60px;
      }
    }
    @media (max-width: 480px) {
      font-size: 0.9rem;
      max-height: ${(props) =>
        props.$canBeTruncated && !props.$expanded ? "150px" : "none"};
      &::after {
        height: 50px;
      }
    }
  }
`;

const ShowMoreButton = styled(Button)`
  align-self: flex-start;
  color: #ff385c !important;
  font-weight: 600;
  padding: 0 !important;
  border: none !important;
  background: none !important;
  box-shadow: none !important;
  height: auto !important;
  line-height: normal !important;
  &:hover,
  &:focus {
    color: #e03253 !important;
    background: none !important;
    text-decoration: underline;
  }
  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const ClassInformation = React.memo(
  ({ description, descriptionSections }) => {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [canBeTruncated, setCanBeTruncated] = useState(false);
    const descriptionRef = useRef(null);

    const sectionList = Array.isArray(descriptionSections)
      ? descriptionSections
      : [];

    useLayoutEffect(() => {
      if (sectionList.length > 0) {
        setCanBeTruncated(false);
        return;
      }
      const checkTruncation = () => {
        if (descriptionRef.current) {
          setCanBeTruncated(
            descriptionRef.current.scrollHeight > COLLAPSED_MAX_HEIGHT_PX,
          );
        }
      };
      checkTruncation();
      window.addEventListener("resize", checkTruncation);
      return () => window.removeEventListener("resize", checkTruncation);
    }, [description, sectionList.length]);

    const toggleDescription = () =>
      setIsDescriptionExpanded(!isDescriptionExpanded);

    return (
      <InfoWrapper>
        <DescriptionSection>
          {sectionList.length > 0 ? (
            sectionList.map((sec, idx) => (
              <CollapsibleSection
                key={sec.id || sec.title || idx}
                title={sec.title}
                defaultOpen={idx === 0}
              >
                {sec.body}
              </CollapsibleSection>
            ))
          ) : (
            <>
              <Description
                ref={descriptionRef}
                $expanded={isDescriptionExpanded}
                $canBeTruncated={canBeTruncated}
                id="class-description"
              >
                {renderTextWithBold(description)}
              </Description>
              {canBeTruncated && (
                <ShowMoreButton
                  type="link"
                  onClick={toggleDescription}
                  aria-expanded={isDescriptionExpanded}
                  aria-controls="class-description"
                >
                  {isDescriptionExpanded ? "Show less" : "Show more"}
                </ShowMoreButton>
              )}
            </>
          )}
        </DescriptionSection>
      </InfoWrapper>
    );
  },
);

ClassInformation.displayName = "ClassInformation";
export default ClassInformation;
