"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { Table, Card, Input, Select, Button, ConfigProvider, Checkbox, Avatar, Tag, Space, Tooltip, Dropdown, Menu, Divider, Modal, Grid, Empty, Badge, Alert, Tabs, Popconfirm, Typography, Statistic, Skeleton, List,  } from 'antd';
import message from '@/lib/message';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Zap,
  MapPin,
  Star,
  Award,
  Clock,
  Mail,
  AlertCircle,
  Trash2,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  Link as LinkIcon,
  Tag as TagIcon,
  Phone,
  Globe,
  BarChart2,
  Briefcase,
  Building,
  CheckCircle,
  Calendar,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  UserCheck,
  Users,
  Hash,
  ShieldAlert,
  BookOpen,
  Upload,
  FileUp,
  Building2,
} from "lucide-react";
import { businessManagementService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import {
  GlobalLoaderWithInlineStyles,
  GlobalLoaderWithoutInlineStyles,
} from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text, Title, Paragraph, Link } = Typography;

// --- STYLING & THEME (ADAPTED FROM BOOKINGSLIST) ---
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
  textTertiary: "#94a3b8",
};

// --- MAIN PAGE COMPONENTS ---
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
  min-height: 100vh;
  @media (max-width: 768px) {
    padding: 16px;
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
  margin: 0;
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const HeaderSubtitle = styled(Text)`
  font-size: 15px;
  color: ${colors.textSecondary};
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const RefreshButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 1px solid ${colors.border};
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  &:hover {
    color: ${colors.primary};
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
    transform: translateY(-1px);
  }
  @media (max-width: 768px) {
    flex: 1;
  }
`;

// --- TABLE SECTION ---
const TableSection = styled(motion.div)`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
  border: 1px solid ${colors.border};
`;

const TableHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${colors.border};
  background: white;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const TableTitle = styled(Title).attrs({ level: 4 })`
  margin: 0 0 4px 0 !important;
  color: ${colors.textPrimary};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  svg {
    color: ${colors.primary};
    width: 18px;
    height: 18px;
  }
  @media (max-width: 768px) {
    font-size: 16px !important;
  }
`;

const TableDescription = styled(Paragraph)`
  margin: 0 !important;
  color: ${colors.textSecondary};
  font-size: 14px;
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const FilterBar = styled.div`
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  border-bottom: 1px solid ${colors.border};
  @media (max-width: 768px) {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchFilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: #fafbfc;
    border-bottom: 1px solid ${colors.border};
    font-weight: 600;
    color: ${colors.textPrimary};
    font-size: 13px;
    padding: 16px 24px;
  }
  .ant-table-tbody > tr > td {
    padding: 16px 24px;
    border-bottom: 1px solid ${colors.border};
    font-size: 14px;
  }
  .ant-table-tbody > tr:hover > td {
    background: #fafcff;
  }
  .ant-empty {
    padding: 40px 20px;
  }
`;

// --- DRAWER COMPONENTS ---
const DrawerOverlay = styled(motion.div)`
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
  z-index: 1050;
  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end;
  }
`;

const DrawerContainer = styled(motion.div)`
  width: 100%;
  max-width: 800px;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  @media (max-width: 768px) {
    height: auto;
    max-height: 85vh;
    border-radius: 24px 24px 0 0;
  }
`;

const DrawerCloseButton = styled(motion.button)`
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f0f0f0;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: #717171;
  &:hover {
    background: #e0e0e0;
  }
`;

const DrawerHeaderSection = styled.header`
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
`;

const DrawerContent = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: ${colors.lightBg};
  padding: 24px;

  @media (max-width: 768px) {
    padding: 0;
  }
`;

const DrawerHeader = styled.div`
  background-color: white;
  padding: 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BusinessAvatar = styled(Avatar)`
  width: 60px;
  height: 60px;
  font-size: 28px;
  background: ${colors.primary};
  color: white;
  border-radius: 12px;
`;

const InfoGroup = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0;
  }
  @media (max-width: 768px) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    margin-bottom: 12px;
  }
`;

const InfoGroupTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  svg {
    width: 18px;
    height: 18px;
    color: ${colors.primary};
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const InfoIcon = styled.div`
  color: ${colors.textSecondary};
  margin-top: 2px;
  svg {
    width: 16px;
    height: 16px;
  }
`;

const InfoContent = styled.div``;

const InfoLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  margin-bottom: 2px;
`;

const InfoValue = styled(Paragraph)`
  &.ant-typography {
    font-weight: 500;
    color: ${colors.textPrimary};
    margin-bottom: 0 !important;
  }
`;
const HoursInfo = styled.div`
  font-size: 0.95rem;
  color: #4a5568;
  line-height: 1.7;
`;
const HoursLine = styled.div`
  display: flex;
  justify-content: space-between;
  max-width: 300px;
`;
const HoursDays = styled.span`
  font-weight: 600;
  color: #1a1a1a;
`;
const HoursTimes = styled.span`
  font-weight: 500;
`;

// --- MOBILE COMPONENTS ---
const MobileCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`;
const MobileCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const MobileCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const MobileCardLabel = styled(Text)`
  font-size: 12px;
  color: ${colors.textSecondary};
  font-weight: 500;
`;
const FeaturedTag = styled(Tag)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
`;

const socialIcons = {
  facebook: <Facebook />,
  twitter: <Twitter />,
  instagram: <Instagram />,
  linkedin: <Linkedin />,
  youtube: <Youtube />,
};

// --- UTILITIES ---
const formatDate = (dateString) =>
  dateString ? dayjs(dateString).format("MMM D, YYYY") : "N/A";

const formatTime = (timeString) => {
  if (!timeString) return "N/A";
  try {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return timeString;
  }
};

const formatBusinessHours = (hours) => {
  if (!hours || !Array.isArray(hours) || hours.length === 0) return [];
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const groupedByTime = hours.reduce((acc, day) => {
    const timeRange = day.isOpen
      ? `${formatTime(day.open)} - ${formatTime(day.close)}`
      : "Closed";
    if (!acc[timeRange]) acc[timeRange] = [];
    acc[timeRange].push(day.day);
    return acc;
  }, {});

  const formattedLines = [];
  for (const timeRange in groupedByTime) {
    const days = groupedByTime[timeRange].sort(
      (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
    );
    let currentGroup = [],
      dayGroups = [];
    days.forEach((day, index) => {
      if (
        index > 0 &&
        dayOrder.indexOf(day) === dayOrder.indexOf(days[index - 1]) + 1
      ) {
        currentGroup.push(day);
      } else {
        if (currentGroup.length > 0) dayGroups.push(currentGroup);
        currentGroup = [day];
      }
    });
    dayGroups.push(currentGroup);
    const dayString = dayGroups
      .map((group) =>
        group.length > 2
          ? `${group[0]} - ${group[group.length - 1]}`
          : group.join(", ")
      )
      .join(", ");
    formattedLines.push({ days: dayString, times: timeRange });
  }
  return formattedLines;
};

// --- DETAIL DRAWER ---
const BusinessDetailDrawerContent = ({
  business,
  isActionLoading,
  onAction,
}) => {
  if (!business) {
    return (
      <Empty description="No business selected" style={{ paddingTop: 100 }} />
    );
  }

  const { handleDeleteBusiness, handleToggleActive, handleFeatureBusiness } =
    onAction;

  const {
    businessName,
    businessType,
    businessCity,
    businessState,
    verificationStatus,
    average_rating,
    review_count,
    createdAt,
    businessDescription,
    studentContactPhone,
    studentContactEmail,
    website,
    social_media_links,
    isActive,
    featured,
    owner_email,
    businessHours,
  } = business;

  const location = [businessCity, businessState].filter(Boolean).join(", ");
  const formattedHours = formatBusinessHours(businessHours);

  return (
    <>
      <DrawerHeader>
        <BusinessAvatar src={business.business_image_medium_url}>
          {businessName?.[0]}
        </BusinessAvatar>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {businessName}
          </Title>
          <Text type="secondary">{location}</Text>
        </div>
      </DrawerHeader>
      <>
        <InfoGroup>
          <InfoGroupTitle>
            <ShieldAlert /> Admin Actions
          </InfoGroupTitle>
          <Space wrap>
            <Popconfirm
              title={`Permanently delete ${businessName}?`}
              onConfirm={() => handleDeleteBusiness(business.businessId)}
              okText="Delete"
              okButtonProps={{ danger: true, loading: isActionLoading }}
            >
              <Button
                danger
                icon={<Trash2 size={16} />}
                loading={isActionLoading}
                key={`btn-${isActionLoading}`}>
                Delete
              </Button>
            </Popconfirm>
            <Button
              icon={
                isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />
              }
              onClick={() => handleToggleActive(business.businessId, !isActive)}
              loading={isActionLoading}
              key={`btn-${isActionLoading}`}>
              {isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button
              type="primary"
              ghost={featured}
              icon={<Award size={16} />}
              onClick={() =>
                handleFeatureBusiness(business.businessId, !featured)
              }
              loading={isActionLoading}
              key={`btn-${isActionLoading}`}>
              {featured ? "Unfeature" : "Feature"}
            </Button>
          </Space>
        </InfoGroup>

        <InfoGroup>
          <InfoGroupTitle>
            <Hash /> Business Summary
          </InfoGroupTitle>
          <InfoGrid>
            <InfoItem>
              <InfoIcon>
                <UserCheck />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Owner Account</InfoLabel>
                <InfoValue copyable>{owner_email || "N/A"}</InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>
                <Building />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Business Type</InfoLabel>
                <InfoValue>
                  {businessType
                    ?.replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>
                <Star />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Rating</InfoLabel>
                <InfoValue>
                  {parseFloat(average_rating || 0).toFixed(1)} (
                  {review_count || 0} Reviews)
                </InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>
                <Calendar />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Member Since</InfoLabel>
                <InfoValue>{formatDate(createdAt)}</InfoValue>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>
                <CheckCircle />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Verification Status</InfoLabel>
                <InfoValue>
                  <Tag
                    color={
                      verificationStatus === "verified" ? "success" : "warning"
                    }
                  >
                    {verificationStatus?.toUpperCase()}
                  </Tag>
                </InfoValue>
              </InfoContent>
            </InfoItem>
            {businessDescription && (
              <InfoItem style={{ gridColumn: "1 / -1" }}>
                <InfoIcon>
                  <InfoIcon />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>About {businessName}</InfoLabel>
                  <InfoValue>{businessDescription}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}
          </InfoGrid>
        </InfoGroup>

        {formattedHours.length > 0 && (
          <InfoGroup>
            <InfoGroupTitle>
              <Clock /> Hours of Operation
            </InfoGroupTitle>
            <HoursInfo>
              {formattedHours.map((line, index) => (
                <HoursLine key={index}>
                  <HoursDays>{line.days}</HoursDays>
                  <HoursTimes>{line.times}</HoursTimes>
                </HoursLine>
              ))}
            </HoursInfo>
          </InfoGroup>
        )}

        <InfoGroup>
          <InfoGroupTitle>
            <Phone /> Contact Information
          </InfoGroupTitle>
          <InfoGrid>
            {studentContactPhone && (
              <InfoItem>
                <InfoIcon>
                  <Phone />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Phone</InfoLabel>
                  <InfoValue>{studentContactPhone}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}
            {studentContactEmail && (
              <InfoItem>
                <InfoIcon>
                  <Mail />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Email</InfoLabel>
                  <InfoValue as="a" href={`mailto:${studentContactEmail}`}>
                    {studentContactEmail}
                  </InfoValue>
                </InfoContent>
              </InfoItem>
            )}
            {website && (
              <InfoItem>
                <InfoIcon>
                  <Globe />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Website</InfoLabel>
                  <InfoValue
                    as="a"
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {website}
                  </InfoValue>
                </InfoContent>
              </InfoItem>
            )}
          </InfoGrid>
        </InfoGroup>

        {social_media_links &&
          Object.values(social_media_links).some((v) => v) && (
            <InfoGroup>
              <InfoGroupTitle>
                <Globe /> Social Media
              </InfoGroupTitle>
              <Space wrap>
                {Object.entries(social_media_links).map(
                  ([platform, url]) =>
                    url &&
                    socialIcons[platform] && (
                      <Button
                        key={platform}
                        icon={socialIcons[platform]}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Button>
                    )
                )}
              </Space>
            </InfoGroup>
          )}
      </>
    </>
  );
};

const DetailDrawerModal = ({
  isVisible,
  onClose,
  business,
  isLoading,
  isMobile,
  onAction,
  isActionLoading,
}) => {
  const modalVariants = isMobile
    ? {
        hidden: { y: "100%", opacity: 0 },
        visible: {
          y: 0,
          opacity: 1,
          transition: { type: "spring", damping: 30, stiffness: 300 },
        },
        exit: {
          y: "100%",
          opacity: 0,
          transition: { duration: 0.2, ease: "easeIn" },
        },
      }
    : {
        hidden: { scale: 0.95, opacity: 0 },
        visible: {
          scale: 1,
          opacity: 1,
          transition: { duration: 0.2, ease: "easeOut" },
        },
        exit: {
          scale: 0.95,
          opacity: 0,
          transition: { duration: 0.2, ease: "easeIn" },
        },
      };

  const drawerComponent = (
    <AnimatePresence>
      {isVisible && (
        <DrawerOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <DrawerContainer
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <DrawerHeaderSection>
              <Space align="center" size={12}>
                <Building size={20} style={{ color: colors.primary }} />
                <span
                  style={{ fontWeight: 700, fontSize: "18px", color: "#222" }}
                >
                  Business: {business?.businessName}
                </span>
              </Space>
              <DrawerCloseButton whileTap={{ scale: 0.9 }} onClick={onClose}>
                <X size={20} />
              </DrawerCloseButton>
            </DrawerHeaderSection>
            <DrawerContent>
              {isLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "350px",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <GlobalLoaderWithoutInlineStyles />
                  <Text type="secondary">Loading details...</Text>
                </div>
              ) : (
                <BusinessDetailDrawerContent
                  business={business}
                  isActionLoading={isActionLoading}
                  onAction={onAction}
                />
              )}
            </DrawerContent>
          </DrawerContainer>
        </DrawerOverlay>
      )}
    </AnimatePresence>
  );
  return ReactDOM.createPortal(drawerComponent, document.body);
};

const ImportLogPre = styled.pre`
  margin: 0;
  padding: 12px;
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  max-height: 280px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const BusinessListings = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importBusinesses, setImportBusinesses] = useState([]);
  const [importBusinessesLoading, setImportBusinessesLoading] = useState(false);
  const [importSelectedBusinessId, setImportSelectedBusinessId] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const [filterParams, setFilterParams] = useState({
    search: "",
    category: "all",
    status: "all",
    featured: false,
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [sortedInfo, setSortedInfo] = useState({
    order: "descend",
    columnKey: "createdAt",
  });

  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const searchInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const handleFilterChange = (updates) => {
    setFilterParams((prev) => ({ ...prev, ...updates }));
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const fetchBusinesses = useCallback(
    async (currentFilters, currentPagination, currentSorter) => {
      setLoading(true);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        const apiParams = {
          page: currentPagination.current,
          page_size: currentPagination.pageSize,
          search: currentFilters.search,
          category:
            currentFilters.category === "all"
              ? undefined
              : currentFilters.category,
          status:
            currentFilters.status === "all" ? undefined : currentFilters.status,
          featured: currentFilters.featured ? true : undefined,
          ordering:
            currentSorter.columnKey && currentSorter.order
              ? `${currentSorter.order === "descend" ? "-" : ""}${
                  currentSorter.columnKey
                }`
              : "-createdAt",
        };
        const response = await businessManagementService.getBusinesses(
          apiParams,
          { signal }
        );
        if (response.success && response.data) {
          setBusinesses(response.data.results);
          setPagination((prev) => ({
            ...prev,
            total: response.data.count,
            current: currentPagination.current,
            pageSize: currentPagination.pageSize,
          }));
        } else if (!signal.aborted) {
          message.error(response.error || "Failed to load businesses");
        }
      } catch (error) {
        if (error.name !== "AbortError")
          message.error("An error occurred while fetching businesses");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchBusinesses(filterParams, pagination, sortedInfo);
    }, 300);
    return () => clearTimeout(handler);
  }, [filterParams.search]);

  useEffect(() => {
    fetchBusinesses(filterParams, pagination, sortedInfo);
  }, [
    filterParams.category,
    filterParams.status,
    filterParams.featured,
    pagination.current,
    pagination.pageSize,
    sortedInfo,
  ]);

  const handleTableChange = (p, f, sorter) => {
    setPagination(p);
    setSortedInfo(sorter);
  };

  const handleAction = async (actionPromise, successMessage, errorMessage) => {
    setIsActionLoading(true);
    try {
      const response = await actionPromise;
      if (response.success) {
        message.success(successMessage);
        fetchBusinesses(filterParams, pagination, sortedInfo); // Refresh list
        if (
          isDetailDrawerVisible &&
          selectedBusiness &&
          response.data?.businessId === selectedBusiness.businessId
        ) {
          const detailResponse =
            await businessManagementService.getBusinessDetails(
              selectedBusiness.businessId
            );
          if (detailResponse.success) setSelectedBusiness(detailResponse.data);
        }
      } else {
        message.error(response.error || errorMessage);
      }
    } catch (e) {
      message.error(errorMessage);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleActive = (businessId, isActive) =>
    handleAction(
      businessManagementService.updateBusiness(businessId, { isActive }),
      `Business ${isActive ? "activated" : "deactivated"}`,
      "Failed to update status"
    );
  const handleFeatureBusiness = (businessId, isFeatured) =>
    handleAction(
      businessManagementService.toggleFeatureStatus(businessId, isFeatured),
      `Business ${isFeatured ? "featured" : "unfeatured"}`,
      "Failed to update feature status"
    );
  const handleDeleteBusiness = (businessId) => {
    handleAction(
      businessManagementService.deleteBusiness(businessId),
      `Business deleted`,
      "Failed to delete business"
    );
    setIsDetailDrawerVisible(false);
  };

  const showBusinessDetails = async (business) => {
    if (isDetailDrawerVisible) return;
    setIsDetailDrawerVisible(true);
    setDetailsLoading(true);
    setSelectedBusiness(business);
    try {
      const response = await businessManagementService.getBusinessDetails(
        business.businessId
      );
      if (response.success) {
        setSelectedBusiness(response.data);
      } else message.error(response.error || "Failed to fetch details");
    } catch (e) {
      message.error("Error fetching details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const refreshData = () => {
    fetchBusinesses(filterParams, { ...pagination, current: 1 }, sortedInfo);
  };

  useEffect(() => {
    if (importModalOpen && importBusinesses.length === 0) {
      setImportBusinessesLoading(true);
      businessManagementService
        .getBusinesses({ page_size: 500 })
        .then((res) => {
          if (res.success && res.data) {
            const list = res.data.results || res.data;
            setImportBusinesses(Array.isArray(list) ? list : []);
            if (list.length && !importSelectedBusinessId)
              setImportSelectedBusinessId(list[0].businessId ?? list[0].id);
          }
        })
        .finally(() => setImportBusinessesLoading(false));
    }
  }, [importModalOpen]);

  const handleImportFileChange = (e) => {
    const f = e.target.files?.[0];
    setImportFile(f || null);
    setImportResult(null);
  };

  const handleRunImportReviews = async () => {
    if (!importSelectedBusinessId) {
      message.error("Please select a business.");
      return;
    }
    if (!importFile) {
      message.error("Please choose a CSV or JSON file.");
      return;
    }
    const ext = (importFile.name || "").toLowerCase();
    if (!ext.endsWith(".csv") && !ext.endsWith(".json")) {
      message.error("File must be .csv or .json");
      return;
    }
    setImporting(true);
    setImportResult(null);
    const res = await businessManagementService.importGoogleReviews(
      importSelectedBusinessId,
      importFile
    );
    setImporting(false);
    setImportResult(res);
    if (res.success) {
      message.success("Import completed.");
      refreshData();
    } else {
      message.error(res.error || "Import failed.");
    }
  };

  const importBusinessOptions = importBusinesses.map((b) => ({
    value: b.businessId ?? b.id,
    label: b.businessName
      ? `${b.businessName} (ID: ${b.businessId ?? b.id})`
      : `Business ${b.businessId ?? b.id}`,
  }));

  const columns = [
    {
      title: "Business",
      key: "businessName",
      dataIndex: "businessName",
      sorter: true,
      sortOrder: sortedInfo.columnKey === "businessName" && sortedInfo.order,
      width: 300,
      render: (_, b) => (
        <Space>
          <Avatar src={b.business_image_thumb_url} size={40}>
            {b.businessName?.[0]}
          </Avatar>
          <div>
            <Text strong>{b.businessName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              <MapPin size={12} style={{ marginRight: 4 }} />
              {b.businessCity}, {b.businessState}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Owner",
      dataIndex: "owner_email",
      key: "owner_email",
      width: 220,
      render: (email) =>
        email ? (
          <a href={`mailto:${email}`} style={{ color: colors.info }}>
            {email}
          </a>
        ) : (
          <Text type="secondary">N/A</Text>
        ),
    },
    {
      title: "Rating",
      key: "rating",
      dataIndex: "rating",
      sorter: true,
      sortOrder: sortedInfo.columnKey === "rating" && sortedInfo.order,
      width: 130,
      render: (rating, b) => {
        const platform = b.review_count || 0;
        const google = b.google_review_count || 0;
        const total = platform + google;
        return (
          <Space>
            <Star size={15} fill="#f59e0b" color="#f59e0b" />
            <span>{rating || 0}</span>
            <Text type="secondary">
              ({total} {total === 1 ? "review" : "reviews"}
              {google > 0 ? `, ${platform} platform + ${google} Google` : ""})
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      width: 150,
      render: (_, b) => (
        <Space direction="vertical" size={2}>
          <Badge
            status={b.isActive ? "success" : "error"}
            text={b.isActive ? "Active" : "Inactive"}
          />
          {b.featured && (
            <FeaturedTag color="gold">
              <Award size={12} />
              Featured
            </FeaturedTag>
          )}
          {b.verificationStatus === "verified" && (
            <Tag color="success" icon={<Check size={12} />}>
              Verified
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      align: "right",
      render: (_, b) => (
        <Button icon={<Eye size={14} />} onClick={() => showBusinessDetails(b)}>
          Details
        </Button>
      ),
    },
  ];

  const renderMobileCard = (b) => (
    <MobileCard key={b.businessId}>
      <MobileCardContent>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "12px",
          }}
        >
          <Space>
            <Avatar src={b.business_image_thumb_url} size={48}>
              {b.businessName?.[0]}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: "14px", display: "block" }}>
                {b.businessName}
              </Text>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                <MapPin size={12} style={{ marginRight: 4 }} />
                {b.businessCity}, {b.businessState}
              </Text>
            </div>
          </Space>
          <Badge
            status={b.isActive ? "success" : "error"}
            text={b.isActive ? "Active" : "Inactive"}
          />
        </div>
        <MobileCardRow>
          <MobileCardLabel>Owner</MobileCardLabel>
          <Text style={{ fontSize: 13 }} copyable={{ text: b.owner_email }}>
            {b.owner_email || "N/A"}
          </Text>
        </MobileCardRow>
        <MobileCardRow>
          <MobileCardLabel>Rating</MobileCardLabel>
          <Space>
            <Star size={14} fill="#f59e0b" color="#f59e0b" />
            {b.rating || 0} ({b.review_count || 0})
          </Space>
        </MobileCardRow>
        <div
          style={{
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          <Button
            type="primary"
            size="middle"
            icon={<Eye size={14} />}
            onClick={() => showBusinessDetails(b)}
            block
          >
            View Details
          </Button>
        </div>
      </MobileCardContent>
    </MobileCard>
  );

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>Business Management</PageTitle>
            <HeaderSubtitle>
              Monitor, manage, and feature business listings on the platform.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <RefreshButton
              icon={<Upload size={18} />}
              onClick={() => setImportModalOpen(true)}
            >
              {!isMobile && "Import Google Reviews"}
            </RefreshButton>
            <RefreshButton
              icon={
                <LordIcon
                  src="https://cdn.lordicon.com/valwmkhs.json"
                  colors="primary:#666,secondary:#666"
                  size="20px"
                  trigger="hover"
                />
              }
              onClick={refreshData}
              loading={loading}
            >
              {!isMobile && "Refresh"}
            </RefreshButton>
          </ActionButtonsContainer>
        </DashboardHeader>

        <Divider />

        <TableSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <TableHeader>
            <TableTitle>
              <Building /> All Businesses
            </TableTitle>
            <TableDescription>
              Complete list of businesses with filtering and search
              capabilities.
            </TableDescription>
          </TableHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input
                ref={searchInputRef}
                placeholder="Search name, email, city..."
                allowClear
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                style={{ width: isMobile ? "100%" : 280 }}
              />
              <Select
                value={filterParams.status}
                style={{ width: isMobile ? "100%" : 180 }}
                onChange={(val) => handleFilterChange({ status: val })}
              >
                <Option value="all">All Statuses</Option>
                <Option value="active">Active</Option>
                <Option value="no_schedules">No Schedules</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="pending">Pending</Option>
              </Select>
              <Checkbox
                onChange={(e) =>
                  handleFilterChange({ featured: e.target.checked })
                }
                checked={filterParams.featured}
              >
                Featured Only
              </Checkbox>
            </SearchFilterContainer>
          </FilterBar>

          {isMobile ? (
            <div style={{ padding: "8px" }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : businesses.length > 0 ? (
                <>
                  {businesses.map(renderMobileCard)}
                  {pagination.total > pagination.pageSize && (
                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                      <Button
                        onClick={() =>
                          handleTableChange({
                            ...pagination,
                            current: pagination.current + 1,
                          })
                        }
                        disabled={
                          pagination.current * pagination.pageSize >=
                          pagination.total
                        }
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Empty description="No businesses found." />
              )}
            </div>
          ) : (
            <StyledTable
              columns={columns}
              dataSource={businesses}
              rowKey="businessId"
              loading={{
                spinning: loading,
                indicator: <GlobalLoaderWithInlineStyles />,
              }}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} businesses`,
              }}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
            />
          )}
        </TableSection>

        <DetailDrawerModal
          isVisible={isDetailDrawerVisible}
          onClose={() => setIsDetailDrawerVisible(false)}
          business={selectedBusiness}
          isLoading={detailsLoading}
          isMobile={isMobile}
          isActionLoading={isActionLoading}
          onAction={{
            handleDeleteBusiness,
            handleToggleActive,
            handleFeatureBusiness,
          }}
        />

        <Modal
          title={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Upload size={20} />
              Import Google Reviews
            </span>
          }
          open={importModalOpen}
          onCancel={() => {
            setImportModalOpen(false);
            setImportResult(null);
            setImportFile(null);
            setImportBusinesses([]);
          }}
          footer={null}
          width={560}
          destroyOnClose
        >
          <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
            Select a business and upload a CSV or JSON file. Runs the same logic
            as the <code>import_google_reviews</code> management command. Runs on
            the <strong>main server thread</strong> (not Celery); large files may
            take a minute.
          </Text>
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: "block", marginBottom: 6 }}>
              <Building2 size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Business
            </Text>
            <Select
              placeholder="Select a business"
              value={importSelectedBusinessId ?? undefined}
              onChange={setImportSelectedBusinessId}
              options={importBusinessOptions}
              loading={importBusinessesLoading}
              style={{ width: "100%" }}
              showSearch
              optionFilterProp="label"
              filterOption={(input, opt) =>
                (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: "block", marginBottom: 6 }}>
              <FileUp size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
              File (CSV or JSON)
            </Text>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleImportFileChange}
              disabled={importing}
              style={{
                padding: 8,
                border: "1px dashed #cbd5e1",
                borderRadius: 8,
                background: "#f8fafc",
                width: "100%",
                fontSize: 14,
              }}
            />
            {importFile && (
              <Text type="secondary" style={{ display: "block", marginTop: 6 }}>
                {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
              </Text>
            )}
          </div>
          <Button
            type="primary"
            icon={<Upload size={18} />}
            onClick={handleRunImportReviews}
            loading={importing}
            disabled={!importSelectedBusinessId || !importFile}
          >
            Run import
          </Button>
          {(importing || importResult) && (
            <div style={{ marginTop: 20 }}>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                {importing ? "Running import…" : "Import output"}
              </Text>
              {importing ? (
                <ImportLogPre>
                  Running import_google_reviews on the server… This may take a
                  minute for large files. Do not close this modal.
                </ImportLogPre>
              ) : importResult?.data?.output ? (
                <ImportLogPre>{importResult.data.output}</ImportLogPre>
              ) : importResult?.success ? (
                <Alert
                  type="success"
                  message={importResult.data?.message || "Import completed."}
                  showIcon
                  style={{ marginTop: 8 }}
                />
              ) : importResult ? (
                <Alert
                  type="error"
                  message={importResult.error}
                  showIcon
                  style={{ marginTop: 8 }}
                />
              ) : null}
            </div>
          )}
        </Modal>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default BusinessListings;
