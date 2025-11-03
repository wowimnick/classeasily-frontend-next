"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import dynamic from "next/dynamic";
import { Drawer } from "vaul";
import { paymentService } from "@/services/apiService";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useAuthModal } from "@/context/AuthContext";
import dayjs from "dayjs";

// Initialize Stripe outside component to prevent re-initialization
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

// Dynamic imports for better code splitting
const ReviewAndPaymentStep = dynamic(
  () => import("./steps/ReviewAndPaymentStep"),
  {
    loading: () => <div style={{ minHeight: "400px" }} />,
    ssr: false,
  }
);

const CalendarStep = dynamic(() => import("./steps/CalendarStep"), {
  loading: () => <div style={{ minHeight: "400px" }} />,
  ssr: false,
});

const ConfirmationStep = dynamic(() => import("./steps/ConfirmationStep"), {
  loading: () => <div style={{ minHeight: "400px" }} />,
  ssr: false,
});

const ModalHeader = dynamic(
  () =>
    import("./steps/ModalHeader").then((mod) => ({ default: mod.ModalHeader })),
  {
    ssr: false,
  }
);

const ModalFooter = dynamic(
  () =>
    import("./steps/ModalHeader").then((mod) => ({ default: mod.ModalFooter })),
  {
    ssr: false,
  }
);

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
  max-width: 1200px;
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
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
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
  height: 90%;
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
  border-bottom: 1px solid #f0f0f0;
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 4px;
  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

const DrawerFooter = styled.div`
  flex-shrink: 0;
  border-top: 1px solid #f0f0f0;
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
  optionId,
  initialParticipantCount = 1,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { user: currentUserFromRedux, isLoading: userLoading } = useAuthUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { openLoginModal } = useAuthModal();
  const [paymentAction, setPaymentAction] = useState(null);

  const effectiveInitialParticipants = useMemo(() => {
    // This code runs on the client side, which is appropriate for a modal interaction.
    // We check for `isOpen` to avoid running this when the component is not active.
    if (typeof window !== "undefined" && isOpen) {
      const params = new URLSearchParams(window.location.search);
      const participantsFromUrl = params.get("participants");
      if (participantsFromUrl) {
        const num = parseInt(participantsFromUrl, 10);
        // Use the URL value if it's a valid positive number
        if (!isNaN(num) && num > 0) {
          return num;
        }
      }
    }
    // Fallback to the prop
    return initialParticipantCount;
  }, [isOpen, initialParticipantCount]);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const selectedOption = useMemo(() => {
    return classData?.options?.find((opt) => opt.optionId === optionId);
  }, [classData, optionId]);

  const initialDate = useMemo(() => {
    if (!selectedOption || !Array.isArray(selectedOption.schedules)) {
      return null;
    }

    const upcomingSchedules = selectedOption.schedules
      .filter(
        (s) => s.date && dayjs(s.date).isAfter(dayjs().subtract(1, "day"))
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
      (_, i) => ({
        name: i === 0 && bookerName ? bookerName : "",
      })
    );

    let initialPrice = 0;
    if (selectedOption) {
      const firstActiveSchedule = selectedOption.schedules?.find(
        (s) => s.is_active === true
      );
      initialPrice = parseFloat(
        firstActiveSchedule?.price || selectedOption.price || 0
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
  }, [
    initialParticipantCount,
    selectedOption,
    currentUserFromRedux?.first_name,
    currentUserFromRedux?.last_name,
    currentUserFromRedux?.email,
    currentUserFromRedux?.phone_number,
  ]);

  const [bookingData, setBookingData] = useState(() =>
    getInitialBookingState()
  );

  useEffect(() => {
    if (isOpen) {
      const newInitialState = getInitialBookingState();
      setBookingData((prev) => {
        const userJustLoggedIn = !prev.userEmail && !!newInitialState.userEmail;
        const optionChanged =
          selectedOption?.optionId !== prev.selectedOption?.optionId;
        // FIX: Also reset if the participant count from the prop is different
        // and the user hasn't already started picking slots.
        const participantsPropChanged =
          prev.participants !== newInitialState.participants &&
          prev.selectedSlots.length === 0;

        if (userJustLoggedIn || optionChanged || participantsPropChanged) {
          return {
            ...newInitialState,
            // If the option or participants changed, clear the slots. Otherwise, keep them.
            selectedSlots:
              optionChanged || participantsPropChanged
                ? []
                : prev.selectedSlots,
            // Persist payment details across state resets if needed
            paymentIntentId: prev.paymentIntentId,
            clientSecret: prev.clientSecret,
            bookingId: prev.bookingId,
            user_facing_reference: prev.user_facing_reference,
            booking_group_id: prev.booking_group_id,
            notes: prev.notes || "",
          };
        }
        return prev;
      });
    }
  }, [isOpen, selectedOption?.optionId, getInitialBookingState]);

  const resetModal = useCallback(() => {
    setCurrentStep(1);
    setBookingData(getInitialBookingState());
    setIsLoading(false);
    setPaymentAction(null);
  }, [getInitialBookingState]);

  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  const handleUpdateBooking = useCallback(
    (data) => {
      setBookingData((prev) => {
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
            (s) => s.is_active === true
          );
          let resetPrice = parseFloat(
            firstActiveSchedule?.price || newState.selectedOption?.price || 0
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
            const currentDetails = prev.participant_details || [];
            let bookerNameForPrefill = prev.userName;
            if (!bookerNameForPrefill && currentUserFromRedux) {
              bookerNameForPrefill = `${
                currentUserFromRedux.first_name || ""
              } ${currentUserFromRedux.last_name || ""}`.trim();
            }
            newState.participant_details = Array.from(
              { length: newCount },
              (_, i) => {
                let name = currentDetails[i]?.name || "";
                if (i === 0 && bookerNameForPrefill && !name) {
                  name = bookerNameForPrefill;
                }
                return { name: name || "" };
              }
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
    [currentUserFromRedux]
  );

  const handlePaymentComplete = useCallback((dataFromReviewStep) => {
    if (dataFromReviewStep.booking_id) {
      setBookingData((prev) => ({
        ...prev,
        bookingId: dataFromReviewStep.booking_id,
        user_facing_reference: dataFromReviewStep.user_facing_reference,
        booking_group_id: dataFromReviewStep.booking_group_id,
        participant_details: dataFromReviewStep.participant_details,
        paymentIntentId: null,
      }));
      setCurrentStep(3);
      setIsLoading(false);
    } else if (dataFromReviewStep.payment_intent_id) {
      setBookingData((prev) => ({
        ...prev,
        paymentIntentId: dataFromReviewStep.payment_intent_id,
        clientSecret: dataFromReviewStep.client_secret,
        bookingId: null,
      }));
      setCurrentStep(3);
      setIsLoading(false);
    } else {
      console.error("Unexpected payment data structure");
      setIsLoading(false);
    }
  }, []);

  const updateBookingDetailsFromPolling = useCallback((details) => {
    setBookingData((prev) => ({
      ...prev,
      bookingId: details.booking_id || prev.bookingId,
      user_facing_reference:
        details.user_facing_reference || prev.user_facing_reference,
      booking_group_id: details.booking_group_id || prev.booking_group_id,
      participant_details:
        details.participant_details || prev.participant_details,
    }));
  }, []);

  const validateStep = useCallback(
    (step, dataToValidate) => {
      switch (step) {
        case 1:
          if (isCourseBooking) {
            const courseSlot = dataToValidate.selectedSlots?.[0];
            return !!(courseSlot && courseSlot.id);
          } else {
            const slot = dataToValidate.selectedSlots?.[0];
            return !!(slot && slot.id && slot.date && slot.time);
          }
        case 2:
          return true;
        case 3:
          return false;
        default:
          return false;
      }
    },
    [isCourseBooking]
  );

  const handleNext = useCallback(async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const businessTimeZone = classData?.business_timezone || "Etc/UTC";
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const steps = useMemo(
    () => ({
      1: {
        component: isCourseBooking ? (
          <div />
        ) : (
          <CalendarStep
            optionId={optionId}
            bookingData={bookingData}
            onUpdate={handleUpdateBooking}
            selectedOption={selectedOption}
            businessTimeZone={businessTimeZone}
            userTimeZone={userTimeZone}
            onNext={handleNext}
            initialDate={initialDate}
          />
        ),
      },
      2: {
        component: (
          <Elements stripe={stripePromise}>
            <ReviewAndPaymentStep
              bookingData={bookingData}
              classData={classData}
              paymentService={paymentService}
              onPaymentComplete={handlePaymentComplete}
              isUserLoggedIn={!!currentUserFromRedux}
              onUpdateBookingData={handleUpdateBooking}
              onPaymentAction={setPaymentAction}
              userTimeZone={userTimeZone}
              businessTimeZone={businessTimeZone}
            />
          </Elements>
        ),
      },
      3: {
        component: (
          <ConfirmationStep
            bookingData={bookingData}
            classData={classData}
            userTimeZone={userTimeZone}
            businessTimeZone={businessTimeZone}
            paymentIntentId={bookingData.paymentIntentId}
            bookingId={bookingData.bookingId}
            onBookingDetailsFetched={updateBookingDetailsFromPolling}
            onRetryBooking={handleClose}
          />
        ),
      },
    }),
    [
      isCourseBooking,
      optionId,
      bookingData,
      handleUpdateBooking,
      classData,
      selectedOption,
      businessTimeZone,
      userTimeZone,
      handlePaymentComplete,
      currentUserFromRedux,
      updateBookingDetailsFromPolling,
      initialDate,
      handleNext,
      handleClose,
    ]
  );

  if (!classData || !selectedOption) {
    return null;
  }

  // Render mobile drawer
  if (isMobile) {
    return (
      <Drawer.Root
        open={isOpen}
        onOpenChange={(open) => !open && handleClose()}
      >
        <Drawer.Portal>
          <StyledDrawerOverlay />
          <StyledDrawerContent>
            <DrawerHandle />

            <DrawerHeader>
              <ModalHeader
                classData={{
                  title: classData.title,
                  image:
                    classData.images?.[0]?.thumbnail_url || "/placeholder.jpg",
                  selectedOption: selectedOption,
                }}
                currentStep={currentStep}
                totalSteps={Object.keys(steps).length}
                bookingData={bookingData}
                businessTimeZone={businessTimeZone}
                userTimeZone={userTimeZone}
              />
            </DrawerHeader>

            <DrawerBody>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {steps[currentStep]?.component || (
                    <div>Error: Step not found.</div>
                  )}
                </motion.div>
              </AnimatePresence>
            </DrawerBody>

            <DrawerFooter>
              <ModalFooter
                currentStep={currentStep}
                onBack={handleBack}
                onNext={handleNext}
                onClose={handleClose}
                loading={isLoading}
                hideNextButton={currentStep >= 2}
                hideBackButton={currentStep === 1 || currentStep === 3}
                isNextDisabled={
                  currentStep === 1 && !validateStep(currentStep, bookingData)
                }
                bookingData={bookingData}
                businessTimeZone={businessTimeZone}
                userTimeZone={userTimeZone}
                paymentAction={paymentAction}
              />
            </DrawerFooter>
          </StyledDrawerContent>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Render desktop modal
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <DesktopOverlay
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
        >
          <DesktopModal
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader
              classData={{
                title: classData.title,
                image:
                  classData.images?.[0]?.thumbnail_url || "/placeholder.jpg",
                selectedOption: selectedOption,
              }}
              currentStep={currentStep}
              totalSteps={Object.keys(steps).length}
              bookingData={bookingData}
              businessTimeZone={businessTimeZone}
              userTimeZone={userTimeZone}
            />

            <CloseButton
              onClick={handleClose}
              aria-label="Close booking modal"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </CloseButton>

            <ModalContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {steps[currentStep]?.component || (
                    <div>Error: Step not found.</div>
                  )}
                </motion.div>
              </AnimatePresence>
            </ModalContent>

            <ModalFooter
              currentStep={currentStep}
              onBack={handleBack}
              onNext={handleNext}
              onClose={handleClose}
              loading={isLoading}
              hideNextButton={currentStep >= 2}
              hideBackButton={currentStep === 1 || currentStep === 3}
              isNextDisabled={
                currentStep === 1 && !validateStep(currentStep, bookingData)
              }
              bookingData={bookingData}
              businessTimeZone={businessTimeZone}
              userTimeZone={userTimeZone}
              paymentAction={paymentAction}
            />
          </DesktopModal>
        </DesktopOverlay>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;
