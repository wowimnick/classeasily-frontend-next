"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import styled, { ThemeProvider } from "styled-components";
import { ConfigProvider, Spin } from "antd";
import message from "@/lib/message";
import { motion } from "framer-motion";
import {
  ShopOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  BookOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useAuth } from "@/lib/auth-client"; // Added useAuth import
import posthog from "posthog-js";
import axiosInstance from "@/lib/axiosInstance";
import dynamic from "next/dynamic";
import { useForm } from "./FormContext";
import { businessService, uploadService } from "@/services/apiService";

// Dynamically import components that might have SSR issues
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
const ExploreHeader = dynamic(
  () => import("@/components/explore/ExploreHeader"),
  { ssr: false }
);
const LandingPageContent = dynamic(() => import("./LandingPage"), {
  ssr: false,
});
const RegistrationSteps = dynamic(() => import("./RegistrationSteps"), {
  ssr: false,
});
const SuccessPage = dynamic(() => import("./SuccessPage"), { ssr: false });
const GlobalLoaderWithoutInlineStyles = dynamic(
  () =>
    import("@/components/common/GlobalLoader").then(
      (mod) => mod.GlobalLoaderWithoutInlineStyles
    ),
  { ssr: false }
);

// --- STYLED COMPONENTS ---

const OverallContainer = styled.div`
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: ${(props) => props.theme.token.colorBgLayout};
  font-family: ${(props) => props.theme.token.fontFamily};
`;

// New wrapper to prevent header squishing
const HeaderWrapper = styled.div`
  flex-shrink: 0;
  width: 100%;
  position: relative;
  z-index: 50;
  background: ${(props) => props.theme.token.colorBgContainer};
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 4px;
  background: ${(props) => props.theme.token.colorBorderSecondary};
  position: relative;
  z-index: 20;
  flex-shrink: 0;
`;

const ProgressIndicator = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: ${(props) => props.theme.token.colorPrimary};
  border-radius: 0 2px 2px 0;
  width: ${(props) => props.width || "0%"};
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px ${(props) => props.theme.token.colorPrimary}40;
`;

const PageLayout = styled.div`
  flex-grow: 1;
  display: flex;
  width: 100%;
  overflow: hidden;
  position: relative;
`;

const ContentColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: ${(props) => props.theme.token.colorBgContainer};
  overflow-y: auto;
  scroll-behavior: smooth;

  /* Custom Scrollbar for better aesthetics */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.token.colorBorder};
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: ${(props) => props.theme.token.colorTextSecondary};
  }
`;

const AnimationColumn = styled.div`
  flex: 0 0 45%;
  border-left: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  height: 100%;
  overflow: hidden;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const MainContentArea = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
`;

const NavigationFooter = styled.footer`
  display: flex;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: ${(props) => props.theme.token.colorBgContainer};
  border-top: 1px solid ${(props) => props.theme.token.colorBorder};
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05); /* Added shadow for depth */
  position: sticky;
  bottom: 0;
  z-index: 10;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;

  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    padding: 1rem;
  }
`;

const FooterButton = styled.button`
  background: ${(props) =>
    props.$primary
      ? props.theme.token.colorPrimary
      : props.theme.token.colorBgContainer};
  color: ${(props) => (props.$primary ? "white" : props.theme.token.colorText)};
  border: 1px solid
    ${(props) =>
      props.$primary
        ? props.theme.token.colorPrimary
        : props.theme.token.colorBorder};
  padding: 0.75rem 1.5rem;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: ${(props) => props.theme.token.fontSize}px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.token.marginXS}px;
  transition: all 0.2s ease;
  min-height: ${(props) => props.theme.token.controlHeight}px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    filter: grayscale(100%);
  }
  &:not(:disabled):hover {
    background: ${(props) =>
      props.$primary
        ? props.theme.token.colorPrimaryHover
        : props.theme.token.colorBgLayout};
    border-color: ${(props) =>
      props.$primary
        ? props.theme.token.colorPrimaryHover
        : props.theme.token.colorText};
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }
  &:active {
    transform: translateY(0);
  }
`;

const AlreadyRegisteredContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1.5rem 1rem;
  height: 100%;
  min-height: 0;

  @media (min-width: 600px) {
    padding: 2rem 1.5rem;
  }
`;

const AlreadyRegisteredCard = styled.div`
  width: 100%;
  max-width: 520px;
  background: ${(props) => props.theme.token.colorBgContainer};
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  overflow: hidden;
  text-align: left;
`;

const AlreadyRegisteredHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, rgba(250, 173, 20, 0.12) 0%, rgba(250, 173, 20, 0.04) 100%);
  border-bottom: 1px solid ${(props) => props.theme.token.colorBorderSecondary};

  @media (max-width: 480px) {
    padding: 1rem 1.25rem;
    gap: 10px;
  }
`;

const AlreadyRegisteredIconWrap = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(250, 173, 20, 0.2);
  color: #d48806;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .anticon {
    font-size: 22px;
  }
`;

const AlreadyRegisteredTitle = styled.h1`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: ${(props) => props.theme.token.colorText};

  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const AlreadyRegisteredBody = styled.div`
  padding: 1.5rem 1.5rem 1.25rem;
  font-size: 15px;
  line-height: 1.6;
  color: ${(props) => props.theme.token.colorTextSecondary};

  @media (max-width: 480px) {
    padding: 1.25rem 1.25rem 1rem;
    font-size: 14px;
  }

  p {
    margin: 0 0 0.75rem;
  }
  p:last-child {
    margin-bottom: 0;
  }
  strong {
    color: ${(props) => props.theme.token.colorText};
    font-weight: 600;
  }
  a {
    color: ${(props) => props.theme.token.colorPrimary};
    font-weight: 500;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
`;

const AlreadyRegisteredActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 1.5rem 1.5rem;

  @media (max-width: 480px) {
    padding: 0 1.25rem 1.25rem;
    flex-direction: column;
  }
`;

const AlreadyRegisteredButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: 15px;
  font-weight: 600;
  background: ${(props) => props.theme.token.colorPrimary};
  color: #fff;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s, transform 0.1s;

  &:hover {
    background: ${(props) => props.theme.token.colorPrimaryHover || props.theme.token.colorPrimary};
    color: #fff;
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }

  @media (max-width: 480px) {
    width: 100%;
    padding: 12px 20px;
  }
`;

export const stepsConfig = [
  {
    icon: <ShopOutlined />,
    title: "Business Info",
    description: "Tell us about your teaching business",
    color: "#FF385C",
    animationData: "https://classeasily.com/public/animations/onebuilding.json",
    loop: false,
    pauseFrame: null,
    hasTwoPartAnimation: true,
  },
  {
    icon: <PhoneOutlined />,
    title: "Contact Details",
    description: "How students can reach you",
    color: "#00C4B4",
    animationData: "https://classeasily.com/public/animations/contact.json",
    loop: true,
    pauseFrame: null,
    hasTwoPartAnimation: false,
  },
  {
    icon: <EnvironmentOutlined />,
    title: "Location",
    description: "Where you'll teach",
    color: "#2D87FF",
    animationData: "https://classeasily.com/public/animations/map2.json",
    loop: true,
    pauseFrame: null,
    hasTwoPartAnimation: false,
  },
  {
    icon: <BookOutlined />,
    title: "Experience Types & Agreements",
    description: "What you'll teach & final steps",
    color: "#FF8C38",
    animationData: "https://classeasily.com/public/animations/buildings.json",
    loop: false,
    pauseFrame: 60,
    hasTwoPartAnimation: true,
  },
];

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const fieldToStepMap = {
  businessName: 0,
  businessType: 0,
  founding_year: 0,
  business_timezone: 0,
  businessImage: 0,
  businessDescription: 0,
  businessHours: 0,
  liabilityWaiver: 0,
  studentContactPhone: 1,
  studentContactEmail: 1,
  preferredContact: 1,
  contact_privacy: 1,
  location: 2,
  coordinates: 2,
  classFormats: 3,
  skillLevels: 3,
  ageGroups: 3,
  termsAccepted: 3,
  privacyAccepted: 3,
};

// Preload animation cache
const animationCache = new Map();

async function preloadAnimation(url) {
  if (animationCache.has(url)) {
    return animationCache.get(url);
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    animationCache.set(url, data);
    return data;
  } catch (error) {
    console.error("Failed to load animation:", url, error);
    return null;
  }
}

const useLottieAnimation = (stepConfig, currentStep, isMobile) => {
  const lottieRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [playbackState, setPlaybackState] = useState("idle");
  const [pendingAction, setPendingAction] = useState(null);
  const [animationData, setAnimationData] = useState(null);
  const animationStateRef = useRef({
    totalFrames: null,
    pauseFrame: null,
    currentPhase: "idle",
  });
  const isMountedRef = useRef(true);
  const readyCheckTimeoutRef = useRef(null);

  // Preload animation data - SKIP IF MOBILE
  useEffect(() => {
    if (isMobile) return; // Performance optimization: Don't fetch Lotties on mobile

    if (stepConfig?.animationData) {
      preloadAnimation(stepConfig.animationData)
        .then((data) => {
          if (isMountedRef.current) {
            setAnimationData(data);
          }
        })
        .catch(console.error);
    }
  }, [stepConfig?.animationData, isMobile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (readyCheckTimeoutRef.current) {
        clearTimeout(readyCheckTimeoutRef.current);
      }
      if (lottieRef.current?.animationItem) {
        lottieRef.current.animationItem.destroy();
        lottieRef.current = null;
      }
    };
  }, []);

  // Reset state when step changes
  useEffect(() => {
    if (isMobile) return; // Skip logic on mobile

    if (lottieRef.current?.animationItem) {
      lottieRef.current.animationItem.destroy();
      lottieRef.current = null;
    }

    if (readyCheckTimeoutRef.current) {
      clearTimeout(readyCheckTimeoutRef.current);
      readyCheckTimeoutRef.current = null;
    }

    setIsReady(false);
    setPlaybackState("idle");
    setPendingAction(null);
    setAnimationData(null);
    animationStateRef.current = {
      totalFrames: null,
      pauseFrame: null,
      currentPhase: "idle",
    };
  }, [currentStep, isMobile]);

  const handleDOMLoaded = useCallback(() => {
    if (isMobile) return;

    let attempts = 0;
    const maxAttempts = 40;

    const checkAnimationReady = () => {
      if (!isMountedRef.current) return;

      if (lottieRef.current?.animationItem) {
        const animItem = lottieRef.current.animationItem;
        animationStateRef.current.totalFrames = animItem.totalFrames;

        if (!stepConfig?.loop && stepConfig?.hasTwoPartAnimation) {
          const pauseFrame =
            stepConfig.pauseFrame ?? Math.floor(animItem.totalFrames / 2);
          animationStateRef.current.pauseFrame = Math.min(
            pauseFrame,
            animItem.totalFrames - 1
          );
        }
        setIsReady(true);
      } else if (attempts < maxAttempts) {
        attempts++;
        readyCheckTimeoutRef.current = setTimeout(checkAnimationReady, 50);
      } else {
        console.error("Lottie animation failed to initialize after 2 seconds");
        setIsReady(false);
      }
    };

    checkAnimationReady();
  }, [stepConfig, isMobile]);

  const handleComplete = useCallback(() => {
    if (!isMountedRef.current || isMobile) return;

    const state = animationStateRef.current;
    if (state.currentPhase === "first-half") {
      animationStateRef.current.currentPhase = "paused";
      setPlaybackState("paused");
    } else if (
      state.currentPhase === "second-half" ||
      state.currentPhase === "single-play"
    ) {
      animationStateRef.current.currentPhase = "complete";
      setPlaybackState("complete");
      if (pendingAction) {
        const action = pendingAction;
        setPendingAction(null);
        requestAnimationFrame(() => {
          if (isMountedRef.current) {
            action();
          }
        });
      }
    }
  }, [pendingAction, isMobile]);

  useEffect(() => {
    if (
      isMobile ||
      !isReady ||
      !lottieRef.current?.animationItem ||
      !stepConfig ||
      animationStateRef.current.currentPhase !== "idle"
    )
      return;

    const animCtrl = lottieRef.current;
    animCtrl.stop();
    animCtrl.goToAndStop(0, true);

    const startTimeout = setTimeout(() => {
      if (!isMountedRef.current) return;

      if (stepConfig.loop) {
        animationStateRef.current.currentPhase = "looping";
        animCtrl.play();
        setPlaybackState("looping");
      } else if (
        stepConfig.hasTwoPartAnimation &&
        animationStateRef.current.pauseFrame !== null
      ) {
        animationStateRef.current.currentPhase = "first-half";
        animCtrl.playSegments([0, animationStateRef.current.pauseFrame], true);
        setPlaybackState("first-half");
      } else {
        animationStateRef.current.currentPhase = "single-play";
        animCtrl.play();
        setPlaybackState("playing");
      }
    }, 100);

    return () => clearTimeout(startTimeout);
  }, [isReady, stepConfig, currentStep, isMobile]);

  const continueAnimation = useCallback(
    (onCompleteCallback) => {
      // Immediately callback if mobile to avoid hanging
      if (isMobile) {
        if (onCompleteCallback) onCompleteCallback();
        return;
      }

      const state = animationStateRef.current;
      if (
        !lottieRef.current?.animationItem ||
        state.currentPhase !== "paused" ||
        state.pauseFrame === null
      ) {
        if (onCompleteCallback) onCompleteCallback();
        return;
      }

      setPendingAction(() => onCompleteCallback);
      const animCtrl = lottieRef.current;
      animationStateRef.current.currentPhase = "second-half";
      animCtrl.playSegments([state.pauseFrame, state.totalFrames - 1], false);
      setPlaybackState("second-half");
    },
    [isMobile]
  );

  return {
    lottieRef,
    isReady,
    playbackState,
    canContinue: animationStateRef.current.currentPhase === "paused",
    continueAnimation,
    handleComplete,
    handleDOMLoaded,
    animationData,
  };
};

const getStepId = (stepIndex) => {
  return (
    ["businessInfo", "contactDetails", "location", "classTypes"][stepIndex] ||
    ""
  );
};

const RegisterPageContent = () => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [direction, setDirection] = useState(1);
  const [isMobile, setIsMobile] = useState(true); // Default to true to be safe
  const [pageStatus, setPageStatus] = useState("loading");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasCheckedBusinessRef = useRef(false);

  const { user: currentUser, isLoading: loading } = useAuthUser();
  // Destructure setShouldOpenAuthModal from useAuth
  const { setShouldOpenAuthModal } = useAuth();
  const isAuthenticated = !!currentUser;

  const { formData, updateStepData, resetForm } = useForm();

  const currentStepConfig = currentStep >= 0 ? stepsConfig[currentStep] : null;

  // Set initial mobile state
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth <= 1024);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !hasCheckedBusinessRef.current) {
      setPageStatus("checking");
    } else if (!isAuthenticated) {
      setPageStatus("ready");
    }
  }, [isAuthenticated]);

  // Check for existing business
  useEffect(() => {
    if (pageStatus !== "checking" || hasCheckedBusinessRef.current) {
      return;
    }
    hasCheckedBusinessRef.current = true;
    let isMounted = true;
    businessService
      .getMyBusinesses()
      .then((response) => {
        if (isMounted) {
          if (response.success && response.data && response.data.length > 0) {
            setPageStatus("already_registered");
          } else {
            setPageStatus("ready");
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to check for existing business", err);
          setPageStatus("ready");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [pageStatus, currentUser?.email]);

  useEffect(() => {
    const debouncedResize = debounce(() => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth <= 1024);
      }
    }, 250);
    window.addEventListener("resize", debouncedResize);
    return () => window.removeEventListener("resize", debouncedResize);
  }, []);

  useEffect(() => {
    if (pageStatus !== "ready" || currentStep !== -1) return;
    import("@/lib/metaPixel").then(({ trackPixelEvent }) => {
      trackPixelEvent("ViewContent", {
        content_name: "Business registration",
        content_category: "signup",
        content_ids: ["business_registration"],
        content_type: "registration",
        currency: "CAD",
      });
    });
  }, [pageStatus, currentStep]);

  const {
    lottieRef,
    playbackState,
    canContinue,
    continueAnimation,
    handleComplete,
    handleDOMLoaded,
    animationData,
  } = useLottieAnimation(currentStepConfig, currentStep, isMobile);

  useEffect(() => {
    const contentColumn = document.querySelector(
      '[data-content-column="true"]'
    );
    if (contentColumn) {
      contentColumn.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep]);

  const formatFieldName = (field) =>
    field
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

  const handleApiError = (resultAction) => {
    const errorPayload = resultAction.payload;
    if (errorPayload?.status === 409) {
      setPageStatus("already_registered");
      return;
    }

    let errorMessages = [];
    let lowestStep = Infinity;

    try {
      const errorSource =
        errorPayload?.error || errorPayload?.data || errorPayload;
      if (typeof errorSource === "object" && errorSource !== null) {
        Object.entries(errorSource).forEach(([field, messages]) => {
          const step = fieldToStepMap[field];
          if (step !== undefined && step < lowestStep) {
            lowestStep = step;
          }
          const friendlyField = formatFieldName(field);
          const messageText = Array.isArray(messages)
            ? messages.join(" ")
            : String(messages);
          errorMessages.push(`<b>${friendlyField}:</b> ${messageText}`);
        });
      } else if (typeof errorSource === "string") {
        errorMessages.push(errorSource);
      }
    } catch (e) {}

    if (errorMessages.length === 0) {
      errorMessages.push(
        "An unexpected error occurred. Please check your connection and try again."
      );
    }

    if (lowestStep !== Infinity) {
      setCurrentStep(lowestStep);
    }

    message.error({
      content: (
        <div>
          <p>Submission failed. Please correct the following:</p>
          <div
            style={{ marginTop: "8px", textAlign: "left" }}
            dangerouslySetInnerHTML={{ __html: errorMessages.join("<br/>") }}
          />
        </div>
      ),
      duration: 4,
    });
  };

  const handleFinalApiSubmit = async (finalFormData) => {
    const dataToSubmit = new FormData();
    const { businessInfo = {} } = finalFormData;
    let imageS3Key = null;

    if (businessInfo.businessImage instanceof File) {
      try {
        const uploadResult = await uploadService.uploadFile(
          businessInfo.businessImage,
          "business_image"
        );
        if (uploadResult.success) {
          imageS3Key = uploadResult.s3_key;
        } else {
          message.error(
            uploadResult.error || "Image upload failed. Please try again.",
            5
          );
          throw new Error("Image upload failed.");
        }
      } catch (uploadError) {
        // Handle session expiration during upload
        if (uploadError.response?.status === 401) {
          setIsSubmitting(false);
          setShouldOpenAuthModal(true);
          message.warning(
            "Your session has expired. Please log in to submit your registration.",
            5
          );
          return;
        }
        throw uploadError;
      }
    }

    const safeAppend = (key, value) => {
      if (value !== undefined && value !== null && value !== "")
        dataToSubmit.append(key, value);
    };

    safeAppend("businessName", businessInfo.businessName);
    safeAppend("businessType", businessInfo.businessType);
    safeAppend("businessDescription", businessInfo.businessDescription);
    safeAppend("business_timezone", businessInfo.business_timezone);
    safeAppend("founding_year", businessInfo.founding_year);
    safeAppend("website", businessInfo.website);
    safeAppend("liabilityWaiver", businessInfo.liabilityWaiver);
    if (imageS3Key) safeAppend("businessImage_s3_key", imageS3Key);

    const socialLinks = {
      facebook: businessInfo.facebook_url,
      instagram: businessInfo.instagram_url,
      twitter: businessInfo.twitter_url,
      linkedin: businessInfo.linkedin_url,
    };
    const validSocialLinks = Object.fromEntries(
      Object.entries(socialLinks).filter(([_, v]) => v)
    );
    if (Object.keys(validSocialLinks).length > 0)
      safeAppend("social_media_links", JSON.stringify(validSocialLinks));

    if (
      Array.isArray(businessInfo.tags_keywords) &&
      businessInfo.tags_keywords.length > 0
    )
      safeAppend("tags_keywords", JSON.stringify(businessInfo.tags_keywords));

    if (
      Array.isArray(businessInfo.businessHours) &&
      businessInfo.businessHours.length > 0
    ) {
      const formattedHours = businessInfo.businessHours.map((dayHours) => ({
        day: dayHours.day,
        isOpen: dayHours.isOpen,
        open: dayHours.isOpen && dayHours.open ? dayHours.open : null,
        close: dayHours.isOpen && dayHours.close ? dayHours.close : null,
      }));
      safeAppend("businessHours", JSON.stringify(formattedHours));
    }

    const { contactDetails = {} } = finalFormData;
    safeAppend("studentContactPhone", contactDetails.studentContactPhone);
    safeAppend("studentContactEmail", contactDetails.studentContactEmail);
    safeAppend("contact_privacy", contactDetails.contact_privacy);
    safeAppend("preferredContact", contactDetails.preferredContact);

    const { location = {} } = finalFormData;
    safeAppend("businessAddress", location.location);
    safeAppend("businessUnit", location.businessUnit);
    safeAppend("businessCity", location.city);
    safeAppend("businessState", location.state);
    safeAppend("businessZipCode", location.zipCode);
    if (location.coordinates) {
      const [lat, lon] = String(location.coordinates)
        .split(",")
        .map(parseFloat);
      if (!isNaN(lat) && !isNaN(lon)) {
        safeAppend("latitude", lat.toFixed(8));
        safeAppend("longitude", lon.toFixed(8));
      }
    }

    const { classTypes = {} } = finalFormData;
    const listFields = ["classFormats", "skillLevels", "ageGroups"];
    listFields.forEach((field) => {
      const value = classTypes[field];
      if (Array.isArray(value) && value.length > 0)
        safeAppend(field, JSON.stringify(value));
    });
    safeAppend("termsAccepted", classTypes.termsAccepted);
    safeAppend("privacyAccepted", classTypes.privacyAccepted);

    try {
      const response = await axiosInstance.post(
        "/business/register/",
        dataToSubmit
      );

      if (response.data) {
        // PostHog: Track successful business registration submission
        posthog.capture("business_registration_submitted", {
          business_name: dataToSubmit.business_name,
        });

        import("@/lib/metaPixel").then(({ trackPixelEvent }) => {
          trackPixelEvent("CompleteRegistration", {
            content_name: "Business registration",
            content_category: "signup",
            content_ids: ["business_registration"],
            content_type: "registration",
            status: true,
            currency: "CAD",
          });
        });

        setPageStatus("success");
        resetForm();
        message.success("Business registration submitted successfully!");
      }
    } catch (error) {
      posthog.captureException(error);
      // Check for 401 Session Expired that failed auto-refresh
      if (error.response?.status === 401) {
        setIsSubmitting(false);
        setShouldOpenAuthModal(true);
        message.warning(
          "Your session has expired. Please log in to submit your registration.",
          5
        );
        // EARLY RETURN to prevent standard error handling
        return;
      }

      const errorPayload = error.response?.data;
      if (errorPayload?.status === 409) {
        setPageStatus("already_registered");
        return;
      }

      handleApiError({ payload: errorPayload });
      throw new Error("Registration failed.");
    }
  };

  const isLastStep = currentStep === stepsConfig.length - 1;

  const executeStepSubmit = useCallback(
    async (stepData) => {
      const stepId = getStepId(currentStep);
      updateStepData(stepId, stepData);

      // TRACKING: Step Completed
      const stepTitle = stepsConfig[currentStep].title;

      // PostHog: Track step completion
      posthog.capture("business_registration_step_completed", {
        step_number: currentStep + 1,
        step_title: stepTitle,
        step_id: stepId,
      });

      if (isLastStep) {
        setIsSubmitting(true);
        try {
          const finalData = {
            ...formData,
            [stepId]: { ...(formData[stepId] || {}), ...stepData },
          };
          await handleFinalApiSubmit(finalData);
        } catch (error) {
          console.error("Submission flow failed:", error.message);
        } finally {
          // Don't set false here if we triggered modal, relying on logic inside handleFinalApiSubmit
          if (!error?.response || error.response.status !== 401) {
            setIsSubmitting(false);
          }
        }
      } else {
        setDirection(1);
        setCurrentStep((prev) => prev + 1);
      }
    },
    [currentStep, formData, updateStepData, isLastStep]
  );

  const handleStepSubmit = useCallback(
    (stepData) => {
      const shouldWaitForAnimation =
        !isMobile &&
        currentStepConfig &&
        !currentStepConfig.loop &&
        currentStepConfig.hasTwoPartAnimation &&
        canContinue;

      if (shouldWaitForAnimation) {
        continueAnimation(() => executeStepSubmit(stepData));
      } else {
        executeStepSubmit(stepData);
      }
    },
    [
      currentStepConfig,
      canContinue,
      continueAnimation,
      executeStepSubmit,
      isMobile,
    ]
  );

  const handleStepSubmitFailed = useCallback(
    (errorInfo, stepIndex) => {
      if (currentStep !== stepIndex) {
        setCurrentStep(stepIndex);
      }

      const errorMessages = errorInfo.errorFields
        .map(
          (field) =>
            `<b>${formatFieldName(field.name[0])}:</b> ${field.errors.join(
              ", "
            )}`
        )
        .join("<br/>");

      message.error({
        content: (
          <div>
            <p>Please correct the following errors:</p>
            <div
              style={{ marginTop: "8px", textAlign: "left" }}
              dangerouslySetInnerHTML={{ __html: errorMessages }}
            />
          </div>
        ),
        duration: 10,
      });
    },
    [currentStep]
  );

  const handleBack = useCallback(() => {
    if (isSubmitting || loading || playbackState === "second-half") return;
    setDirection(-1);
    setCurrentStep((prev) => prev - 1);
  }, [isSubmitting, loading, playbackState]);

  const progressPercent =
    currentStep >= 0 ? ((currentStep + 1) / stepsConfig.length) * 100 : 0;
  const initialDataForStep = formData[getStepId(currentStep)] || {};

  let nextButtonContent = isLastStep ? "Submit Registration" : "Next Step";
  if (isSubmitting) {
    nextButtonContent = "Submitting...";
  }

  // TRACKING: Start Form
  const startForm = () => {
    posthog.capture("business_registration_started");
    import("@/lib/metaPixel").then(({ trackPixelEvent }) => {
      trackPixelEvent("AddToCart", {
        content_name: "Business registration",
        content_category: "signup",
        content_ids: ["business_registration"],
        content_type: "registration",
        value: 0,
        currency: "CAD",
      });
    });
    setDirection(1);
    setCurrentStep(0);
  };

  if (pageStatus === "loading" || pageStatus === "checking") {
    return (
      <OverallContainer>
        <HeaderWrapper>
          <ExploreHeader showOptionsWrapper={false} />
        </HeaderWrapper>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GlobalLoaderWithoutInlineStyles />
        </div>
      </OverallContainer>
    );
  }

  if (pageStatus === "success") {
    return <SuccessPage />;
  }

  if (pageStatus === "already_registered") {
    return (
      <OverallContainer>
        <HeaderWrapper>
          <ExploreHeader showOptionsWrapper={false} />
        </HeaderWrapper>
        <PageLayout>
          <ContentColumn>
            <AlreadyRegisteredContainer
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AlreadyRegisteredCard>
                <AlreadyRegisteredHeader>
                  <AlreadyRegisteredIconWrap>
                    <WarningOutlined />
                  </AlreadyRegisteredIconWrap>
                  <AlreadyRegisteredTitle>
                    You Already Have a Business Registered
                  </AlreadyRegisteredTitle>
                </AlreadyRegisteredHeader>
                <AlreadyRegisteredBody>
                  <p>
                    Our records show that the account associated with{" "}
                    <strong>{currentUser?.email}</strong> already owns a business.
                    Each account is limited to one business profile.
                  </p>
                  <p>
                    If you need to make changes to your existing business, use
                    the button below to open your dashboard. To register a
                    completely new business, you’ll need to use a different
                    account.
                  </p>
                  <p>
                    If you believe this is an error or need to delete your
                    current business to start over (this action is irreversible
                    and will delete all associated data), please{" "}
                    <a href="/contact-support">contact our support team</a> for
                    assistance.
                  </p>
                </AlreadyRegisteredBody>
                <AlreadyRegisteredActions>
                  <AlreadyRegisteredButton href="/business/dashboard">
                    <ArrowRightOutlined />
                    Go to Dashboard
                  </AlreadyRegisteredButton>
                </AlreadyRegisteredActions>
              </AlreadyRegisteredCard>
            </AlreadyRegisteredContainer>
          </ContentColumn>
        </PageLayout>
      </OverallContainer>
    );
  }

  return (
    <OverallContainer>
      <HeaderWrapper>
        <ExploreHeader showOptionsWrapper={false} />
      </HeaderWrapper>
      {currentStep >= 0 && (
        <ProgressBarContainer>
          <ProgressIndicator width={`${progressPercent}%`} />
        </ProgressBarContainer>
      )}
      <PageLayout>
        <ContentColumn data-content-column="true">
          <MainContentArea>
            {currentStep === -1 ? (
              <LandingPageContent
                steps={stepsConfig}
                startForm={startForm}
                isMobile={isMobile}
              />
            ) : (
              <RegistrationSteps
                currentStep={currentStep}
                initialDataForStep={initialDataForStep}
                onFormSubmit={handleStepSubmit}
                onFormSubmitFailed={handleStepSubmitFailed}
              />
            )}
          </MainContentArea>
          {currentStep >= 0 && (
            <NavigationFooter>
              <FooterButton
                onClick={handleBack}
                disabled={
                  isSubmitting ||
                  loading ||
                  playbackState === "second-half" ||
                  currentStep === -1
                }
              >
                <ArrowLeftOutlined />
                {currentStep === 0 ? "Back to Start" : "Previous"}
              </FooterButton>
              <FooterButton
                $primary
                type="submit"
                form={`step-${currentStep}-form`}
                disabled={
                  isSubmitting || loading || playbackState === "second-half"
                }
              >
                {nextButtonContent}
                {isLastStep ? null : <ArrowRightOutlined />}
              </FooterButton>
            </NavigationFooter>
          )}
        </ContentColumn>
        {!isMobile &&
          currentStep !== -1 &&
          currentStepConfig?.animationData && (
            <AnimationColumn>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                }}
              >
                {animationData ? (
                  <Lottie
                    lottieRef={lottieRef}
                    animationData={animationData}
                    loop={currentStepConfig.loop}
                    autoplay={false}
                    onComplete={handleComplete}
                    onDOMLoaded={handleDOMLoaded}
                    style={{
                      maxWidth: "80%",
                      maxHeight: "80%",
                      width: "auto",
                      height: "auto",
                    }}
                    renderer="svg"
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyItems: "center",
                      textAlign: "center",
                      color: "#999",
                      padding: "2rem",
                    }}
                  >
                    <GlobalLoaderWithoutInlineStyles />
                    <p style={{ marginTop: "1rem" }}>Loading animation...</p>
                  </div>
                )}
              </div>
            </AnimationColumn>
          )}
      </PageLayout>
    </OverallContainer>
  );
};

export default RegisterPageContent;
