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
import { Typography, ConfigProvider, Alert } from "antd";
import message from '@/lib/message';
import { CheckCircle, Calendar, X, Frown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthUser } from "@/hooks/useAuthUser";

import ExploreHeader from "@/components/explore/ExploreHeader";
import BookingsListSkeleton from "./BookingsListSkeleton";
import FooterClient from "@/components/homepage/FooterClient";
import BookingListItem from "./BookingClassCard";
import { bookingService } from "@/services/apiService";
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
  padding: 32px 24px 64px;

  @media (max-width: 768px) {
    padding: 24px 16px 48px;
  }
`;

const HeaderSection = styled.div`
  margin-bottom: 24px;
  text-align: center;

  @media (max-width: 768px) {
    margin-bottom: 16px;
    text-align: left;
  }
`;

const PageTitle = styled(Title)`
  &.ant-typography {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 4px;
    color: rgb(34, 34, 34);
  }
`;

const SubTitle = styled(Text)`
  font-size: 15px;
  color: #717171;
  display: block;
  max-width: 600px;
  margin: 0 auto;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    margin-bottom: 16px;
    justify-content: flex-start;
  }
`;

const TabNavigation = styled.div`
  background: white;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  padding: 4px;
  display: inline-flex;
  gap: 4px;
  position: relative;
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const TabIndicator = styled(motion.div)`
  position: absolute;
  top: 4px;
  bottom: 4px;
  background: ${theme.token.colorPrimary};
  border-radius: 6px;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(255, 38, 65, 0.2);
`;

const TabButton = styled(motion.button)`
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: ${(props) => (props.$active ? "white" : "#6b7280")};
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
  position: relative;
  white-space: nowrap;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;

  &:hover {
    color: ${(props) => (props.$active ? "white" : "#374151")};
  }

  svg {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 768px) {
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
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  background: white;
`;

const BookingsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const EmptyStateContainer = styled(motion.div)`
  text-align: center;
  padding: 60px 24px;
  background: white;

  .empty-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
    color: #d1d5db;
  }
`;

const EmptyTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 4px 0;
`;

const EmptyDescription = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
`;

const ErrorContainer = styled(motion.div)`
  padding: 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
`;

const MyScheduleAndBookings = () => {
  const { user: currentUser } = useAuthUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize tab from URL or default to 'upcoming'
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || "upcoming";
  });

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

  const tabRefs = useRef({});
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState({});

  const studentEffectiveTimeZone = useMemo(() => {
    return (
      currentUser?.user_timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
  }, [currentUser]);

  const tabs = [
    { key: "upcoming", label: "Upcoming", icon: <Calendar size={14} /> },
    { key: "completed", label: "Completed", icon: <CheckCircle size={14} /> },
    { key: "cancelled", label: "Cancelled", icon: <X size={14} /> },
  ];

  // --- Effect: Handle highlighting deep links from email ---
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId && !loading[activeTab] && bookingsData[activeTab].length > 0) {
      const element = document.getElementById(`booking-card-${highlightId}`);
      if (element) {
        // Delay slighty to ensure layout is stable
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [searchParams, loading, activeTab, bookingsData]);

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

  /**
   * Helper to collapse multiple course sessions into a single card.
   */
  const groupBookings = (rawBookings, tabKey) => {
    const groups = {};
    const singles = [];

    rawBookings.forEach((b) => {
      const isCourse = b.enrollment_type === "Full Course";

      let groupId = b.booking_group_id;
      if (isCourse && !groupId) {
        groupId = `fallback_group_${b.class_id || b.class_name}`;
      }

      if (isCourse && groupId) {
        if (!groups[groupId]) {
          groups[groupId] = [];
        }
        groups[groupId].push(b);
      } else {
        singles.push(b);
      }
    });

    const collapsedGroups = [];

    Object.values(groups).forEach((groupBookings) => {
      groupBookings.sort((a, b) => new Date(a.date) - new Date(b.date));

      const totalSessions = groupBookings.length;
      const isCourseReviewed = groupBookings.some(b => b.has_review);

      let bookingToDisplay = null;

      if (tabKey === "upcoming") {
        bookingToDisplay = groupBookings[0];
      } else if (tabKey === "completed") {
        bookingToDisplay = groupBookings[groupBookings.length - 1];
      } else {
        bookingToDisplay = groupBookings[0];
      }

      if (bookingToDisplay) {
        const currentSessionIndex = groupBookings.findIndex(b => b.id === bookingToDisplay.id);

        const collapsedBooking = {
          ...bookingToDisplay,
          session_info: {
            current_session: currentSessionIndex + 1,
            total_sessions: totalSessions
          },
          has_review: isCourseReviewed,
          all_sessions: groupBookings
        };
        collapsedGroups.push(collapsedBooking);
      }
    });

    const combined = [...singles, ...collapsedGroups];
    combined.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (tabKey !== "upcoming") {
      combined.reverse();
    }

    return combined;
  };

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
          return;
      }

      setLoading((prev) => ({ ...prev, [tabKey]: true }));
      setError((prev) => ({ ...prev, [tabKey]: null }));

      try {
        const filters = { status: apiStatus };
        if (apiWhen) filters.when = apiWhen;
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
                }
              } catch (e) {
                const businessTZDisplay =
                  booking.business_timezone?.replace("_", " ") || "TZ N/A";
                displayableDateTime = `${dayjs(booking.date).format(
                  "ddd, MMM D, YYYY"
                )} at ${dayjs(`1970-01-01T${booking.time}`).format(
                  "h:mm a"
                )} (${businessTZDisplay})`;
              }
            } else {
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

          const groupedData = groupBookings(transformedBookings, tabKey);

          setBookingsData((prev) => ({
            ...prev,
            [tabKey]: groupedData,
          }));
        } else {
          setError((prev) => ({
            ...prev,
            [tabKey]: response.error || `Failed to load ${tabKey} bookings`,
          }));
          setBookingsData((prev) => ({ ...prev, [tabKey]: [] }));
        }
      } catch (err) {
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
    // Only fetch if we haven't fetched this tab yet, 
    // or if it's the very first load and we need to respect the URL tab
    if (!hasFetched[activeTab]) {
      fetchBookings(activeTab);
    }
  }, [activeTab, hasFetched, fetchBookings]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    // Update URL without full reload
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabKey);
    router.replace(`?${newParams.toString()}`, { scroll: false });
  };

  const handleMessageInstructor = (booking) => {
    message.info("Messaging feature coming soon!");
  };

  const handleBookAgain = (booking) => {
    if (booking && booking.slug) {
      router.push(`/classes/${booking.slug}`);
    } else {
      message.error("Could not find class information to book again.");
    }
  };

  const renderContent = () => {
    const currentLoading = loading[activeTab];
    const currentError = error[activeTab];
    const currentBookings = bookingsData[activeTab] || [];
    const highlightId = searchParams.get('highlight');

    if (currentLoading) {
      return (
        <BookingsGrid>
          <BookingsListSkeleton count={8} />
        </BookingsGrid>
      );
    }

    if (currentError) {
      return (
        <ErrorContainer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert
            message="Error"
            description={currentError}
            type="error"
            showIcon
          />
        </ErrorContainer>
      );
    }

    if (currentBookings.length === 0) {
      let emptyIcon = <Frown className="empty-icon" />;
      let emptyTitle = "No classes";
      let emptyText = "Check other tabs.";

      if (activeTab === "upcoming") {
        emptyTitle = "No upcoming classes";
        emptyText = "Book your next session!";
        emptyIcon = <Calendar className="empty-icon" />;
      } else if (activeTab === "completed") {
        emptyTitle = "No completed classes";
        emptyText = "Your history will appear here.";
        emptyIcon = <CheckCircle className="empty-icon" />;
      } else if (activeTab === "cancelled") {
        emptyTitle = "No cancelled classes";
        emptyText = "Cancellations appear here.";
        emptyIcon = <X className="empty-icon" />;
      }

      return (
        <ContentContainer>
          <ContentHeader>
            <div style={{ fontWeight: "bold" }}>
              {tabs.find((t) => t.key === activeTab)?.label}
            </div>
          </ContentHeader>
          <EmptyStateContainer
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {emptyIcon}
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyText}</EmptyDescription>
          </EmptyStateContainer>
        </ContentContainer>
      );
    }

    return (
      <BookingsGrid
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <AnimatePresence mode="popLayout">
          {currentBookings.map((booking, index) => {
            // Check if this booking (or its group) matches the highlight ID
            const isHighlighted = highlightId && (
              String(booking.id) === highlightId ||
              (booking.booking_group_id && String(booking.booking_group_id) === highlightId)
            );

            return (
              <motion.div
                layout
                key={booking.id || `booking-item-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    delay: index * 0.03,
                    duration: 0.2,
                  },
                }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <BookingListItem
                  id={booking.id}
                  booking={booking}
                  highlighted={isHighlighted}
                  onMessageInstructor={handleMessageInstructor}
                  onBookAgain={handleBookAgain}
                  // Refresh list on success
                  onCancelSuccess={() => {
                    setHasFetched(prev => ({ ...prev, upcoming: false, cancelled: false }));
                    fetchBookings(activeTab);
                  }}
                  onReviewSuccess={() => {
                    setHasFetched(prev => ({ ...prev, completed: false }));
                    fetchBookings(activeTab);
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </BookingsGrid>
    );
  };

  return (
    <ConfigProvider theme={theme}>
      <ExploreHeader />
      <PageContainer>
        <HeaderSection>
          <PageTitle>My Bookings</PageTitle>
          <SubTitle>Manage your classes and track your progress.</SubTitle>
        </HeaderSection>

        <TabContainer>
          <TabNavigation>
            <TabIndicator
              animate={tabIndicatorStyle}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            {tabs.map((tab) => (
              <TabButton
                key={tab.key}
                ref={(el) => (tabRefs.current[tab.key] = el)}
                $active={activeTab === tab.key}
                onClick={() => handleTabChange(tab.key)}
              >
                {tab.icon}
                {tab.label}
              </TabButton>
            ))}
          </TabNavigation>
        </TabContainer>

        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </PageContainer>

      <FooterClient />
    </ConfigProvider>
  );
};

export default MyScheduleAndBookings;