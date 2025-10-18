"use client";

import React from "react";

// Simple inline styles instead of styled-components
const svgStyle = { transition: "0.1s" };
const shapeStyle = { transition: "0.1s" };

const LogoIcon = ({
  size,
  isScrolled = false,
  restingColor = "#fff",
  activeColor = "#ff385c",
  ariaLabel = "Classeasily Logo",
}) => {
  const color = isScrolled ? activeColor : restingColor;

  return (
    <svg
      xmlnsXlink="http://www.w3.org/1999/xlink"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64.81481481481481 105.86419753086419"
      width={size}
      height={size}
      fill={color}
      role="img"
      aria-labelledby="logoTitle"
      style={svgStyle}
    >
      <title id="logoTitle">{ariaLabel}</title>
      <g
        transform="translate(-21.604938271604937, -1.0802469135802468) scale(1.0802469135802468)"
        className="css-mtuv8n"
        fill={color}
      >
        <circle
          xmlns="http://www.w3.org/2000/svg"
          cx="64"
          cy="30"
          r="4"
          fill={color}
          style={shapeStyle}
        />
        <circle
          xmlns="http://www.w3.org/2000/svg"
          cx="36"
          cy="30"
          r="4"
          fill={color}
          style={shapeStyle}
        />
        <path
          xmlns="http://www.w3.org/2000/svg"
          d="M55,64c0-3.3,2.7-6,6-6v10c0,10.5,8.5,19,19,19V10c0,0-10-9-30.1-9C29.9,1,20,10,20,10v47c0,23.2,18.8,42,42,42h18v-6 c-13.8,0-25-11.2-25-25V64z M49.9,51C35.1,51,26,43,26,38V14c23,0,23,25,24,28c1-3,1-28,24-28v24C74,42.1,64.8,51,49.9,51z"
          fill={color}
          style={shapeStyle}
        />
      </g>
    </svg>
  );
};

export default LogoIcon;
