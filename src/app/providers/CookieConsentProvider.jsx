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
    localStorage.setItem("cookie_consent", "true");
    const consent = localStorage.getItem("cookie_consent");
    // Check temporary dismissal (Session Storage)
    const dismissed = sessionStorage.getItem("cookie_consent_dismissed");

    // Only queue the banner if no choice made and not dismissed
    if (consent === null && !dismissed) {
      const timer = setTimeout(() => {
        setShowConsentBanner(true);
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "true");
    sessionStorage.removeItem("cookie_consent_dismissed");
    setShowConsentBanner(false);
    message.success("Preferences saved", 2);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "false");
    sessionStorage.removeItem("cookie_consent_dismissed");
    setShowConsentBanner(false);
    message.info("Analytics opted out", 2);
  };

  const handleClose = () => {
    sessionStorage.setItem("cookie_consent_dismissed", "true");
    setShowConsentBanner(false);
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
