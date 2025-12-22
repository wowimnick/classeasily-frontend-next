"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import NumberFlow, { continuous } from "@number-flow/react";

const PRIMARY_COLOR = "#f81e3e"; // Updated primary color

const Container = styled.div`
  width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #222222;
`;

const ValueWrapper = styled.div`
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TrackWrapper = styled.div`
  position: relative;
  height: 32px; /* Touch target height */
  display: flex;
  align-items: center;
  cursor: pointer;
  touch-action: none;
`;

const Track = styled.div`
  width: 100%;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
`;

const Fill = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: ${PRIMARY_COLOR}; // Use primary color for fill
  border-radius: 2px;
`;

const Thumb = styled.div`
  position: absolute;
  width: 28px;
  height: 28px;
  background: white;
  border: 1.5px solid ${PRIMARY_COLOR}; // Use primary color for border
  box-shadow: 0 4px 10px rgba(248, 30, 62, 0.2); // Adjusted shadow color
  border-radius: 50%;
  top: 50%;
  transform: translate(-50%, -50%) scale(1);
  transition: transform 0.1s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s;
  z-index: 2;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: "";
    width: 6px;
    height: 6px;
    background: ${PRIMARY_COLOR}; // Use primary color for internal dot
    border-radius: 50%;
  }

  &:hover {
    transform: translate(-50%, -50%) scale(1.1);
    box-shadow: 0 6px 14px rgba(248, 30, 62, 0.3); // Adjusted shadow color
  }

  &:active {
    cursor: grabbing;
    transform: translate(-50%, -50%) scale(0.95);
    box-shadow: 0 2px 8px rgba(248, 30, 62, 0.15); // Adjusted shadow color
  }

  ${(props) =>
    props.$isDragging &&
    `
    transform: translate(-50%, -50%) scale(1.1);
    cursor: grabbing;
    border-color: ${PRIMARY_COLOR};
  `}
`;

const Slider = ({
  value,
  onChange,
  min = 0,
  max = 100,
  label = "",
  format = {},
  prefix = "",
  suffix = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);
  const frameRef = useRef();

  const getPercentage = () => {
    const safeValue = Math.min(Math.max(value, min), max);
    return ((safeValue - min) / (max - min)) * 100;
  };

  const handleMove = useCallback(
    (clientX) => {
      if (!trackRef.current) return;

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        const rect = trackRef.current.getBoundingClientRect();
        const percentage = Math.min(
          Math.max(0, (clientX - rect.left) / rect.width),
          1
        );
        const newValue = min + percentage * (max - min);
        onChange(Math.round(newValue));
      });
    },
    [min, max, onChange]
  );

  const handleStart = useCallback(
    (clientX) => {
      setIsDragging(true);
      handleMove(clientX);
    },
    [handleMove]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      e.preventDefault();
      handleMove(e.clientX);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };

    const handleEnd = () => {
      setIsDragging(false);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: false });
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, handleMove]);

  return (
    <Container>
      <Header>
        <Label>{label}</Label>
        <ValueWrapper>
          {prefix}
          <NumberFlow
            locales="en-US"
            value={value}
            plugins={[continuous]}
            format={format}
          />
          {suffix}
        </ValueWrapper>
      </Header>

      <TrackWrapper
        ref={trackRef}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      >
        <Track>
          <Fill style={{ width: `${getPercentage()}%` }} />
        </Track>
        <Thumb
          style={{ left: `${getPercentage()}%` }}
          $isDragging={isDragging}
          onClick={(e) => e.stopPropagation()}
        />
      </TrackWrapper>
    </Container>
  );
};

export default React.memo(Slider);
