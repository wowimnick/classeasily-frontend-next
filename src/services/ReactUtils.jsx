import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

export const LordIcon = forwardRef(
  (
    {
      src,
      size = "20px",
      trigger = "hover",
      colors,
      className,
      style,
      playOnLoad = false,
      inState,
      onReady,
      onComplete,
    },
    ref
  ) => {
    const iconRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasPlayedIn, setHasPlayedIn] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Expose methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        play: () => {
          const icon = iconRef.current;
          if (icon && icon.playerInstance) {
            try {
              icon.playerInstance.playFromBeginning();
            } catch (error) {
              console.log("Animation play failed:", error);
            }
          }
        },
        stop: () => {
          const icon = iconRef.current;
          if (icon && icon.playerInstance) {
            try {
              icon.playerInstance.stop();
            } catch (error) {
              console.log("Animation stop failed:", error);
            }
          }
        },
        setColors: (newColors) => {
          const icon = iconRef.current;
          if (icon) {
            icon.setAttribute("colors", newColors);
          }
        },
        isReady: () => isReady,
      }),
      [isReady]
    );

    useEffect(() => {
      // Single source of truth: root layout loads lordicon.js via next/script.
      // Wait for that tag (or global) so we never inject a duplicate script.
      if (typeof window === "undefined") return;

      const markLoaded = () => setIsLoaded(true);

      if (window.customElements?.get("lord-icon") || window.lordicon) {
        markLoaded();
        return;
      }

      const existing = document.querySelector('script[src*="lordicon.js"]');
      if (existing) {
        if (window.customElements?.get("lord-icon") || window.lordicon) {
          markLoaded();
          return;
        }
        existing.addEventListener("load", markLoaded, { once: true });
        setTimeout(() => {
          if (window.customElements?.get("lord-icon") || window.lordicon) {
            markLoaded();
          }
        }, 0);
        return;
      }

      // Fallback (e.g. embeds/tests without RootLayout): inject once.
      const script = document.createElement("script");
      script.src = "https://cdn.lordicon.com/lordicon.js";
      script.async = true;
      script.onload = markLoaded;
      document.head.appendChild(script);
    }, []);

    useEffect(() => {
      const icon = iconRef.current;
      if (!icon || !isLoaded) return;

      const handleReady = () => {
        setIsReady(true);
        if (onReady) onReady();

        if (playOnLoad && !hasPlayedIn && icon.playerInstance) {
          try {
            icon.playerInstance.playFromBeginning();
          } catch (error) {
            console.log("Initial animation failed:", error);
          }
        }
      };

      const handleComplete = () => {
        if (playOnLoad && !hasPlayedIn) {
          setHasPlayedIn(true);
        }
        if (onComplete) onComplete();
      };

      // Wait for the icon to be ready
      if (icon.playerInstance) {
        handleReady();
      } else {
        icon.addEventListener("ready", handleReady, { once: true });
      }

      // Listen for complete events
      if (icon.playerInstance) {
        icon.playerInstance.addEventListener("complete", handleComplete);
      } else {
        icon.addEventListener(
          "ready",
          () => {
            if (icon.playerInstance) {
              icon.playerInstance.addEventListener("complete", handleComplete);
            }
          },
          { once: true }
        );
      }

      return () => {
        icon.removeEventListener("ready", handleReady);
        if (icon.playerInstance) {
          icon.playerInstance.removeEventListener("complete", handleComplete);
        }
      };
    }, [isLoaded, playOnLoad, hasPlayedIn, onReady, onComplete]);

    // Update colors when they change
    useEffect(() => {
      const icon = iconRef.current;
      if (icon && isReady) {
        icon.setAttribute("colors", colors);
      }
    }, [colors, isReady]);

    const currentTrigger = playOnLoad && !hasPlayedIn ? "in" : trigger;
    const currentState = playOnLoad && !hasPlayedIn ? inState : undefined;

    return (
      <lord-icon
        ref={iconRef}
        src={src}
        trigger={currentTrigger}
        state={currentState}
        colors={colors}
        stroke="75"
        style={{
          width: size,
          height: size,
          pointerEvents: "none",
          ...style,
        }}
        className={className}
      />
    );
  }
);
