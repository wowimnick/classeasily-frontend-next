import React, { useRef, useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import NumberFlow, { continuous } from "@number-flow/react";

const Container = styled.div`
  position: relative;
  width: 100%;
  margin: 20px 0;
`;

const Track = styled.div`
  height: 6px;
  background: #ebebeb;
  border-radius: 3px;
  cursor: pointer;
  margin-top: 32px; // Add space for the always-visible value
`;

const Fill = styled.div`
  position: absolute;
  height: 100%;
  background: #ff385c;
  border-radius: 3px;
`;

const Thumb = styled.div`
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border: 2px solid #ff385c;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  top: 50%;
  transform: translate(-50%, -50%);
  transition: transform 0.2s;
  user-select: none;
  touch-action: none;

  &:hover {
    transform: translate(-50%, -50%) scale(1.1);
  }

  ${(props) =>
    props.$isDragging &&
    `
    transform: translate(-50%, -50%) scale(1.1);
  `}
`;

const ValueDisplay = styled.div`
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  ${(props) =>
    props.$isDragging &&
    `
    background: #ff385c;
    color: white;
    border-color: #ff385c;
  `}
`;

const Slider = ({
  value,
  onChange,
  min = 0,
  max = 100,
  format = {},
  prefix = "",
  suffix = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const frameRef = useRef();

  const getPercentage = () => ((value - min) / (max - min)) * 100;

  const handleMove = useCallback(
    (clientX) => {
      if (!sliderRef.current) return;

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        const rect = sliderRef.current.getBoundingClientRect();
        const percentage = Math.min(
          Math.max(0, (clientX - rect.left) / rect.width),
          1
        );
        const newValue = min + percentage * (max - min);
        onChange(Math.min(max, Math.max(min, newValue)));
      });
    },
    [min, max, onChange]
  );

  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(true);
      handleMove(e.clientX);
    },
    [handleMove]
  );

  const handleTouchStart = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(true);
      handleMove(e.touches[0].clientX);
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
      <Track
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <Fill style={{ width: `${getPercentage()}%` }} />
        <div
          style={{
            position: "absolute",
            left: `${getPercentage()}%`,
            top: 0,
            height: "100%",
          }}
        >
          <Thumb
            onDragStart={(e) => e.preventDefault()}
            $isDragging={isDragging}
          >
            <ValueDisplay $isDragging={isDragging}>
              {prefix && <span>{prefix} </span>}
              <NumberFlow
                locales="en-US"
                willChange
                value={value}
                isolate
                plugins={[continuous]}
                format={format}
              />
              {suffix && <span> {suffix}</span>}
            </ValueDisplay>
          </Thumb>
        </div>
      </Track>
    </Container>
  );
};

export default React.memo(Slider);
