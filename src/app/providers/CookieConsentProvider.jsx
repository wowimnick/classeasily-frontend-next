// src/app/providers/CookieConsentProvider.jsx

"use client";

import { useState, useEffect } from "react";
import { message } from "antd";
import CookieConsentBanner from "@/components/auth/CookieConsentBanner";

export default function CookieConsentProvider({ children }) {
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // This effect runs only once on the client after mounting, making it safe
  useEffect(() => {
    setIsClient(true);
    const consent = localStorage.getItem("cookie_consent");
    if (consent === null) {
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
    gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
    });
    setShowConsentBanner(false);
    message.success("Thank you!", 3);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "false");
    gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
    });
    setShowConsentBanner(false);
    message.info("You have opted out of analytics cookies.", 3);
  };

  const handleClose = () => {
    setShowConsentBanner(false);
    message.info(
      "Cookie preferences not saved. You will be asked again later.",
      3
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
