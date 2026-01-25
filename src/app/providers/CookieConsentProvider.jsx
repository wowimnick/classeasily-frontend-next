"use client";

import { useState, useEffect } from "react";
import message from "@/lib/message";
import CookieConsentBanner from "@/components/auth/CookieConsentBanner";

export default function CookieConsentProvider({ children }) {
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Check permanent consent (Local Storage)
    const consent = localStorage.getItem("cookie_consent");

    // Check temporary dismissal (Session Storage)
    const dismissed = sessionStorage.getItem("cookie_consent_dismissed");

    // Only show if no permanent choice AND not temporarily dismissed
    if (consent === null && !dismissed) {
      setShowConsentBanner(true);
    }
  }, []);

  const gtag = (...args) => {
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(...args);
    }
  };

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "true");
    // Clear session dismissal if it exists, though not strictly necessary
    sessionStorage.removeItem("cookie_consent_dismissed");

    gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
    });
    setShowConsentBanner(false);
    message.success("Thank you!", 3);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "false");
    sessionStorage.removeItem("cookie_consent_dismissed");

    gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
    });
    setShowConsentBanner(false);
    message.info("You have opted out of analytics cookies.", 3);
  };

  const handleClose = () => {
    // Save to Session Storage: keeps it hidden until the tab is closed
    sessionStorage.setItem("cookie_consent_dismissed", "true");

    setShowConsentBanner(false);
    // Optional: You might want to remove this toast to make it less annoying
    // since they just dismissed it silently.
    message.info(
      "Cookie preferences not saved. You will be asked again next time.",
      3,
    );
  };

  return (
    <>
      {children}
      {isClient && showConsentBanner && (
        <CookieConsentBanner
          onAccept={handleAccept}
          onDecline={handleDecline}
          onClose={handleClose}
        />
      )}
    </>
  );
}
