"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUrlState } from "@/hooks/useUrlState";
import styled from "styled-components";
import dayjs from "dayjs";
import { Table, Card, Input, Select, Button, ConfigProvider, Checkbox, Avatar, Tag, Space, Tooltip, Dropdown, Menu, Divider, Modal, Grid, Empty, Badge, Alert, Tabs, Popconfirm, Typography, Statistic, List,  } from 'antd';
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
  Mail,
  AlertCircle,
  Trash2,
  Check,
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
  ExternalLink,
  X,
  LogIn,
} from "lucide-react";
import { businessManagementService, userAdminService } from "@/services/adminDash";
import { businessClassService } from "@/services/apiService";
import { useAuthStore } from "@/lib/auth-client";
import { theme as appTheme } from "@/components/theme";
import { RefreshCw } from "lucide-react";
import { Drawer as VaulDrawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import { bookingTheme } from "@/app/business/dashboard/_components/tabs/classes/_shared/BookingFlowDesign";
import { AdminTableSkeleton, AdminDrawerContentSkeleton } from "../shared/AdminSkeletons";

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text, Title, Paragraph, Link } = Typography;

const BOOKABILITY_TOOLTIPS = {
  bookable:
    "Customers can book: business account is on and at least one class has upcoming scheduled sessions.",
  notBookable:
    "Customers cannot book: business is off and/or there are no upcoming scheduled sessions.",
};

/** True when customers can book on the platform (active account + active schedules). */
function isBusinessBookable(b) {
  return Boolean(b?.isActive && b?.has_active_schedules);
}

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
  padding: 12px;
  @media (max-width: 768px) {
    padding: 8px;
    gap: 0;
  }
`;

const ContentLayer = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid ${colors.border};
  padding: 20px 24px;
  @media (max-width: 768px) {
    padding: 14px 16px;
    border-radius: 12px;
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
const TableSection = styled.div`
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
    background: #f8fafc !important;
    color: ${colors.textSecondary};
    font-weight: 600;
    font-size: 11px;
    padding: 10px 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid ${colors.border};
    &::before { display: none; }
  }
  .ant-table-tbody > tr > td {
    padding: 10px 14px;
    border-bottom: 1px solid ${colors.border};
    font-size: 13px;
    color: ${colors.textPrimary};
  }
  .ant-table-tbody > tr:hover > td {
    background: #f8fafc;
  }
  .ant-empty {
    padding: 40px 20px;
  }
`;

const BusinessDrawerOverlay = styled(VaulDrawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const BusinessDrawerMobile = styled(VaulDrawer.Content)`
  position: fixed;
  top: 5vh;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  z-index: 1001;
  outline: none;
`;

const BusinessDrawerHandle = styled(VaulDrawer.Handle)`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 0;
  cursor: grab;
  flex-shrink: 0;
  &:active {
    cursor: grabbing;
  }
`;

const BusinessDrawerDesktop = styled(VaulDrawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: 800px;
  max-width: 96vw;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const BusinessDrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  flex-shrink: 0;
`;

const BusinessDrawerCloseBtn = styled(Button)`
  padding: 8px;
  height: auto;
  border: none;
  background: none;
  flex-shrink: 0;
  &:hover {
    background: #f1f5f9;
  }
`;

const BusinessDrawerBodyScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
  background: #fff;
`;

const InfoGroup = styled.div`
  background: white;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid ${bookingTheme.borderLight};
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
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

const DrawerTwoCol = styled.div`
  display: flex;
  gap: 24px;
  min-height: 0;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;
const DrawerLeftCol = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;
const DrawerRightCol = styled.div`
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  @media (max-width: 768px) {
    width: 100%;
    order: -1;
  }
`;
const SidebarCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid ${bookingTheme.borderLight};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
`;
const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: ${colors.textSecondary};
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
`;
const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 4px 10px;
  border-radius: 20px;
  background: ${(p) => p.$bg || colors.lightBg};
  color: ${(p) => p.$color || colors.textPrimary};
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

// --- DETAIL DRAWER ---
const BusinessDetailDrawerContent = ({
  business,
  isActionLoading,
  onAction,
  onViewOwnerProfile,
  onImpersonate,
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
    owner_id,
  } = business;

  const location = [businessCity, businessState].filter(Boolean).join(", ");
  const isVerified = verificationStatus === "verified";

  return (
    <DrawerTwoCol>
      <DrawerLeftCol>
        <InfoGroup>
          <SectionTitle><ShieldAlert size={12} /> Admin Actions</SectionTitle>
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
          <SectionTitle><Hash size={12} /> Business Summary</SectionTitle>
          <InfoGrid>
            <InfoItem>
              <InfoIcon><Building /></InfoIcon>
              <InfoContent>
                <InfoLabel>Business Type</InfoLabel>
                <InfoValue>
                  {businessType
                    ?.replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </InfoValue>
              </InfoContent>
            </InfoItem>
            {location && (
              <InfoItem>
                <InfoIcon><MapPin size={16} /></InfoIcon>
                <InfoContent>
                  <InfoLabel>Location</InfoLabel>
                  <InfoValue>{location}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}
            {businessDescription && (
              <InfoItem style={{ gridColumn: "1 / -1" }}>
                <InfoIcon><BookOpen size={16} /></InfoIcon>
                <InfoContent>
                  <InfoLabel>About {businessName}</InfoLabel>
                  <InfoValue>{businessDescription}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}
          </InfoGrid>
        </InfoGroup>

        <InfoGroup>
          <SectionTitle><Phone size={12} /> Contact</SectionTitle>
          <InfoGrid>
            {studentContactPhone && (
              <InfoItem>
                <InfoIcon><Phone size={16} /></InfoIcon>
                <InfoContent>
                  <InfoLabel>Phone</InfoLabel>
                  <InfoValue>{studentContactPhone}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}
            {studentContactEmail && (
              <InfoItem>
                <InfoIcon><Mail size={16} /></InfoIcon>
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
                <InfoIcon><Globe size={16} /></InfoIcon>
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
              <SectionTitle><Globe size={12} /> Social Media</SectionTitle>
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
      </DrawerLeftCol>

      <DrawerRightCol>
        <SidebarCard>
          <SectionTitle><UserCheck size={12} /> Owner</SectionTitle>
          <InfoValue copyable>{owner_email || "N/A"}</InfoValue>
          {(owner_email && onViewOwnerProfile) || (owner_id != null && onImpersonate) ? (
            <Space direction="vertical" size={8} style={{ marginTop: 8, width: "100%" }} align="start">
              {owner_email && onViewOwnerProfile ? (
                <Button
                  type="link"
                  size="small"
                  icon={<ExternalLink size={14} />}
                  onClick={() => onViewOwnerProfile(owner_email)}
                  style={{ paddingLeft: 0 }}
                >
                  View owner profile
                </Button>
              ) : null}
              {owner_id != null && onImpersonate ? (
                <Button
                  type="default"
                  size="small"
                  icon={<LogIn size={14} />}
                  onClick={() => onImpersonate(owner_id)}
                  style={{ marginLeft: 0 }}
                >
                  Impersonate owner
                </Button>
              ) : null}
            </Space>
          ) : null}
        </SidebarCard>
        <SidebarCard>
          <SectionTitle><Star size={12} /> Rating</SectionTitle>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>
            {parseFloat(average_rating || 0).toFixed(1)}
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary }}>{review_count || 0} reviews</div>
        </SidebarCard>
        <SidebarCard>
          <SectionTitle><CheckCircle size={12} /> Status</SectionTitle>
          <StatusPill
            $bg={isVerified ? "#d1fae5" : "#fef3c7"}
            $color={isVerified ? "#059669" : "#b45309"}
          >
            {verificationStatus?.toUpperCase() || "N/A"}
          </StatusPill>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>Member since {formatDate(createdAt)}</div>
        </SidebarCard>
      </DrawerRightCol>
    </DrawerTwoCol>
  );
};

const DetailDrawerModal = ({
  open,
  onClose,
  business,
  isLoading,
  isMobile,
  onAction,
  isActionLoading,
  onViewOwnerProfile,
  onImpersonate,
}) => {
  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) onClose();
  };

  const titleText = business?.businessName || "Business details";

  const drawerInner = (
    <>
      <BusinessDrawerHeader>
        <Title
          level={4}
          style={{
            margin: 0,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={titleText}
        >
          {titleText}
        </Title>
        <BusinessDrawerCloseBtn
          type="text"
          icon={<X size={20} />}
          onClick={onClose}
          aria-label="Close"
        />
      </BusinessDrawerHeader>
      <BusinessDrawerBodyScroll style={{ padding: isMobile ? 16 : 24 }}>
        {isLoading ? (
          <AdminDrawerContentSkeleton />
        ) : (
          <BusinessDetailDrawerContent
            business={business}
            isActionLoading={isActionLoading}
            onAction={onAction}
            onViewOwnerProfile={onViewOwnerProfile}
            onImpersonate={onImpersonate}
          />
        )}
      </BusinessDrawerBodyScroll>
    </>
  );

  return isMobile ? (
    <VaulDrawer.Root open={open} onOpenChange={handleOpenChange} dismissible>
      <VaulDrawer.Portal>
        <BusinessDrawerOverlay />
        <BusinessDrawerMobile>
          <BusinessDrawerHandle />
          {drawerInner}
        </BusinessDrawerMobile>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  ) : (
    <VaulDrawer.Root
      open={open}
      onOpenChange={handleOpenChange}
      direction="right"
      dismissible
    >
      <VaulDrawer.Portal>
        <BusinessDrawerOverlay />
        <BusinessDrawerDesktop>{drawerInner}</BusinessDrawerDesktop>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
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
  const router = useRouter();
  const [businessIdRaw, setBusinessIdParam] = useUrlState("businessId");
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [categoriesList, setCategoriesList] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const handleViewOwnerProfile = useCallback((ownerEmail) => {
    if (!ownerEmail) return;
    setDetailDrawerOpen(false);
    setBusinessIdParam(null);
    router.push(`/admin/users?openUserByEmail=${encodeURIComponent(ownerEmail)}`);
  }, [router, setBusinessIdParam]);

  const closeDetailDrawer = useCallback(() => {
    setDetailDrawerOpen(false);
    setBusinessIdParam(null);
  }, [setBusinessIdParam]);

  const handleImpersonateOwner = useCallback(
    async (userId) => {
      if (userId == null) return;
      try {
        setIsActionLoading(true);
        const result = await userAdminService.impersonateUser(userId);
        if (result.success && result.data?.user) {
          useAuthStore.setState({
            user: result.data.user,
            isAuthenticated: true,
            isImpersonating: true,
            isLoading: false,
          });
          message.success("Now impersonating owner.");
          closeDetailDrawer();
          router.push("/");
        } else {
          message.error(result.error || "Could not start impersonation.");
        }
      } catch (e) {
        console.error(e);
        message.error("An unexpected error occurred.");
      } finally {
        setIsActionLoading(false);
      }
    },
    [router, closeDetailDrawer]
  );

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
    province: undefined,
    verification_status: undefined,
    engaged: "all",
    revenue_tier: undefined,
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
          ...(currentFilters.province && { province: currentFilters.province }),
          ...(currentFilters.verification_status && {
            verification_status: currentFilters.verification_status,
          }),
          ...(currentFilters.revenue_tier && {
            revenue_tier: currentFilters.revenue_tier,
          }),
          ...(currentFilters.engaged === "yes" && { engaged: true }),
          ...(currentFilters.engaged === "no" && { engaged: false }),
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
    let cancelled = false;
    setCategoriesLoading(true);
    businessClassService
      .getCategories()
      .then((r) => {
        if (cancelled) return;
        if (r.success) setCategoriesList(r.data || []);
        else message.error(r.error || "Failed to fetch categories");
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    filterParams.province,
    filterParams.verification_status,
    filterParams.engaged,
    filterParams.revenue_tier,
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
          detailDrawerOpen &&
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
    closeDetailDrawer();
  };

  const skipNextUrlOpenRef = useRef(false);

  const loadBusinessDetailById = useCallback(
    async (bid, { syncUrl = false } = {}) => {
      if (!bid) return;
      if (syncUrl) {
        skipNextUrlOpenRef.current = true;
        setBusinessIdParam(bid);
      }
      setDetailDrawerOpen(true);
      setDetailsLoading(true);
      setSelectedBusiness(null);
      try {
        const response = await businessManagementService.getBusinessDetails(bid);
        if (response.success) setSelectedBusiness(response.data);
        else message.error(response.error || "Failed to fetch details");
      } catch (e) {
        message.error("Error fetching details");
      } finally {
        setDetailsLoading(false);
      }
    },
    [setBusinessIdParam]
  );

  const showBusinessDetails = useCallback(
    (businessOrStub) => {
      const bid = businessOrStub?.businessId;
      if (!bid) return;
      void loadBusinessDetailById(bid, { syncUrl: true });
    },
    [loadBusinessDetailById]
  );

  useEffect(() => {
    if (!businessIdRaw) return;
    const id = Number(businessIdRaw);
    if (!Number.isFinite(id)) return;
    if (skipNextUrlOpenRef.current) {
      skipNextUrlOpenRef.current = false;
      return;
    }
    void loadBusinessDetailById(id, { syncUrl: false });
  }, [businessIdRaw, loadBusinessDetailById]);

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
            <Space size={6} wrap>
              <Text strong>{b.businessName}</Text>
              {b.is_engaged ? (
                <Tooltip title="Logged in last 30d as owner or accepted staff, and has ever received a booking.">
                  <Tag color="cyan" style={{ margin: 0 }}>
                    Engaged
                  </Tag>
                </Tooltip>
              ) : null}
            </Space>
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
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Star size={15} fill="#f59e0b" color="#f59e0b" />
              <Text strong>{rating || 0}</Text>
              <Text type="secondary">({total})</Text>
            </div>
            {google > 0 && (
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 2 }}>
                {platform} platform, {google} Google
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      width: 170,
      render: (_, b) => (
        <Space direction="vertical" size={2}>
          {b.verificationStatus === "pending" && (
            <Tag color="blue">Pending Review</Tag>
          )}
          {isBusinessBookable(b) ? (
            <Tooltip title={BOOKABILITY_TOOLTIPS.bookable}>
              <span>
                <Tag color="success">Bookable</Tag>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title={BOOKABILITY_TOOLTIPS.notBookable}>
              <span>
                <Tag>Not bookable</Tag>
              </span>
            </Tooltip>
          )}
          {b.featured && (
            <FeaturedTag color="gold">
              <Award size={12} />
              Featured
            </FeaturedTag>
          )}
          {b.verificationStatus === "verified" && (
            <Tag
              color="success"
              icon={<Check size={12} />}
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              Verified
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 72,
      fixed: "right",
      align: "right",
      render: (_, b) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "details",
                icon: <Eye size={14} />,
                label: "View details",
                onClick: () => showBusinessDetails(b),
              },
              ...(b.owner_id != null
                ? [
                    {
                      key: "imp",
                      icon: <LogIn size={14} />,
                      label: "Impersonate owner",
                      onClick: () => handleImpersonateOwner(b.owner_id),
                    },
                  ]
                : []),
            ],
          }}
        >
          <Button type="text" icon={<MoreHorizontal size={18} />} aria-label="Row actions" />
        </Dropdown>
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
              <Space size={6} wrap align="center">
                <Text strong style={{ fontSize: "14px", display: "block" }}>
                  {b.businessName}
                </Text>
                {b.is_engaged ? (
                  <Tooltip title="Logged in last 30d as owner or accepted staff, and has ever received a booking.">
                    <Tag color="cyan" style={{ margin: 0 }}>
                      Engaged
                    </Tag>
                  </Tooltip>
                ) : null}
              </Space>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                <MapPin size={12} style={{ marginRight: 4 }} />
                {b.businessCity}, {b.businessState}
              </Text>
            </div>
          </Space>
          <Space direction="vertical" size={4} align="end">
            {b.verificationStatus === "pending" && (
              <Tag color="blue">Pending</Tag>
            )}
            {!isBusinessBookable(b) ? (
              <Tooltip title={BOOKABILITY_TOOLTIPS.notBookable}>
                <span>
                  <Tag>Not bookable</Tag>
                </span>
              </Tooltip>
            ) : (
              <Tooltip title={BOOKABILITY_TOOLTIPS.bookable}>
                <span>
                  <Tag color="success">Bookable</Tag>
                </span>
              </Tooltip>
            )}
          </Space>
        </div>
        <MobileCardRow>
          <MobileCardLabel>Owner</MobileCardLabel>
          <Text style={{ fontSize: 13 }} copyable={{ text: b.owner_email }}>
            {b.owner_email || "N/A"}
          </Text>
        </MobileCardRow>
        <MobileCardRow>
          <MobileCardLabel>Rating</MobileCardLabel>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Star size={14} fill="#f59e0b" color="#f59e0b" />
              <Text strong>{b.rating || 0}</Text>
              <Text type="secondary">
                ({(b.review_count || 0) + (b.google_review_count || 0)})
              </Text>
            </div>
            {(b.google_review_count || 0) > 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {b.review_count || 0} platform, {b.google_review_count} Google
              </Text>
            )}
          </div>
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
      <ContentLayer>
        <DashboardHeader style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${colors.border}` }}>
          <div>
            <PageTitle>Business Listings</PageTitle>
            <HeaderSubtitle>
              Monitor, manage, and feature business listings on the platform.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <RefreshButton
              icon={<Upload size={16} />}
              onClick={() => setImportModalOpen(true)}
            >
              {!isMobile && "Import Reviews"}
            </RefreshButton>
            <RefreshButton
              icon={<RefreshCw size={16} />}
              onClick={refreshData}
              loading={loading}
            >
              {!isMobile && "Refresh"}
            </RefreshButton>
          </ActionButtonsContainer>
        </DashboardHeader>

        <TableSection>
          <TableHeader>
            <TableTitle>
              <Building /> All Businesses
            </TableTitle>
            <TableDescription>
              Each row shows <Text strong>Bookable</Text> or{" "}
              <Text strong>Not bookable</Text> — whether customers can book right
              now (active business + upcoming schedules). Verification and
              featured tags are separate.
            </TableDescription>
          </TableHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input
                ref={searchInputRef}
                prefix={<Search size={14} style={{ color: colors.textTertiary }} />}
                placeholder="Search name, email, city..."
                allowClear
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                style={{ width: isMobile ? "100%" : 260, borderRadius: 8 }}
              />
              <Select
                value={filterParams.category}
                style={{ width: isMobile ? "100%" : 170 }}
                onChange={(val) => handleFilterChange({ category: val })}
                loading={categoriesLoading}
                disabled={categoriesLoading}
              >
                <Option value="all">All Categories</Option>
                {categoriesList.map((cat) => (
                  <Option key={cat.key} value={cat.key}>{cat.name}</Option>
                ))}
              </Select>
              <Select
                value={filterParams.status}
                style={{ width: isMobile ? "100%" : 220 }}
                onChange={(val) => handleFilterChange({ status: val })}
              >
                <Option value="all">All businesses</Option>
                <Option value="active">Bookable only</Option>
                <Option value="no_schedules">Not bookable · no schedules</Option>
                <Option value="inactive">Not bookable · inactive account</Option>
                <Option value="pending">Pending verification</Option>
              </Select>
              <Select
                placeholder="Province"
                allowClear
                style={{ width: isMobile ? "100%" : 130 }}
                value={filterParams.province}
                onChange={(val) => handleFilterChange({ province: val })}
              >
                {["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((p) => (
                  <Option key={p} value={p}>{p}</Option>
                ))}
              </Select>
              <Select
                placeholder="Revenue tier"
                allowClear
                style={{ width: isMobile ? "100%" : 160 }}
                value={filterParams.revenue_tier}
                onChange={(val) => handleFilterChange({ revenue_tier: val })}
              >
                <Option value="under_1k">&lt; $1,000</Option>
                <Option value="1k_10k">$1k – $10k</Option>
                <Option value="10k_plus">$10k+</Option>
              </Select>
              <Select
                placeholder="Verification"
                allowClear
                style={{ width: isMobile ? "100%" : 150 }}
                value={filterParams.verification_status}
                onChange={(val) =>
                  handleFilterChange({ verification_status: val })
                }
              >
                <Option value="verified">Verified</Option>
                <Option value="pending">Pending</Option>
                <Option value="rejected">Rejected</Option>
              </Select>
              <Checkbox
                onChange={(e) => handleFilterChange({ featured: e.target.checked })}
                checked={filterParams.featured}
              >
                Featured Only
              </Checkbox>
              <Select
                value={filterParams.engaged}
                style={{ width: isMobile ? "100%" : 170 }}
                onChange={(val) => handleFilterChange({ engaged: val })}
              >
                <Option value="all">Engagement (all)</Option>
                <Option value="yes">Engaged only</Option>
                <Option value="no">Not engaged</Option>
              </Select>
            </SearchFilterContainer>
          </FilterBar>

          {isMobile ? (
            <div style={{ padding: "8px" }}>
              {loading ? (
                <AdminTableSkeleton rows={5} />
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
          ) : loading ? (
            <AdminTableSkeleton rows={8} />
          ) : (
            <StyledTable
              columns={columns}
              dataSource={businesses}
              rowKey="businessId"
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
          open={detailDrawerOpen}
          onClose={closeDetailDrawer}
          business={selectedBusiness}
          isLoading={detailsLoading}
          isMobile={isMobile}
          isActionLoading={isActionLoading}
          onAction={{
            handleDeleteBusiness,
            handleToggleActive,
            handleFeatureBusiness,
          }}
          onViewOwnerProfile={handleViewOwnerProfile}
          onImpersonate={handleImpersonateOwner}
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
      </ContentLayer>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default BusinessListings;
