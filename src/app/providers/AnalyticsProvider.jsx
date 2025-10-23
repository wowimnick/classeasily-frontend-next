// src/app/providers/AnalyticsProvider.jsx

"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-VVPN8KPTCY";

function AnalyticsProviderContent({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize GA4 once on mount with proper consent handling
  useEffect(() => {
    const initAnalytics = () => {
      // Initialize dataLayer if not already present
      window.dataLayer = window.dataLayer || [];
      const gtag = (...args) => window.dataLayer.push(args);

      // Set default consent state (GDPR-compliant)
      gtag("consent", "default", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        wait_for_update: 500,
      });

      // Check for existing consent
      const hasConsent = localStorage.getItem("cookie_consent") === "true";

      if (!hasConsent) {
        setIsInitialized(true);
        return;
      }

      // Load GA4 script dynamically
      const script = document.createElement("script");
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        // Initialize GA4
        gtag("js", new Date());
        gtag("config", GA_MEASUREMENT_ID, {
          send_page_view: false, // We'll handle page views manually
          cookie_flags: "SameSite=None;Secure",
        });

        // Update consent
        gtag("consent", "update", {
          analytics_storage: "granted",
          ad_storage: "denied", // Keep ad storage denied unless you need remarketing
        });

        // Dynamically import ReactGA for better tree-shaking
        import("react-ga4")
          .then((module) => {
            const ReactGA = module.default;
            ReactGA.initialize(GA_MEASUREMENT_ID, {
              gaOptions: {
                cookieFlags: "SameSite=None;Secure",
                cookie_domain: "auto",
                cookie_expires: 63072000, // 2 years in seconds
              },
            });
            setIsInitialized(true);
          })
          .catch((error) => {
            console.warn("Failed to initialize ReactGA:", error);
            setIsInitialized(true);
          });
      };

      script.onerror = () => {
        console.warn("Failed to load Google Analytics script");
        setIsInitialized(true);
      };

      document.head.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    };

    // Use requestIdleCallback to defer analytics initialization until browser is idle
    if ("requestIdleCallback" in window) {
      const idleCallbackId = window.requestIdleCallback(initAnalytics, {
        timeout: 2000, // Fallback after 2s if browser never idles
      });
      return () => window.cancelIdleCallback(idleCallbackId);
    } else {
      // Fallback for browsers without requestIdleCallback (Safari)
      const timeoutId = setTimeout(initAnalytics, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  // Handle consent changes from other tabs
  useEffect(() => {
    const handleConsentChange = (e) => {
      // Only react to cookie_consent changes
      if (e.key === "cookie_consent") {
        const hasConsent = e.newValue === "true";
        // Reload page if consent was just granted and analytics not initialized
        if (hasConsent && !isInitialized) {
          window.location.reload();
        }
      }
    };

    window.addEventListener("storage", handleConsentChange);
    return () => window.removeEventListener("storage", handleConsentChange);
  }, [isInitialized]);

  // Track page views on route changes
  useEffect(() => {
    if (!isInitialized) return;

    const trackPageView = async () => {
      try {
        const ReactGA = (await import("react-ga4")).default;

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
      } catch (error) {
        // Silently fail - analytics shouldn't break the app
        console.warn("Failed to track pageview:", error);
      }
    };

    trackPageView();
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
