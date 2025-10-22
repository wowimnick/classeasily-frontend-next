"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Typography, Empty, ConfigProvider, Alert, Spin } from "antd";
import message from "@/lib/message";
import {
  Clock,
  CalendarDays,
  CheckCircle,
  XCircle,
  Info,
  Star,
  Frown,
  History,
  Calendar,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/useAuthUser";

import CancellationInfoModal from "./CancellationInfoModal";
import ExploreHeader from "@/components/explore/ExploreHeader";
import BookingsListSkeleton from "./BookingsListSkeleton";
import FooterClient from "@/components/homepage/FooterClient";
import BookingListItem from "./BookingClassCard";
import ReviewModal from "./ReviewModal";
import { bookingService, reviewService } from "@/services/apiService";
import { formatBusinessLocalToUserDisplay } from "@/services/utils";
import { theme } from "@/components/theme";

import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(duration);
dayjs.extend(relativeTime);

const { Title, Text } = Typography;

// --- Styled Components ---
const PageContainer = styled.div`
  max-width: 1200px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 48px 24px 96px;

  @media (max-width: 768px) {
    padding: 24px 16px 96px;
  }

  @media (max-width: 480px) {
    padding: 24px 12px 96px;
  }
`;

const HeaderSection = styled.div`
  margin-bottom: 32px;
  text-align: center;

  @media (max-width: 768px) {
    margin-bottom: 24px;
    text-align: left;
  }
`;

const PageTitle = styled(Title)`
  &.ant-typography {
    font-size: 36px;
    font-weight: 800;
    margin-bottom: 8px;
    color: rgb(34, 34, 34);
    line-height: 1.2;
  }

  @media (max-width: 768px) {
    font-size: 30px;
  }

  @media (max-width: 480px) {
    font-size: 26px;
  }
`;

const SubTitle = styled(Text)`
  font-size: 18px;
  color: #717171;
  display: block;
  line-height: 1.4;
  max-width: 600px;
  margin: 0 auto;

  @media (max-width: 768px) {
    font-size: 16px;
    margin: 0;
  }
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    margin-bottom: 24px;
    justify-content: flex-start;
  }
`;

const TabNavigation = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  padding: 6px;
  display: inline-flex;
  gap: 4px;
  position: relative;
  overflow-x: auto;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */

  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, and Opera */
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 4px;
    justify-content: space-between;
  }
`;

const TabIndicator = styled(motion.div)`
  position: absolute;
  top: 6px;
  bottom: 6px;
  background: ${theme.token.colorPrimary};
  border-radius: 8px;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(255, 38, 65, 0.2);

  @media (max-width: 768px) {
    top: 4px;
    bottom: 4px;
  }
`;

const TabButton = styled(motion.button)`
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: ${(props) => (props.$active ? "white" : "#6b7280")};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
  position: relative;
  white-space: nowrap;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;

  &:hover {
    color: ${(props) => (props.$active ? "white" : "#374151")};
  }

  svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 768px) {
    padding: 10px 16px;
    flex: 1;
    justify-content: center;
  }
`;

const ContentContainer = styled.div`
  background: #f9f9f9;
  border-radius: 16px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
`;

const ContentHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
  background: white;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #222;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: ${theme.token.colorPrimary};
  }

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const BookingsList = styled(motion.div)`
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const EmptyStateContainer = styled(motion.div)`
  text-align: center;
  padding: 80px 24px;
  background: white;

  .empty-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 24px;
    color: #d1d5db;
  }

  @media (max-width: 768px) {
    padding: 60px 16px;
  }
`;

const EmptyTitle = styled.h4`
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
`;

const EmptyDescription = styled.p`
  font-size: 15px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
`;

const LoaderContainer = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 24px;
  background: white;
`;

const ErrorContainer = styled(motion.div)`
  padding: 40px 24px;
  background: white;
`;

const MyScheduleAndBookings = () => {
  const { user: currentUser, isLoading: userLoading } = useAuthUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [bookingsData, setBookingsData] = useState({
    upcoming: [],
    completed: [],
    cancelled: [],
  });
  const [loading, setLoading] = useState({
    upcoming: true,
    completed: false,
    cancelled: false,
  });
  const [error, setError] = useState({
    upcoming: null,
    completed: null,
    cancelled: null,
  });
  const [hasFetched, setHasFetched] = useState({
    upcoming: false,
    completed: false,
    cancelled: false,
  });

  const [reviewBooking, setReviewBooking] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // --- State for the new cancellation flow ---
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationDetails, setCancellationDetails] = useState(null);
  const [isFetchingCancelInfo, setIsFetchingCancelInfo] = useState(false);
  const [isProcessingCancellation, setIsProcessingCancellation] =
    useState(false);

  // Refs for tab positioning
  const tabRefs = useRef({});
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState({});

  const studentEffectiveTimeZone = useMemo(() => {
    return (
      currentUser?.user_timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
  }, [currentUser]);

  // Tab configuration with icons
  const tabs = [
    { key: "upcoming", label: "Upcoming", icon: <Calendar size={16} /> },
    { key: "completed", label: "Completed", icon: <CheckCircle size={16} /> },
    { key: "cancelled", label: "Cancelled", icon: <X size={16} /> },
  ];

  // Update tab indicator position
  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTab];
    if (activeTabElement) {
      const { offsetLeft, offsetWidth } = activeTabElement;
      setTabIndicatorStyle({
        left: offsetLeft,
        width: offsetWidth,
      });
    }
  }, [activeTab]);

  const fetchBookings = useCallback(
    async (tabKey) => {
      let apiStatus;
      let apiWhen = null;

      switch (tabKey) {
        case "upcoming":
          apiStatus = "confirmed";
          apiWhen = "upcoming";
          break;
        case "completed":
          apiStatus = "completed";
          break;
        case "cancelled":
          apiStatus = "cancelled";
          break;
        default:
          console.warn("Invalid tab key for fetching:", tabKey);
          return;
      }

      setLoading((prev) => ({ ...prev, [tabKey]: true }));
      setError((prev) => ({ ...prev, [tabKey]: null }));

      try {
        const filters = { status: apiStatus };
        if (apiWhen) {
          filters.when = apiWhen;
        }
        const response = await bookingService.getMyBookings(filters);

        if (
          response.success &&
          response.data &&
          Array.isArray(response.data.bookings)
        ) {
          const transformedBookings = response.data.bookings.map((booking) => {
            let displayableDateTime = "Date/Time N/A";
            if (
              booking.date &&
              booking.time &&
              booking.business_timezone &&
              studentEffectiveTimeZone
            ) {
              try {
                const datePart = formatBusinessLocalToUserDisplay(
                  booking.date,
                  booking.time,
                  booking.business_timezone,
                  studentEffectiveTimeZone,
                  { dateTimeFormat: "PP" }
                );
                const timePart = formatBusinessLocalToUserDisplay(
                  booking.date,
                  booking.time,
                  booking.business_timezone,
                  studentEffectiveTimeZone,
                  { dateTimeFormat: "p" }
                );
                const tzAbbreviation = formatBusinessLocalToUserDisplay(
                  booking.date,
                  booking.time,
                  booking.business_timezone,
                  studentEffectiveTimeZone,
                  { dateTimeFormat: "zzz" }
                );

                if (
                  datePart !== "Invalid Date" &&
                  timePart !== "Invalid Time"
                ) {
                  displayableDateTime = `${datePart} at ${timePart} (${tzAbbreviation})`;
                } else {
                  throw new Error("Failed to format date or time part.");
                }
              } catch (e) {
                console.error(
                  "Error formatting student booking time:",
                  e,
                  booking
                );
                const businessTZDisplay =
                  booking.business_timezone?.replace("_", " ") || "TZ N/A";
                displayableDateTime = `${dayjs(booking.date).format(
                  "ddd, MMM D, YYYY"
                )} at ${dayjs(`1970-01-01T${booking.time}`).format(
                  "h:mm a"
                )} (${businessTZDisplay})`;
              }
            } else {
              console.warn(
                "Missing data for student booking time display:",
                booking
              );
              if (booking.date && booking.time) {
                displayableDateTime = `${dayjs(booking.date).format(
                  "ddd, MMM d, yyyy"
                )} at ${dayjs(`1970-01-01T${booking.time}`).format(
                  "h:mm a"
                )} (Timezone Info Missing)`;
              }
            }

            return {
              ...booking,
              id: booking.booking_id,
              userLocalSessionTime: displayableDateTime,
            };
          });
          setBookingsData((prev) => ({
            ...prev,
            [tabKey]: transformedBookings,
          }));
        } else {
          console.error(`Failed to fetch ${tabKey} bookings:`, response.error);
          message.error(response.error || `Failed to fetch ${tabKey} bookings`);
          setError((prev) => ({
            ...prev,
            [tabKey]: response.error || `Failed to load ${tabKey} bookings`,
          }));
          setBookingsData((prev) => ({ ...prev, [tabKey]: [] }));
        }
      } catch (err) {
        console.error(`Unexpected error fetching ${tabKey} bookings:`, err);
        message.error(`An error occurred while loading ${tabKey} bookings`);
        setError((prev) => ({
          ...prev,
          [tabKey]: `An error occurred loading ${tabKey} bookings`,
        }));
        setBookingsData((prev) => ({ ...prev, [tabKey]: [] }));
      } finally {
        setLoading((prev) => ({ ...prev, [tabKey]: false }));
        setHasFetched((prev) => ({ ...prev, [tabKey]: true }));
      }
    },
    [studentEffectiveTimeZone]
  );

  useEffect(() => {
    if (!hasFetched[activeTab]) {
      fetchBookings(activeTab);
    }
  }, [activeTab, hasFetched, fetchBookings]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
  };

  // --- This function now fetches cancellation info before opening the modal ---
  const handleShowCancellationInfoModal = async (booking) => {
    if (!booking || !booking.booking_id) return;

    setCancellingBooking(booking);
    setIsCancelModalOpen(true);
    setIsFetchingCancelInfo(true);
    setCancellationDetails(null); // Clear previous details while loading

    const response = await bookingService.getBookingCancellationInfo(
      booking.booking_id
    );

    if (response.success) {
      setCancellationDetails(response.data);
    } else {
      setCancellationDetails({
        error:
          response.error ||
          "Could not retrieve cancellation details. Please try again.",
      });
      message.error("Could not load cancellation policy details.");
    }
    setIsFetchingCancelInfo(false);
  };

  const executeStudentCancellation = async (bookingToCancel) => {
    if (!bookingToCancel || !bookingToCancel.booking_id) {
      message.error("Booking information is missing. Cannot cancel.");
      return;
    }

    const bookingIdToSubmit = bookingToCancel.booking_id;
    setIsProcessingCancellation(true);
    message.loading({
      content: "Processing cancellation...",
      key: `cancel-${bookingIdToSubmit}`,
      duration: 0,
    });
    try {
      const response = await bookingService.studentCancelBooking(
        bookingIdToSubmit,
        "Cancelled by student."
      );

      if (response.success) {
        message.success({
          content: "Class cancelled successfully",
          key: `cancel-${bookingIdToSubmit}`,
          duration: 2,
        });
        setIsCancelModalOpen(false);
        setCancellingBooking(null);
        setCancellationDetails(null);
        // Refresh data for the relevant tabs
        fetchBookings("upcoming");
        fetchBookings("cancelled");
      } else {
        let errorMsg = "Failed to cancel booking.";
        if (typeof response.error === "string") {
          errorMsg = response.error;
        } else if (response.error?.detail) {
          errorMsg = response.error.detail;
        } else if (response.error?.policy) {
          errorMsg = response.error.policy;
        }
        message.error({
          content: errorMsg,
          key: `cancel-${bookingIdToSubmit}`,
          duration: 4,
        });
      }
    } catch (error) {
      console.error("Error executing student cancellation:", error);
      message.error({
        content: "An unexpected error occurred during cancellation.",
        key: `cancel-${bookingIdToSubmit}`,
        duration: 3,
      });
    } finally {
      setIsProcessingCancellation(false);
    }
  };

  const handleMessageInstructor = (booking) => {
    message.info("Messaging feature coming soon!");
  };

  const handleReviewSubmit = () => {
    message.success({
      content: "Review submitted successfully!",
      key: "reviewMsg",
      duration: 3,
    });

    setIsReviewModalOpen(false);
    setReviewBooking(null);
    fetchBookings("completed");
  };

  const handleLeaveReviewClick = (booking) => {
    setReviewBooking(booking);
    setIsReviewModalOpen(true);
  };

  const handleBookAgain = (booking) => {
    if (booking && booking.slug) {
      message.info(`Navigating to class page...`);
      router.push(`/classes/${booking.slug}`);
    } else {
      message.error("Could not find class information to book again.");
      console.error(
        "Book again failed: slug missing from booking object",
        booking
      );
    }
  };

  const getSectionInfo = () => {
    switch (activeTab) {
      case "upcoming":
        return {
          title: "Upcoming Classes",
          icon: <Calendar size={20} />,
        };
      case "completed":
        return {
          title: "Completed Classes",
          icon: <CheckCircle size={20} />,
        };
      case "cancelled":
        return {
          title: "Cancelled Classes",
          icon: <X size={20} />,
        };
      default:
        return {
          title: "Classes",
          icon: <History size={20} />,
        };
    }
  };

  const renderContent = () => {
    const currentLoading = loading[activeTab];
    const currentError = error[activeTab];
    const currentBookings = bookingsData[activeTab] || [];
    const sectionInfo = getSectionInfo();

    if (currentLoading) {
      return (
        <ContentContainer>
          <ContentHeader>
            <SectionTitle>
              {sectionInfo.icon}
              {sectionInfo.title}
            </SectionTitle>
          </ContentHeader>
          <BookingsList>
            <BookingsListSkeleton count={3} />
          </BookingsList>
        </ContentContainer>
      );
    }

    if (currentError) {
      return (
        <ContentContainer>
          <ContentHeader>
            <SectionTitle>
              {sectionInfo.icon}
              {sectionInfo.title}
            </SectionTitle>
          </ContentHeader>
          <ErrorContainer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Alert
              message="Error Loading Bookings"
              description={currentError}
              type="error"
              showIcon
            />
          </ErrorContainer>
        </ContentContainer>
      );
    }

    if (currentBookings.length === 0) {
      let emptyIcon = <Frown className="empty-icon" />;
      let emptyTitle = "No classes here";
      let emptyText = "Check other tabs or explore classes.";

      if (activeTab === "upcoming") {
        emptyTitle = "No upcoming classes";
        emptyText =
          "Ready to learn something new? Explore available classes and book your next session!";
        emptyIcon = <Calendar className="empty-icon" />;
      } else if (activeTab === "completed") {
        emptyTitle = "No completed classes yet";
        emptyText =
          "Once you complete a class, it will appear here. You'll also be able to leave reviews for your instructors.";
        emptyIcon = <CheckCircle className="empty-icon" />;
      } else if (activeTab === "cancelled") {
        emptyTitle = "No cancelled classes";
        emptyText =
          "Any classes that get cancelled will appear here for your reference.";
        emptyIcon = <X className="empty-icon" />;
      }

      return (
        <ContentContainer>
          <ContentHeader>
            <SectionTitle>
              {sectionInfo.icon}
              {sectionInfo.title}
            </SectionTitle>
          </ContentHeader>
          <EmptyStateContainer
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {emptyIcon}
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyText}</EmptyDescription>
          </EmptyStateContainer>
        </ContentContainer>
      );
    }

    return (
      <ContentContainer>
        <ContentHeader>
          <SectionTitle>
            {sectionInfo.icon}
            {sectionInfo.title}
          </SectionTitle>
        </ContentHeader>
        <BookingsList
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AnimatePresence>
            {currentBookings.map((booking, index) => (
              <motion.div
                layout
                key={booking.id || `booking-item-${index}`}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: {
                    delay: index * 0.05, // Subtle stagger
                    duration: 0.3,
                    ease: "easeOut",
                  },
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                  transition: { duration: 0.2 },
                }}
              >
                <BookingListItem
                  booking={booking}
                  onMessageInstructor={handleMessageInstructor}
                  onLeaveReview={() => handleLeaveReviewClick(booking)}
                  onBookAgain={handleBookAgain}
                  onShowCancellationInfo={handleShowCancellationInfoModal}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </BookingsList>
      </ContentContainer>
    );
  };

  return (
    <ConfigProvider theme={theme}>
      <ExploreHeader />
      <PageContainer>
        <HeaderSection>
          <PageTitle>My Bookings</PageTitle>
          <SubTitle>
            Manage your upcoming classes, review completed sessions, and track
            your learning journey.
          </SubTitle>
        </HeaderSection>

        <TabContainer>
          <TabNavigation>
            <TabIndicator
              animate={tabIndicatorStyle}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            />
            {tabs.map((tab) => (
              <TabButton
                key={tab.key}
                ref={(el) => (tabRefs.current[tab.key] = el)}
                $active={activeTab === tab.key}
                onClick={() => handleTabChange(tab.key)}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
                whileTap={{
                  scale: 0.98,
                  transition: { duration: 0.1 },
                }}
              >
                {tab.icon}
                {tab.label}
              </TabButton>
            ))}
          </TabNavigation>
        </TabContainer>

        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </PageContainer>

      <ReviewModal
        booking={reviewBooking}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewBooking(null);
        }}
        onSubmit={handleReviewSubmit}
      />

      <CancellationInfoModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setCancellingBooking(null);
          setCancellationDetails(null);
        }}
        booking={cancellingBooking}
        userTimeZone={studentEffectiveTimeZone}
        cancellationDetails={cancellationDetails}
        isLoading={isFetchingCancelInfo}
        onConfirmCancel={executeStudentCancellation}
        isCancelling={isProcessingCancellation}
      />

      <FooterClient />
    </ConfigProvider>
  );
};

export default MyScheduleAndBookings;
