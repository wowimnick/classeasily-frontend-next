"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import styled from "styled-components";
import {
  Input,
  Button,
  DatePicker,
  Card,
  Typography,
  Spin,
  Select,
  Grid,
  Skeleton,
  Empty,
  Divider,
} from "antd";
import message from "@/lib/message";
import {
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Calendar,
  History,
  Users as UsersIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
import debounce from "lodash/debounce";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { bookingService } from "@/services/apiService";
import DesktopBookingHistory from "./DesktopBookingHistory";
import MobileBookingHistory from "./MobileBookingHistory";
import BookingDetailsDrawer from "./BookingDetailsDrawer";
import { LordIcon } from "@/services/ReactUtils";
import { MobileDateRangePicker } from "@/components/common/mobile/MobilePickers";
import {
  MetricPeriodBadge,
  formatDayjsRangeBadge,
} from "../../shared/MetricPeriodBadge";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
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
  chart: {
    blue: "#3b82f6",
    green: "#10b981",
    purple: "#8b5cf6",
    orange: "#f97316",
    red: "#ef4444",
  },
};

const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${(p) => (p.$noPadding ? "0" : "24px")};
  background-color: #fff;
  min-height: 100vh;
  @media (max-width: 768px) {
    padding: ${(p) => (p.$noPadding ? "0" : "16px")};
    gap: 0px;
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

const HeaderSubtitle = styled(Text)`
  font-size: 15px;
  color: ${colors.textSecondary};
  display: block;
  line-height: 1.4;
  @media (max-width: 768px) {
    font-size: 14px;
  }
  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  max-width: 500px;
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

const BookingHistory = forwardRef((props, ref) => {
  const { noWrapperPadding, openBookingIdFromQuery = false } = props || {};
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [isViewDrawerVisible, setIsViewDrawerVisible] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [totalCompletedSpots, setTotalCompletedSpots] = useState(0);
  const [totalCancelledSpots, setTotalCancelledSpots] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);

  const [tableParams, setTableParams] = useState({
    pagination: { current: 1, pageSize: 10 },
    sortField: "booking_date",
    sortOrder: "descend",
  });
  const [totalResults, setTotalResults] = useState(0);

  const screens = useBreakpoint();
  const mainContentRef = useRef(null);
  const refreshButtonRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getTargetElement: () => mainContentRef.current,
  }));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 767);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
            : "-booking_date";

        const params = {
          page: tableParams.pagination.current,
          page_size: tableParams.pagination.pageSize,
          search: searchText || undefined,
          start_date: dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
          end_date: dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
          ordering: ordering,
          status: "completed,cancelled",
        };

        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined)
        );
        const result = await bookingService.fetchBusinessBookings(cleanParams);

        if (result.success && result.data) {
          setBookings(result.data.results || []);
          setTotalResults(result.data.count || 0);

          const calculatedCompletedSpots = (result.data.results || [])
            .filter((b) => b.status === "completed")
            .reduce((acc, curr) => acc + (curr.participants || 0), 0);
          const calculatedCancelledSpots = (result.data.results || [])
            .filter((b) => b.status === "cancelled")
            .reduce((acc, curr) => acc + (curr.participants || 0), 0);

          setTotalCompletedSpots(calculatedCompletedSpots);
          setTotalCancelledSpots(calculatedCancelledSpots);

          setLoadingStats(false);
          const timer = setTimeout(() => setIsReadyForAnimation(true), 50);
          return () => clearTimeout(timer);
        } else {
          message.error(result.error || "Failed to fetch booking history");
          setBookings([]);
          setTotalResults(0);
          setTotalCompletedSpots(0);
          setTotalCancelledSpots(0);
          setLoadingStats(false);
        }
      } catch (error) {
        message.error("An error occurred while fetching booking history");
        setBookings([]);
        setTotalResults(0);
        setTotalCompletedSpots(0);
        setTotalCancelledSpots(0);
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
    ]
  );

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [debouncedFetch]);

  useEffect(() => {
    if (!openBookingIdFromQuery) return;
    const raw = searchParams.get("bookingId");
    if (!raw) return;
    const numericId = Number(raw);
    if (!Number.isInteger(numericId) || numericId <= 0) return;
    setSelectedBookingId(numericId);
    setIsViewDrawerVisible(true);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("bookingId");
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
  }, [openBookingIdFromQuery, searchParams, pathname, router]);

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

  const showViewDrawer = useCallback((record) => {
    setSelectedBookingId(record.id);
    setIsViewDrawerVisible(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsViewDrawerVisible(false);
    setTimeout(() => setSelectedBookingId(null), 300);
  }, []);

  const clearFiltersAndRefresh = () => {
    setDateRange(null);
    setSearchText("");
    setTableParams({
      pagination: { current: 1, pageSize: 10 },
      sortField: "booking_date",
      sortOrder: "descend",
    });
    message.success({
      content: "Filters cleared",
      icon: <CheckCircle style={{ color: "#10b981" }} />,
    });
  };

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
    <DashboardWrapper ref={mainContentRef} $noPadding={noWrapperPadding}>
        <DashboardHeader>
          <div>
            <PageTitle>Booking History</PageTitle>
            <HeaderSubtitle>
              View past completed and cancelled bookings
            </HeaderSubtitle>
          </div>
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
                    <IconContainer background="rgba(16, 185, 129, 0.1)">
                      <UsersIcon size={20} color={colors.success} />
                    </IconContainer>
                    <MetricPeriodBadge>{metricsPeriodLabel}</MetricPeriodBadge>
                  </StatCardHeader>
                  <StatLabel>Completed Guest Spots</StatLabel>
                </div>
                <StatValue>
                  <NumberFlow
                    key={
                      loadingStats
                        ? "completed-spots-loading"
                        : "completed-spots-loaded"
                    }
                    value={isReadyForAnimation ? totalCompletedSpots : 0}
                    duration={800}
                    numberFormatOptions={{ maximumFractionDigits: 0 }}
                  />
                </StatValue>
              </>
            )}
          </StatCard>
          <StatCard>
            {loadingStats ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
              <>
                <div>
                  <StatCardHeader>
                    <IconContainer background="rgba(239, 68, 68, 0.1)">
                      <UsersIcon size={20} color={colors.error} />
                    </IconContainer>
                    <MetricPeriodBadge>{metricsPeriodLabel}</MetricPeriodBadge>
                  </StatCardHeader>
                  <StatLabel>Cancelled Guest Spots</StatLabel>
                </div>
                <StatValue>
                  <NumberFlow
                    key={
                      loadingStats
                        ? "cancelled-spots-loading"
                        : "cancelled-spots-loaded"
                    }
                    value={isReadyForAnimation ? totalCancelledSpots : 0}
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
            {!screens.lg ? (
              <MobileDateRangePicker
                format="MMM D, YYYY"
                onChange={setDateRange}
                value={dateRange}
                placeholder="Booked From – Booked To"
              />
            ) : (
              <StyledRangePicker
                format="MMM D, YYYY"
                onChange={setDateRange}
                value={dateRange}
                allowClear
                placeholder={["Booked From", "Booked To"]}
              />
            )}
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
                You don't currently have any historical bookings matching your
                filters.
              </EmptyStateSubtext>
            </EmptyStateContainer>
          )}
          {(bookings.length > 0 || loadingTable) &&
            (isMobile ? (
              <MobileBookingHistory
                data={bookings}
                showViewDrawer={showViewDrawer}
                loading={loadingTable}
              />
            ) : (
              <DesktopBookingHistory
                data={bookings}
                showViewDrawer={showViewDrawer}
                pagination={{ ...tableParams.pagination, total: totalResults }}
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
        />
      </DashboardWrapper>
  );
});

export default BookingHistory;
