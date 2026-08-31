"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import styled from "styled-components";
import {
  Input,
  Button,
  DatePicker,
  Card,
  Spin,
  Select,
  Badge,
  Space,
  Grid,
  Skeleton,
  Empty,
  Divider,
} from "antd";
import message from "@/lib/message";
import {
  Search,
  RefreshCw,
  Filter,
  CheckCircle,
  Calendar,
  ClipboardList,
  Users as UsersIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
import debounce from "lodash/debounce";
import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";
import { useUrlState, useReplaceSearchParams } from "@/hooks/useUrlState";
import { bookingService } from "@/services/apiService";
import DesktopActiveBookings from "./DesktopActiveBookings";
import MobileActiveBookings from "./MobileActiveBookings";
import BookingDetailsDrawer from "./BookingDetailsDrawer";
import RescheduleBookingModal from "./RescheduleBookingModal";
import BookingDemoToggle from "./BookingDemoToggle";
import { isBookingDemoEnabled } from "@/lib/devEnv";
import {
  fetchFixtureBookings,
  patchFixtureBooking,
} from "./__fixtures__/bookingFixtures";
import { LordIcon } from "@/services/ReactUtils";
import { ResponsiveDateRangePicker } from "@/components/common/mobile/MobilePickers";
import {
  MetricPeriodBadge,
  formatDayjsRangeBadge,
} from "../../shared/MetricPeriodBadge";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;

const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  lightBg: "#f8fafc",
  border: "#f1f5f9",
  textPrimary: "#334155",
  textSecondary: "#64748b",
};

const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${(p) => (p.$noPadding ? "0" : "24px")};
  background-color: #fff;
  min-height: 100vh;
  @media (max-width: 768px) {
    padding: ${(p) => (p.$noPadding ? "0" : "16px")};
    gap: 0;
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0 0 4px 0;
  line-height: 1.2;
  @media (max-width: 768px) {
    font-size: 22px;
    margin-bottom: 6px;
  }
  @media (max-width: 480px) {
    font-size: 20px;
    margin-bottom: 4px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
`;

const StatCard = styled(Card)`
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  margin-bottom: 0;
  height: 100%;
  min-height: 130px;
  background: #ffffff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  .ant-card-body {
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }

  @media (max-width: 768px) {
    min-height: 110px;
    .ant-card-body {
      padding: 14px 16px;
    }
  }
`;

const StatCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const IconContainer = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.background || "#f1f5f9"};
  color: ${(props) => props.color || colors.textSecondary};

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 4px;
  display: flex;
  align-items: baseline;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const SearchFilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 16px 0;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
`;

const SearchInput = styled(Input)`
  width: 300px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

  &:hover,
  &:focus {
    border-color: #ff385c;
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
  }
  .ant-input {
    font-size: 15px;
  }
  .ant-input-prefix {
    color: #9ca3af;
    margin-right: 8px;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ActionButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  flex-shrink: 0;

  &:hover {
    color: #ff385c;
    border-color: #ff385c;
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);

    lord-icon {
      --lord-icon-primary: #ff385c;
      --lord-icon-secondary: #ff385c;
    }
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const StyledRangePicker = styled(RangePicker)`
  height: 44px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  width: 280px;

  &:hover,
  &:focus-within {
    border-color: #ff385c;
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
  }
  .ant-picker-input > input {
    font-size: 15px;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const TableSection = styled(motion.div)`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 0.7;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.$padding || "60px 20px"};
  text-align: center;
  gap: 16px;

  @media (max-width: 768px) {
    padding: ${(props) => props.$padding || "40px 16px"};
    gap: 12px;
  }

  @media (max-width: 480px) {
    padding: ${(props) => props.$padding || "30px 12px"};
    gap: 10px;
  }
`;

const EmptyStateIcon = styled.div`
  opacity: 0.3;
  filter: grayscale(100%);

  lord-icon {
    width: 80px;
    height: 80px;
  }

  @media (max-width: 768px) {
    lord-icon {
      width: 64px;
      height: 64px;
    }
  }

  @media (max-width: 480px) {
    lord-icon {
      width: 48px;
      height: 48px;
    }
  }
`;

const EmptyStateText = styled.div`
  color: ${colors.textSecondary};
  font-size: 15px;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const EmptyStateSubtext = styled.div`
  color: ${colors.textSecondary};
  font-size: 13px;
  opacity: 0.7;
  max-width: 300px;

  @media (max-width: 768px) {
    font-size: 12px;
    max-width: 250px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
    max-width: 200px;
  }
`;

function parsePositiveIntParam(raw) {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const ActiveBookings = ({
  noWrapperPadding,
  openBookingIdFromQuery = false,
} = {}) => {
  const searchParams = useSearchParams();
  const replaceListParams = useReplaceSearchParams();
  const [urlBookingIdRaw, setUrlBookingId] = useUrlState("bookingId", {
    enabled: openBookingIdFromQuery,
  });
  const [listFiltersHydrated, setListFiltersHydrated] = useState(false);
  const bookingIdFromUrl = parsePositiveIntParam(urlBookingIdRaw);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [isViewDrawerVisibleLocal, setIsViewDrawerVisibleLocal] =
    useState(false);
  const [selectedBookingIdLocal, setSelectedBookingIdLocal] = useState(null);

  const selectedBookingId = openBookingIdFromQuery
    ? bookingIdFromUrl
    : selectedBookingIdLocal;
  const isViewDrawerVisible = openBookingIdFromQuery
    ? bookingIdFromUrl != null
    : isViewDrawerVisibleLocal;
  const [isMobile, setIsMobile] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState([dayjs(), null]);
  const [totalActiveParticipantSpots, setTotalActiveParticipantSpots] =
    useState(0);
  const [bookings, setBookings] = useState([]);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);
  const [isRescheduleModalVisible, setIsRescheduleModalVisible] =
    useState(false); // New State
  const [bookingToReschedule, setBookingToReschedule] = useState(null); // New State

  const [tableParams, setTableParams] = useState({
    pagination: { current: 1, pageSize: 10 },
    sortField: "schedule_instance__date",
    sortOrder: "ascend",
  });
  const [totalResults, setTotalResults] = useState(0);
  const [demoEpoch, setDemoEpoch] = useState(0);

  const screens = useBreakpoint();
  const refreshButtonRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 767);
    handleResize(); // Set initial value
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (listFiltersHydrated) return;
    setListFiltersHydrated(true);
    const s = searchParams.get("search") || "";
    const p = parsePositiveIntParam(searchParams.get("page"));
    const ps = parsePositiveIntParam(searchParams.get("pageSize"));
    const sf = searchParams.get("sortField");
    const so = searchParams.get("sortOrder");
    const df = searchParams.get("dateFrom");
    const dt = searchParams.get("dateTo");
    if (s) setSearchText(s);
    setTableParams((prev) => ({
      ...prev,
      pagination: {
        current: p ?? prev.pagination.current,
        pageSize: ps ?? prev.pagination.pageSize,
      },
      ...(sf && /^[\w.]+$/.test(sf) && sf.length < 120 ? { sortField: sf } : {}),
      ...(so === "ascend" || so === "descend" ? { sortOrder: so } : {}),
    }));
    if (df && dayjs(df, "YYYY-MM-DD", true).isValid()) {
      setDateRange((prev) => [
        dayjs(df, "YYYY-MM-DD"),
        dt && dayjs(dt, "YYYY-MM-DD", true).isValid()
          ? dayjs(dt, "YYYY-MM-DD")
          : prev[1],
      ]);
    } else if (dt && dayjs(dt, "YYYY-MM-DD", true).isValid()) {
      setDateRange((prev) => [prev[0], dayjs(dt, "YYYY-MM-DD")]);
    }
  }, [listFiltersHydrated, searchParams]);

  useEffect(() => {
    if (!listFiltersHydrated) return;
    const t = setTimeout(() => {
      const start = dateRange?.[0]?.format("YYYY-MM-DD");
      const end = dateRange?.[1]?.format("YYYY-MM-DD");
      const today = dayjs().format("YYYY-MM-DD");
      replaceListParams({
        search: searchText.trim() || null,
        page: tableParams.pagination.current > 1 ? tableParams.pagination.current : null,
        pageSize:
          tableParams.pagination.pageSize !== 10
            ? tableParams.pagination.pageSize
            : null,
        sortField:
          tableParams.sortField !== "schedule_instance__date"
            ? tableParams.sortField
            : null,
        sortOrder:
          tableParams.sortOrder !== "ascend" ? tableParams.sortOrder : null,
        dateFrom: start && start !== today ? start : null,
        dateTo: end || null,
      });
    }, 400);
    return () => clearTimeout(t);
  }, [
    listFiltersHydrated,
    searchText,
    tableParams.pagination.current,
    tableParams.pagination.pageSize,
    tableParams.sortField,
    tableParams.sortOrder,
    dateRange,
    replaceListParams,
  ]);

  const debouncedFetch = useCallback(
    debounce(async () => {
      setIsReadyForAnimation(false);
      setLoadingStats(true);
      setLoadingTable(true);
      try {
        const ordering =
          tableParams.sortField && tableParams.sortOrder
            ? `${tableParams.sortOrder === "descend" ? "-" : ""}${
                tableParams.sortField
              }`
            : "schedule_instance__date";
        const startDate =
          dateRange?.[0]?.format("YYYY-MM-DD") || dayjs().format("YYYY-MM-DD");
        const endDate = dateRange?.[1]?.format("YYYY-MM-DD") || undefined;
        const params = {
          page: tableParams.pagination.current,
          page_size: tableParams.pagination.pageSize,
          search: searchText || undefined,
          start_date: startDate,
          end_date: endDate,
          ordering: ordering,
          status: "confirmed",
        };
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined)
        );

        const result = isBookingDemoEnabled()
          ? fetchFixtureBookings(cleanParams)
          : await bookingService.fetchBusinessBookings(cleanParams);

        if (result.success && result.data) {
          setBookings(result.data.results || []);
          setTotalResults(result.data.count || 0);
          setTotalActiveParticipantSpots(
            result.data.summary?.total_participant_spots_in_filter || 0
          );
          setLoadingStats(false);
          const timer = setTimeout(() => setIsReadyForAnimation(true), 50);
          return () => clearTimeout(timer);
        } else {
          message.error(result.error || "Failed to fetch active bookings");
          setBookings([]);
          setTotalResults(0);
          setTotalActiveParticipantSpots(0);
          setLoadingStats(false);
        }
      } catch (error) {
        message.error("An error occurred while fetching active bookings");
        setBookings([]);
        setTotalResults(0);
        setTotalActiveParticipantSpots(0);
        setLoadingStats(false);
      } finally {
        setTimeout(() => setLoadingTable(false), 150);
      }
    }, 300),
    [
      tableParams.pagination.current,
      tableParams.pagination.pageSize,
      tableParams.sortField,
      tableParams.sortOrder,
      searchText,
      dateRange,
      demoEpoch,
    ]
  );

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [debouncedFetch]);

  const handleTableChange = (pagination, filters, sorter) => {
    const resetPage =
      sorter.field !== tableParams.sortField ||
      sorter.order !== tableParams.sortOrder;
    setTableParams((prev) => ({
      ...prev,
      pagination: {
        ...pagination,
        current: resetPage ? 1 : pagination.current,
      },
      sortField: sorter.field,
      sortOrder: sorter.order,
    }));
  };

  const showViewDrawer = useCallback(
    (record) => {
      if (openBookingIdFromQuery) {
        setUrlBookingId(record.id);
      } else {
        setSelectedBookingIdLocal(record.id);
        setIsViewDrawerVisibleLocal(true);
      }
    },
    [openBookingIdFromQuery, setUrlBookingId]
  );

  const handleCloseDrawer = useCallback(() => {
    if (openBookingIdFromQuery) {
      setUrlBookingId(null);
    } else {
      setIsViewDrawerVisibleLocal(false);
      setTimeout(() => setSelectedBookingIdLocal(null), 300);
    }
  }, [openBookingIdFromQuery, setUrlBookingId]);

  const clearFiltersAndRefresh = () => {
    setDateRange([dayjs(), null]);
    setSearchText("");
    setTableParams({
      pagination: { current: 1, pageSize: 10 },
      sortField: "schedule_instance__date",
      sortOrder: "ascend",
    });
    message.success({
      content: "Filters cleared",
      icon: <CheckCircle style={{ color: "#10b981" }} />,
    });
  };

  const handleMarkAttendance = async (booking, attendance) => {
    if (!booking?.id) return;
    if (isBookingDemoEnabled()) {
      patchFixtureBooking(booking.id, { attendance });
      message.success(attendance === "attended" ? "Marked attended" : "Marked no-show");
      debouncedFetch();
      return;
    }
    const result = await bookingService.markAttendance(booking.id, attendance);
    if (result.success) {
      message.success(attendance === "attended" ? "Marked attended" : "Marked no-show");
      debouncedFetch();
    } else {
      message.error("Could not update attendance");
    }
  };

  const handleCancelBooking = async (booking) => {
    if (!booking?.id) return;
    const bookingId = booking.id;
    message.loading({
      content: "Cancelling booking...",
      key: `cancel-${bookingId}`,
      duration: 0,
    });
    try {
      const reason = "Cancelled by business user";
      if (isBookingDemoEnabled()) {
        patchFixtureBooking(bookingId, {
          status: "cancelled",
          cancellation_reason: reason,
        });
        message.success({
          content: "Booking cancelled successfully",
          key: `cancel-${bookingId}`,
        });
        debouncedFetch();
        return;
      }
      const result = await bookingService.businessCancelBooking(
        bookingId,
        reason
      );
      if (result.success) {
        message.success({
          content: "Booking cancelled successfully",
          key: `cancel-${bookingId}`,
        });
        debouncedFetch();
      } else {
        message.error({
          content: result.error || "Failed to cancel booking",
          key: `cancel-${bookingId}`,
        });
      }
    } catch (error) {
      message.error({
        content: "An error occurred during cancellation",
        key: `cancel-${bookingId}`,
      });
    }
  };

  // --- NEW Reschedule Handlers ---
  const handleReschedule = useCallback((booking) => {
    setBookingToReschedule(booking);
    setIsRescheduleModalVisible(true);
  }, []);

  const handleRescheduleSuccess = useCallback(() => {
    message.success("Booking rescheduled successfully!");
    setIsRescheduleModalVisible(false);
    setBookingToReschedule(null);
    debouncedFetch(); // Refresh the booking list
  }, [debouncedFetch]);

  const handleRescheduleCancel = useCallback(() => {
    setIsRescheduleModalVisible(false);
    setBookingToReschedule(null);
  }, []);
  // --- END NEW Handlers ---

  const handleButtonHover = useCallback((isEntering) => {
    const buttonNode = refreshButtonRef.current;
    if (!buttonNode) return;

    const icon = buttonNode.querySelector("lord-icon");
    if (!icon) return;

    try {
      if (isEntering) {
        if (icon.playerInstance) {
          icon.playerInstance.play();
        } else if (icon.player) {
          icon.player.play();
        } else {
          icon.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
        }
      } else {
        if (icon.playerInstance) {
          icon.playerInstance.pause();
          icon.playerInstance.goToFirstFrame();
        } else if (icon.player) {
          icon.player.pause();
          icon.player.goToFirstFrame();
        } else {
          icon.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
        }
      }
    } catch (error) {
      console.error("Lordicon animation failed:", error);
    }
  }, []);

  const metricsPeriodLabel = useMemo(
    () => formatDayjsRangeBadge(dateRange?.[0], dateRange?.[1]),
    [dateRange],
  );

  return (
    <DashboardWrapper $noPadding={noWrapperPadding}>
        <DashboardHeader>
          <div>
            <PageTitle>Active Bookings</PageTitle>
          </div>
          <BookingDemoToggle onChange={() => setDemoEpoch((n) => n + 1)} />
        </DashboardHeader>

        <Divider />

        <StatsGrid>
          <StatCard>
            {loadingStats ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
              <>
                <div>
                  <StatCardHeader>
                    <IconContainer background="rgba(59, 130, 246, 0.1)">
                      <UsersIcon size={20} color={colors.info} />
                    </IconContainer>
                    <MetricPeriodBadge>{metricsPeriodLabel}</MetricPeriodBadge>
                  </StatCardHeader>
                  <StatLabel>Active Guest Spots</StatLabel>
                </div>
                <StatValue>
                  <NumberFlow
                    key={
                      loadingStats
                        ? "active-spots-loading"
                        : "active-spots-loaded"
                    }
                    value={
                      isReadyForAnimation ? totalActiveParticipantSpots : 0
                    }
                    duration={800}
                    numberFormatOptions={{ maximumFractionDigits: 0 }}
                  />
                </StatValue>
              </>
            )}
          </StatCard>
        </StatsGrid>

        <SearchFilterBar>
          <SearchInput
            placeholder="Search by reference ID, user, or experience..."
            prefix={<Search size={16} color="#9ca3af" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <div style={{ display: "flex", gap: "8px", flexWrap: "nowrap" }}>
            <ResponsiveDateRangePicker
              isMobile={!screens.lg}
              format="MMM D, YYYY"
              onChange={setDateRange}
              value={dateRange}
              placeholder="Start Date – End Date"
              renderDesktop={(rp) => (
                <StyledRangePicker
                  {...rp}
                  format="MMM D, YYYY"
                  allowClear
                  placeholder={["Start Date", "End Date"]}
                />
              )}
            />
            <ActionButton
              ref={refreshButtonRef}
              onMouseEnter={() => handleButtonHover(true)}
              onMouseLeave={() => handleButtonHover(false)}
              icon={
                <LordIcon
                  src="https://cdn.lordicon.com/valwmkhs.json"
                  colors="primary:#666,secondary:#666"
                  size="20px"
                  trigger="hover"
                  playOnLoad={false}
                />
              }
              onClick={clearFiltersAndRefresh}
              loading={loadingTable}
              title="Clear Filters & Refresh"
            >
              {screens.xs ? "" : "Clear & Refresh"}
            </ActionButton>
          </div>
        </SearchFilterBar>

        <TableSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {!loadingTable && bookings.length === 0 && (
            <EmptyStateContainer>
              <EmptyStateIcon>
                <LordIcon
                  src="https://cdn.lordicon.com/uoljexdg.json"
                  trigger="in"
                  colors="primary:#94a3b8"
                  style={{ width: 40, height: 40 }}
                />
              </EmptyStateIcon>
              <EmptyStateText>No Bookings Found</EmptyStateText>
              <EmptyStateSubtext>
                You don't currently have any active bookings matching your
                filters.
              </EmptyStateSubtext>
            </EmptyStateContainer>
          )}
          {(bookings.length > 0 || loadingTable) &&
            (isMobile ? (
              <MobileActiveBookings
                data={bookings}
                showViewDrawer={showViewDrawer}
                handleCancel={handleCancelBooking}
                handleReschedule={handleReschedule}
                handleMarkAttendance={handleMarkAttendance}
                loading={loadingTable}
              />
            ) : (
              <DesktopActiveBookings
                data={bookings}
                showViewDrawer={showViewDrawer}
                handleCancel={handleCancelBooking}
                handleReschedule={handleReschedule}
                handleMarkAttendance={handleMarkAttendance}
                pagination={{
                  ...tableParams.pagination,
                  total: totalResults,
                }}
                onChange={handleTableChange}
                sortField={tableParams.sortField}
                sortOrder={tableParams.sortOrder}
                loading={loadingTable}
              />
            ))}
        </TableSection>

        <BookingDetailsDrawer
          visible={isViewDrawerVisible}
          onClose={handleCloseDrawer}
          bookingId={selectedBookingId}
          onBookingUpdate={() => debouncedFetch()}
          onBookingCancel={() => debouncedFetch()}
          onReschedule={handleReschedule}
        />

        {/* New Reschedule Modal */}
        <RescheduleBookingModal
          visible={isRescheduleModalVisible}
          booking={bookingToReschedule}
          onSuccess={handleRescheduleSuccess}
          onCancel={handleRescheduleCancel}
        />
      </DashboardWrapper>
  );
};

export default ActiveBookings;
