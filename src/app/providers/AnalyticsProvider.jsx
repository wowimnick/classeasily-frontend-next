// src/app/providers/AnalyticsProvider.jsx

"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const GA_MEASUREMENT_ID = "G-VVPN8KPTCY";

function AnalyticsProviderContent({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isInitialized, setIsInitialized] = useState(false);

  // CRITICAL: Defer analytics initialization until after page is interactive
  useEffect(() => {
    // Use requestIdleCallback to defer non-critical analytics
    const initAnalytics = () => {
      const gtag = (...args) => {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(...args);
      };

      // Set default consent state
      gtag("consent", "default", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        wait_for_update: 500,
      });

      const hasConsent = localStorage.getItem("cookie_consent") === "true";
      if (!hasConsent) {
        setIsInitialized(true);
        return;
      }

      // CRITICAL: Load GA script asynchronously without blocking
      const script = document.createElement("script");
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        gtag("js", new Date());
        gtag("config", GA_MEASUREMENT_ID, {
          send_page_view: false,
          cookie_flags: "SameSite=None;Secure",
        });
        gtag("consent", "update", {
          analytics_storage: "granted",
          ad_storage: "denied",
        });

        // Dynamically import ReactGA only when needed
        import("react-ga4").then((module) => {
          const ReactGA = module.default;
          ReactGA.initialize(GA_MEASUREMENT_ID, {
            gaOptions: { cookieFlags: "SameSite=None;Secure" },
          });
          setIsInitialized(true);
        });
      };

      script.onerror = () => {
        console.warn("Failed to load Google Analytics");
        setIsInitialized(true);
      };

      document.head.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    };

    // Use requestIdleCallback to defer analytics initialization
    if ("requestIdleCallback" in window) {
      const idleCallbackId = window.requestIdleCallback(initAnalytics, {
        timeout: 2000,
      });
      return () => window.cancelIdleCallback(idleCallbackId);
    } else {
      // Fallback: use setTimeout with a delay
      const timeoutId = setTimeout(initAnalytics, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, []); // Run once on mount

  // Effect for handling consent changes from other tabs
  useEffect(() => {
    const handleConsentChange = () => {
      const hasConsent = localStorage.getItem("cookie_consent") === "true";
      // Only reload if consent was just granted
      if (hasConsent && !isInitialized) {
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleConsentChange);
    return () => window.removeEventListener("storage", handleConsentChange);
  }, [isInitialized]);

  // Effect for tracking page views
  useEffect(() => {
    if (!isInitialized) return;

    // Dynamically check if ReactGA is available
    import("react-ga4")
      .then((module) => {
        const ReactGA = module.default;
        if (ReactGA.isInitialized) {
          const url =
            pathname +
            (searchParams.toString() ? `?${searchParams.toString()}` : "");
          ReactGA.send({
            hitType: "pageview",
            page: url,
            title: document.title,
          });
        }
      })
      .catch(() => {
        // Silently fail if ReactGA is not available
      });
  }, [pathname, searchParams, isInitialized]);

  return <>{children}</>;
}

export default function AnalyticsProvider({ children }) {
  return (
    <Suspense fallback={children}>
      <AnalyticsProviderContent>{children}</AnalyticsProviderContent>
    </Suspense>
  );
}
