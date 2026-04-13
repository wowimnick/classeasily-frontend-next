"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import dynamic from "next/dynamic";
import { Drawer } from "vaul";
import { paymentService } from "@/services/apiService";
import { useAuthUser } from "@/hooks/useAuthUser";
import message from "@/lib/message";
import posthog from "posthog-js";
import dayjs from "dayjs";

const CHECKOUT_STORAGE_KEY = "classeasily_checkout";

// Dynamic imports
const OptionSelectionStep = dynamic(
  () => import("./steps/OptionSelectionStep"),
  { ssr: false },
);

const CourseCalendarStep = dynamic(() => import("./steps/CourseCalendarStep"), {
  ssr: false,
});

const CalendarStep = dynamic(() => import("./steps/CalendarStep"), {
  ssr: false,
});

const ModalHeader = dynamic(
  () =>
    import("./steps/ModalHeader").then((mod) => ({ default: mod.ModalHeader })),
  { ssr: false },
);

const ModalFooter = dynamic(
  () =>
    import("./steps/ModalHeader").then((mod) => ({ default: mod.ModalFooter })),
  { ssr: false },
);

// --- ANIMATION HOOKS ---
const useElementSize = () => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
};

const AnimatedModalContent = ({ children }) => {
  const [ref, { height }] = useElementSize();

  return (
    <motion.div
      animate={{ height: height || "auto" }}
      style={{ overflow: "hidden" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div ref={ref}>
        <div style={{ border: "1px solid transparent", margin: "-1px" }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

// Desktop Modal Styles
const DesktopOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(8px);
  z-index: 1050;
`;

const DesktopModal = styled(motion.div)`
  width: 100%;
  max-width: 1000px;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const CloseButton = styled(motion.button)`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: #484848;
  backdrop-filter: blur(10px);
`;

const ScrollableContent = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
`;

const StepContentWrapper = styled.div`
  padding: 20px;
`;

// Vaul Drawer Styles
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  max-height: 90vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;

const DrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DrawerHeader = styled.div`
  flex-shrink: 0;
`;

const DrawerBody = styled.div`
  overflow-y: auto;
  padding: 4px;
  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
  min-height: 0;
`;

const DrawerFooter = styled.div`
  flex-shrink: 0;
  background: white;
`;

const overlayVariants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: {
    opacity: 1,
    backdropFilter: "blur(8px)",
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const BookingModal = ({
  isOpen,
  onClose,
  classData,
  optionId: initialOptionId,
  initialParticipantCount = 1,
}) => {
  const router = useRouter();
  const { user: currentUserFromRedux } = useAuthUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(isOpen);

  // --- MULTI-TIER LOGIC ---
  const hasMultipleOptions = classData?.options?.length > 1;
  const [currentStep, setCurrentStep] = useState(1);

  // CHANGED: Initialize as null to ensure nothing is selected by default
  const [selectedOptionId, setSelectedOptionId] = useState(null);

  // --- STEP DEFINITIONS (Option + Calendar only; payment/confirmation happen on checkout page) ---
  const OPTION_STEP = hasMultipleOptions ? 1 : -1;
  const CALENDAR_STEP = hasMultipleOptions ? 2 : 1;

  const shouldShowFooter = currentStep !== OPTION_STEP;

  useEffect(() => {
    if (isOpen && hasMultipleOptions) import("./steps/OptionSelectionStep");
  }, [isOpen, hasMultipleOptions]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // PostHog: Track booking funnel entry
      posthog.capture("booking_started", {
        class_id: classData?.classId || classData?.id,
        class_title: classData?.title,
        business_name: classData?.business_name,
        has_multiple_options: hasMultipleOptions,
      });
    }
  }, [isOpen, classData, hasMultipleOptions]);

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isVisible]);

  const effectiveInitialParticipants = useMemo(() => {
    if (typeof window !== "undefined" && isOpen) {
      const params = new URLSearchParams(window.location.search);
      const participantsFromUrl = params.get("participants");
      if (participantsFromUrl) {
        const num = parseInt(participantsFromUrl, 10);
        if (!isNaN(num) && num > 0) {
          return num;
        }
      }
    }
    return initialParticipantCount;
  }, [isOpen, initialParticipantCount]);

  useEffect(() => {
    const mq = () => window.innerWidth < 1024;
    setIsMobile(mq());
    const handleResize = () => setIsMobile(mq());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const selectedOption = useMemo(() => {
    const idToFind = selectedOptionId || initialOptionId;
    return (
      classData?.options?.find((opt) => opt.optionId === idToFind) ||
      classData?.options?.[0]
    );
  }, [classData, selectedOptionId, initialOptionId]);

  const initialDate = useMemo(() => {
    if (!selectedOption || !Array.isArray(selectedOption.schedules)) {
      return null;
    }
    const upcomingSchedules = selectedOption.schedules
      .filter(
        (s) => s.date && dayjs(s.date).isAfter(dayjs().subtract(1, "day")),
      )
      .sort((a, b) => {
        const dateTimeA = dayjs(`${a.date}T${a.time}`);
        const dateTimeB = dayjs(`${b.date}T${b.time}`);
        return dateTimeA.valueOf() - dateTimeB.valueOf();
      });

    return upcomingSchedules.length > 0 ? upcomingSchedules[0].date : null;
  }, [selectedOption]);

  const isCourseBooking = selectedOption?.booking_type === "Full Course";

  const getInitialBookingState = useCallback(() => {
    try {
      const validInitialParticipantCount =
        Number.isInteger(effectiveInitialParticipants) &&
        effectiveInitialParticipants > 0
          ? effectiveInitialParticipants
          : 1;
      let bookerName = "";
      let bookerEmail = "";
      let bookerPhone = "";

      if (currentUserFromRedux) {
        bookerName = `${currentUserFromRedux.first_name || ""} ${
          currentUserFromRedux.last_name || ""
        }`.trim();
        bookerEmail = currentUserFromRedux.email || "";
        bookerPhone = currentUserFromRedux.phone_number || "";
      }

      const participantDetails = Array.from(
        { length: validInitialParticipantCount },
        () => ({ name: bookerName || "" }),
      );

      let initialPrice = 0;
      if (selectedOption) {
        const firstActiveSchedule = selectedOption.schedules?.find(
          (s) => s.is_active === true,
        );
        initialPrice = parseFloat(
          firstActiveSchedule?.price || selectedOption.price || 0,
        );
        if (isNaN(initialPrice)) initialPrice = 0;
      }

      return {
        selectedSlots: [],
        participants: validInitialParticipantCount,
        participant_details: participantDetails,
        notes: "",
        price: initialPrice,
        paymentIntentId: null,
        clientSecret: null,
        bookingId: null,
        user_facing_reference: null,
        booking_group_id: null,
        selectedOption: selectedOption,
        userName: bookerName,
        userEmail: bookerEmail,
        userPhone: bookerPhone,
      };
    } catch (error) {
      console.error("[BookingModal] Error in getInitialBookingState", error);
      throw error;
    }
  }, [effectiveInitialParticipants, selectedOption, currentUserFromRedux]);

  const [bookingData, setBookingData] = useState(() =>
    getInitialBookingState(),
  );

  const cancelPendingIntent = useCallback(async (intentId) => {
    if (!intentId) return;
    try {
      await paymentService.cancelPaymentIntent(intentId);
    } catch (error) {
      console.error("[BookingModal] Failed to release spot:", error);
    }
  }, []);

  // Update selectedOptionId if initialOptionId changes (and is valid)
  useEffect(() => {
    if (
      initialOptionId &&
      initialOptionId !== selectedOptionId &&
      !hasMultipleOptions
    ) {
      setSelectedOptionId(initialOptionId);
    }
  }, [initialOptionId, hasMultipleOptions]);

  // --- FACEBOOK PIXEL - AddToCart (only on prod or staging with test code) ---
  useEffect(() => {
    if (isOpen && selectedOption && classData) {
      import("@/lib/metaPixel").then(({ trackPixelEvent }) => {
        trackPixelEvent("AddToCart", {
          content_name: classData.title,
          content_ids: [classData.classId || classData.id],
          content_type: "product",
          value: parseFloat(selectedOption.price || 0),
          currency: classData.currency_code || "CAD",
        });
      });
    }
  }, [isOpen, selectedOption, classData]);

  useEffect(() => {
    if (isOpen) {
      const newInitialState = getInitialBookingState();
      setBookingData((prev) => {
        if (
          prev.bookingId ||
          prev.user_facing_reference ||
          prev.paymentIntentId
        ) {
          return prev;
        }

        const userJustLoggedIn = !prev.userEmail && !!newInitialState.userEmail;
        const optionChanged =
          selectedOption?.optionId !== prev.selectedOption?.optionId;

        const participantsPropChanged =
          prev.participants !== newInitialState.participants &&
          prev.selectedSlots.length === 0;

        if (userJustLoggedIn || optionChanged || participantsPropChanged) {
          return {
            ...newInitialState,
            selectedSlots:
              optionChanged || participantsPropChanged
                ? []
                : prev.selectedSlots,
            paymentIntentId: prev.paymentIntentId,
            clientSecret: prev.clientSecret,
            bookingId: prev.bookingId,
            user_facing_reference: prev.user_facing_reference,
            booking_group_id: prev.booking_group_id,
            notes: prev.notes || "",
            selectedOption: selectedOption,
          };
        }
        return prev;
      });
    }
  }, [isOpen, selectedOption, getInitialBookingState]);

  const resetModal = useCallback(() => {
    if (bookingData.paymentIntentId && !bookingData.bookingId) {
      cancelPendingIntent(bookingData.paymentIntentId);
    }

    setCurrentStep(1);

    // Ensure we reset selection to null
    if (hasMultipleOptions) {
      setSelectedOptionId(null);
    }

    setBookingData(getInitialBookingState());
    setIsLoading(false);
  }, [
    getInitialBookingState,
    bookingData.paymentIntentId,
    bookingData.bookingId,
    cancelPendingIntent,
    hasMultipleOptions,
    initialOptionId,
  ]);

  const handleClose = useCallback(() => {
    if (bookingData.paymentIntentId && !bookingData.bookingId) {
      cancelPendingIntent(bookingData.paymentIntentId);
    }
    setIsVisible(false);
  }, [bookingData.paymentIntentId, bookingData.bookingId, cancelPendingIntent]);

  const handleAnimationComplete = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  const handleUpdateBooking = useCallback(
    (data) => {
      setBookingData((prev) => {
        if (prev.bookingId || prev.user_facing_reference) {
          return prev;
        }

        const newState = { ...prev, ...data };

        if (
          data.selectedSlots &&
          data.selectedSlots.length > 0 &&
          data.selectedSlots[0]?.price !== undefined
        ) {
          const newSlotPrice = parseFloat(data.selectedSlots[0].price);
          newState.price = isNaN(newSlotPrice) ? prev.price || 0 : newSlotPrice;
        } else if (data.selectedSlots && data.selectedSlots.length === 0) {
          const firstActiveSchedule = newState.selectedOption?.schedules?.find(
            (s) => s.is_active === true,
          );
          let resetPrice = parseFloat(
            firstActiveSchedule?.price || newState.selectedOption?.price || 0,
          );
          newState.price = isNaN(resetPrice) ? 0 : resetPrice;
        }

        if (
          data.participants !== undefined &&
          data.participants !== prev.participants
        ) {
          const newCount = data.participants;
          if (
            data.participant_details &&
            Array.isArray(data.participant_details) &&
            data.participant_details.length === newCount
          ) {
            newState.participant_details = data.participant_details;
          } else {
            const bookerNameForPrefill =
              prev.participant_details?.[0]?.name ||
              prev.userName ||
              (currentUserFromRedux
                ? `${currentUserFromRedux.first_name || ""} ${currentUserFromRedux.last_name || ""}`.trim()
                : "");
            newState.participant_details = Array.from(
              { length: newCount },
              () => ({ name: bookerNameForPrefill || "" }),
            );
          }
        } else if (
          data.participant_details &&
          data.participant_details !== prev.participant_details
        ) {
          newState.participant_details = data.participant_details;
        }

        return newState;
      });
    },
    [currentUserFromRedux],
  );

  const validateStep = useCallback(
    (step, dataToValidate) => {
      // Step 1: Option Selection
      if (step === OPTION_STEP) {
        return !!selectedOptionId;
      }

      // Step 2: Calendar
      if (step === CALENDAR_STEP) {
        if (isCourseBooking) {
          const courseSlot = dataToValidate.selectedSlots?.[0];
          return !!(courseSlot && courseSlot.id);
        } else {
          const slot = dataToValidate.selectedSlots?.[0];
          return !!(slot && slot.id && slot.date && slot.time);
        }
      }
      return true;
    },
    [isCourseBooking, OPTION_STEP, CALENDAR_STEP, selectedOptionId],
  );

  const handleNext = useCallback(async () => {
    // From Calendar step, redirect to dedicated checkout page (payment/confirmation happen there)
    if (currentStep === CALENDAR_STEP && classData?.slug) {
      const nextBookingState = {
        ...bookingData,
        selectedOption,
        selectedSlots: bookingData.selectedSlots,
        participants: bookingData.participants,
        participant_details: bookingData.participant_details,
        userName: bookingData.userName,
        userEmail: bookingData.userEmail,
        userPhone: bookingData.userPhone,
        price: bookingData.price,
        notes: bookingData.notes,
      };
      try {
        sessionStorage.setItem(
          CHECKOUT_STORAGE_KEY,
          JSON.stringify({
            classSlug: classData.slug,
            classData,
            bookingData: nextBookingState,
          })
        );
        onClose();
        router.push(`/classes/${classData.slug}/checkout`);
      } catch (e) {
        console.error("Checkout redirect failed:", e);
        message.error("Whoops! Couldn't open checkout. Please try again.");
      }
      return;
    }
    const maxStep = CALENDAR_STEP;
    if (currentStep >= maxStep) {
      handleClose();
      return;
    }
    setCurrentStep((prev) => prev + 1);
  }, [
    currentStep,
    CALENDAR_STEP,
    classData,
    bookingData,
    selectedOption,
    onClose,
    router,
    handleClose,
  ]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // -- FIXED SELECT HANDLERS --

  // 1. Highlight only (Visual selection, no navigation)
  const handleOptionHighlight = useCallback(
    (option) => {
      setSelectedOptionId(option.optionId);
      handleUpdateBooking({
        selectedOption: option,
        selectedSlots: [],
        price: parseFloat(option.price || 0),
      });
    },
    [handleUpdateBooking],
  );

  // 2. Select and Next (Navigation)
  const handleOptionSelectNext = useCallback(
    (option) => {
      handleOptionHighlight(option);
      // Immediate navigation
      handleNext();
    },
    [handleOptionHighlight, handleNext],
  );

  const businessTimeZone = classData?.business_timezone || "Etc/UTC";
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (!classData) return null;

  const shouldHideNextButton =
    currentStep === OPTION_STEP || // Hide next on step 1 so they use the 'Select' button
    (currentStep === CALENDAR_STEP && !isCourseBooking) ||
    currentStep >= CALENDAR_STEP;

  // --- RENDER CONTENT SWITCHER (Option + Calendar only; then redirect to checkout) ---
  const renderStepContent = () => {
    if (currentStep === OPTION_STEP) {
      return (
        <OptionSelectionStep
          options={classData.options}
          selectedOptionId={selectedOptionId}
          onHighlight={handleOptionHighlight}
          onSelect={handleOptionSelectNext}
        />
      );
    }

    if (currentStep === CALENDAR_STEP) {
      return isCourseBooking ? (
        <CourseCalendarStep
          optionId={selectedOption?.optionId}
          bookingData={bookingData}
          onUpdate={handleUpdateBooking}
          onNext={handleNext}
          classData={classData}
          userTimeZone={userTimeZone}
        />
      ) : (
        <CalendarStep
          optionId={selectedOption?.optionId}
          bookingData={bookingData}
          onUpdate={handleUpdateBooking}
          selectedOption={selectedOption}
          businessTimeZone={businessTimeZone}
          userTimeZone={userTimeZone}
          onNext={handleNext}
          initialDate={initialDate}
        />
      );
    }

    return <div>Error: Step not found.</div>;
  };

  const headerSteps = useMemo(() => {
    const base = ["Date"];
    if (hasMultipleOptions) {
      return ["Option", ...base];
    }
    return base;
  }, [hasMultipleOptions]);

  const ModalContent = (
    <ScrollableContent id="booking-modal-scroll-container">
      <AnimatedModalContent>
        <StepContentWrapper>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </StepContentWrapper>
      </AnimatedModalContent>
    </ScrollableContent>
  );

  // --- RENDER ---
  if (isMobile) {
    return (
      <Drawer.Root
        open={isVisible}
        repositionInputs={false}
        onOpenChange={(open) => {
          if (!open) {
            setIsVisible(false);
            setTimeout(() => {
              handleAnimationComplete();
            }, 300);
          }
        }}
      >
        <Drawer.Portal>
          <StyledDrawerOverlay />
          <StyledDrawerContent>
            <DrawerHandle />
            <DrawerHeader>
              <ModalHeader
                steps={headerSteps}
                currentStep={currentStep}
                classData={classData}
              />
            </DrawerHeader>
            <DrawerBody>
              <AnimatedModalContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      duration: 0.3,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>
              </AnimatedModalContent>
            </DrawerBody>
            <DrawerFooter>
              {shouldShowFooter && (
                <ModalFooter
                  currentStep={currentStep}
                  onBack={handleBack}
                  onNext={handleNext}
                  onClose={handleClose}
                  loading={isLoading}
                  hideNextButton={shouldHideNextButton}
                  hideBackButton={currentStep === 1}
                  isNextDisabled={!validateStep(currentStep, bookingData)}
                  bookingData={bookingData}
                  paymentAction={null}
                  isPaymentStep={false}
                />
              )}
            </DrawerFooter>
          </StyledDrawerContent>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <AnimatePresence mode="wait" onExitComplete={handleAnimationComplete}>
      {isVisible && (
        <DesktopOverlay
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <DesktopModal
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader steps={headerSteps} currentStep={currentStep} />
            <CloseButton onClick={handleClose} aria-label="Close booking modal">
              <X size={20} />
            </CloseButton>

            {ModalContent}

            {shouldShowFooter && currentStep > 1 && (
              <ModalFooter
                currentStep={currentStep}
                totalSteps={headerSteps.length}
                onBack={handleBack}
                onNext={handleNext}
                onClose={handleClose}
                loading={isLoading}
                hideNextButton={shouldHideNextButton}
                hideBackButton={currentStep === 1}
                isNextDisabled={!validateStep(currentStep, bookingData)}
                bookingData={bookingData}
                paymentAction={null}
                isPaymentStep={false}
              />
            )}
          </DesktopModal>
        </DesktopOverlay>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;
