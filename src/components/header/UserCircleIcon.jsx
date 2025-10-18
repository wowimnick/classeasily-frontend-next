import React, { useEffect, useRef, useState } from "react";

/**
 * Renders an animated user avatar icon using LordIcon with "in" effect.
 * This component properly handles color transitions on scroll.
 *
 * @param {object} props - The component props.
 * @param {string} [props.size='36px'] - The width and height of the icon.
 * @param {string} [props.color='#ffffff'] - The color for the icon (applies to both primary and secondary).
 * @param {string} [props.primaryColor] - Override for primary color (takes precedence over color).
 * @param {string} [props.secondaryColor] - Override for secondary color (takes precedence over color).
 * @param {string} [props.trigger='in'] - The animation trigger ('in', 'hover', 'click', 'loop').
 * @param {object} [props.style] - Custom inline styles to apply to the lord-icon element.
 * @returns {React.ReactElement} The rendered animated icon.
 */
const UserCircleIcon = ({
  size = "36px",
  color = "#ffffff",
  primaryColor,
  secondaryColor,
  trigger = "in",
  style,
  ...props
}) => {
  // Use specific colors if provided, otherwise fall back to the general color prop
  const finalPrimaryColor = primaryColor || color;
  const finalSecondaryColor = secondaryColor || color;
  const iconRef = useRef(null);
  const previousColorsRef = useRef({
    primary: finalPrimaryColor,
    secondary: finalSecondaryColor,
  });
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load LordIcon script if not already loaded
    if (
      !window.lordicon &&
      !document.querySelector('script[src*="lordicon"]')
    ) {
      const script = document.createElement("script");
      script.src = "https://cdn.lordicon.com/lordicon.js";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.head.appendChild(script);
    } else if (window.lordicon) {
      setScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Check if colors have changed
    const prevColors = previousColorsRef.current;
    const currentColors = {
      primary: finalPrimaryColor,
      secondary: finalSecondaryColor,
    };

    const colorsChanged =
      prevColors.primary !== currentColors.primary ||
      prevColors.secondary !== currentColors.secondary;

    if (colorsChanged && iconRef.current && scriptLoaded && window.lordicon) {
      // Small delay to ensure the color attribute is updated before playing
      setTimeout(() => {
        iconRef.current?.playerInstance?.play();
      }, 50);
    }

    // Update previous colors
    previousColorsRef.current = currentColors;
  }, [finalPrimaryColor, finalSecondaryColor, scriptLoaded]);

  return (
    <lord-icon
      ref={iconRef}
      src="https://cdn.lordicon.com/cniwvohj.json"
      trigger={trigger}
      state="in-account"
      colors={`primary:${finalPrimaryColor},secondary:${finalSecondaryColor}`}
      style={{
        width: size,
        height: size,
        transition: "all 0.3s ease",
        ...style,
      }}
      {...props}
    ></lord-icon>
  );
};

export default UserCircleIcon;
