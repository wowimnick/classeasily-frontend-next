import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  forwardRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import styled from "styled-components";
import {
  Search,
  RefreshCw,
  CheckCircle,
  Upload,
  LayoutGrid,
  List,
  MoreVertical,
  Trash2,
  Mail,
  Phone,
  User,
  Eye,
  Plus,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  Typography,
  Grid,
  Divider,
  Modal,
  Pagination,
  Table,
  Avatar,
  Tag,
  Dropdown,
  Menu,
  Tooltip,
  Space,
  Popconfirm,
  Form,
} from "antd";
import message from "@/lib/message";
import { businessStudentService, businessContactService } from "@/services/apiService";
import ClientCard from "./ClientCard";
import ClientProfile from "./ClientProfile";
import ImportClientsModal from "./ImportClientsModal";
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";
import dayjs from "dayjs";
import { formatPhoneNumber } from "@/services/utils";
import { useAuth } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { useUrlState, useReplaceSearchParams } from "@/hooks/useUrlState";

const { Option } = Select;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const colors = {
  primary: "#ff385c",
  success: "#10b981",
  textSecondary: "#64748b",
  border: "#f1f5f9",
};

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
const ControlsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;

const SearchFilterBar = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 16px;
  align-items: center;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
`;

const SearchInputStyled = styled(Input)`
  width: 300px;
  .ant-input-prefix {
    color: #9ca3af;
    margin-right: 8px;
  }
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ActionButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  &:hover {
    color: #ff385c;
    border-color: #ff385c;
  }
`;

const ActionButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  @media (max-width: 768px) {
    justify-content: center;
    flex-direction: row;
    width: 100%;
    gap: 12px;
  }
`;

const GuestsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const TableViewWrapper = styled(motion.div)`
  .ant-table {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .ant-table-thead > tr > th {
    background-color: #f8fafc !important;
    color: #64748b;
    font-weight: 600;
    font-size: 11px;
    padding: 10px 14px;
    border-bottom: 1px solid #e2e8f0;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    &::before {
      display: none;
    }
  }

  .ant-table-tbody > tr > td {
    vertical-align: middle;
    padding: 12px 14px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
    color: #1e293b;
  }
  @media (max-width: 768px) {
    .ant-table-thead > tr > th {
      padding: 8px 12px;
      font-size: 10px;
    }
    .ant-table-tbody > tr > td {
      padding: 10px 12px;
      font-size: 12px;
    }
  }

  .ant-table-tbody > tr:last-child > td {
    border-bottom: none;
  }

  .ant-table-tbody > tr:hover > td {
    background-color: #f8fafc;
  }

  .ant-table-tbody > tr.ant-table-placeholder:hover > td {
    background: white;
  }

  .ant-pagination {
    margin: 24px 0 0;
  }

  .ant-table-column-sorter {
    color: #94a3b8;
  }

  .clickable-row {
    cursor: pointer;
  }
`;

const StyledSelect = styled(Select)`
  min-width: 200px !important;
  .ant-select-selector {
    height: 44px !important;
    border-radius: 12px !important;
    border: 1px solid #e5e7eb !important;
    padding: 0 16px !important;
    display: flex;
    align-items: center;
    background: white !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    .ant-select-selection-item {
      line-height: 42px !important;
    }
  }
  &:hover .ant-select-selector {
    border-color: #ff385c !important;
  }
  &.ant-select-focused .ant-select-selector {
    border-color: #ff385c !important;
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1) !important;
  }
  @media (max-width: 768px) {
    width: 100% !important;
  }
`;

const NoResultsContainer = styled.div`
  text-align: center;
  padding: 48px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-top: 20px;
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  p {
    color: ${colors.textSecondary};
    margin-bottom: 16px;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 24px;
`;

const StyledTag = styled(Tag)`
  border-radius: 6px;
  padding: 5px 10px;
  font-weight: 600;
  font-size: 12px;
  line-height: 1;
  height: auto;
  text-transform: uppercase;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const StyledMenu = styled(Menu)`
  min-width: 180px;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;

  .ant-dropdown-menu-item {
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;

    &:hover {
      background: #f8fafc;
    }

    .lucide {
      font-size: 16px;
      color: #64748b;
    }
  }

  .ant-dropdown-menu-item-danger {
    color: #ef4444 !important;

    &:hover {
      background: #fef2f2;
    }
    .lucide {
      color: #ef4444;
    }
  }
`;

const TableActionButton = styled(Button)`
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  .lucide {
    width: 16px;
    height: 16px;
    color: #64748b;
  }
`;

const GuestInfo = styled.div`
  .name {
    font-weight: 500;
    color: #1e293b;
    margin-bottom: 2px;
    white-space: nowrap;
  }

  .email {
    font-size: 13px;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 0.5;
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

function parsePositiveIntGuests(raw) {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function mapGuestRow(c) {
  return {
    ...c,
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
    phone_number: c.phone_number,
    type: c.type || "contact",
    total_classes_taken:
      c.total_classes_taken != null ? c.total_classes_taken : c.booking_count ?? 0,
    total_spent_this_business:
      c.total_spent_this_business != null
        ? c.total_spent_this_business
        : c.lifetime_value ?? 0,
    last_booking_date_this_business:
      c.last_booking_at || c.last_booking_date_this_business || null,
    last_activity_at: c.last_activity_at || null,
    lifetime_value: c.lifetime_value,
    booking_count: c.booking_count,
    tags: Array.isArray(c.tags) ? c.tags : [],
    status: c.status || null,
    no_show_count: c.no_show_count ?? 0,
    attendance_rate: c.attendance_rate ?? null,
    avatar_thumb_url: c.avatar_thumb_url || null,
  };
}

function formatLifecycleStatus(status) {
  if (!status) return "";
  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function lifecycleTagColor(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return "green";
  if (s === "lead") return "gold";
  if (s === "inactive") return "default";
  if (s === "lapsed") return "orange";
  return "blue";
}

const Guests = forwardRef((props, ref) => {
  const searchParams = useSearchParams();
  const replaceListParams = useReplaceSearchParams();
  const [guests, setGuests] = useState([]);
  const [searchText, setSearchText] = useState("");
  const { user: currentUser } = useAuth();
  const [guestIdRaw, setGuestId] = useUrlState("guestId");
  const [listFiltersHydrated, setListFiltersHydrated] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [segmentFilter, setSegmentFilter] = useState("");
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [addClientSaving, setAddClientSaving] = useState(false);
  const [addClientForm] = Form.useForm();
  const [saveSegmentOpen, setSaveSegmentOpen] = useState(false);
  const [segmentName, setSegmentName] = useState("");
  const [savingSegment, setSavingSegment] = useState(false);
  const [savedSegments, setSavedSegments] = useState([]);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });
  const [viewMode, setViewMode] = useState(); // Initially undefined
  const screens = useBreakpoint();

  useEffect(() => {
    // Set the default view mode based on screen size once the breakpoint is known.
    if (viewMode === undefined && Object.keys(screens).length > 0) {
      // If screen is medium or larger (desktop), default to table. Otherwise, grid (mobile).
      setViewMode(screens.md ? "table" : "grid");
    }
  }, [screens, viewMode]);

  const fetchTimeoutRef = useRef(null);

  const fetchGuestsData = useCallback(
    async (page = 1, search = searchText, status = statusFilter, segment = segmentFilter) => {
      setIsLoading(true);
      setIsReadyForAnimation(false);
      setError(null);
      try {
        const params = {
          page,
          page_size: pagination.pageSize,
          search: search || undefined,
          status: status && status !== "all" ? status : undefined,
          segment: segment || undefined,
        };
        const response = await businessContactService.getContacts(params);
        if (response.success && response.data) {
          const results = response.data.results || [];
          const count = response.data.count ?? 0;
          setGuests(results.map(mapGuestRow));
          setPagination((prev) => ({ ...prev, current: page, total: count }));
          setTimeout(() => setIsReadyForAnimation(true), 50);
        } else {
          throw new Error(response.error || "Failed to fetch contacts");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch clients");
        message.error(err.message || "Failed to fetch clients");
        setGuests([]);
        setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.pageSize, searchText, statusFilter, segmentFilter]
  );

  useEffect(() => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      fetchGuestsData(1, searchText, statusFilter, segmentFilter);
    }, 300);
    return () => clearTimeout(fetchTimeoutRef.current);
  }, [searchText, statusFilter, segmentFilter, fetchGuestsData]);

  useEffect(() => {
    fetchGuestsData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    businessContactService.getClientSegments().then((res) => {
      if (!cancelled && res.success && Array.isArray(res.data)) {
        setSavedSegments(res.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (listFiltersHydrated) return;
    setListFiltersHydrated(true);
    const s = searchParams.get("search") || "";
    const p = parsePositiveIntGuests(searchParams.get("page"));
    const st = searchParams.get("status");
    const seg = searchParams.get("segment") || "";
    if (s) setSearchText(s);
    if (p) setPagination((prev) => ({ ...prev, current: p }));
    if (["all", "active", "lead", "inactive", "lapsed"].includes(st)) setStatusFilter(st);
    if (seg !== undefined && seg !== null) setSegmentFilter(seg);
  }, [listFiltersHydrated, searchParams]);

  useEffect(() => {
    if (!listFiltersHydrated) return;
    const t = setTimeout(() => {
      replaceListParams({
        search: searchText.trim() || null,
        page: pagination.current > 1 ? pagination.current : null,
        status: statusFilter !== "all" ? statusFilter : null,
        segment: segmentFilter || null,
      });
    }, 400);
    return () => clearTimeout(t);
  }, [
    listFiltersHydrated,
    searchText,
    pagination.current,
    statusFilter,
    segmentFilter,
    replaceListParams,
  ]);

  useEffect(() => {
    if (!guestIdRaw) {
      setIsProfileVisible(false);
      setSelectedGuest(null);
      return;
    }
    const found = guests.find((g) => String(g.id) === String(guestIdRaw));
    setSelectedGuest(found || { id: guestIdRaw });
    setIsProfileVisible(true);
  }, [guestIdRaw, guests]);

  const handlePageChange = (page) => {
    fetchGuestsData(page, searchText, statusFilter, segmentFilter);
  };

  const handleGuestClick = (guest) => {
    setGuestId(String(guest.id));
  };

  const handleCloseProfile = () => {
    setGuestId(null);
    setIsProfileVisible(false);
    setTimeout(() => setSelectedGuest(null), 300); // Wait for animation
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleSegmentFilterChange = (value) => {
    const saved = savedSegments.find((s) => s.id === value);
    if (saved) {
      const def = saved.definition || {};
      setSegmentFilter(def.segment && def.segment !== "all" ? def.segment : "");
      if (def.search) setSearchText(def.search);
      setStatusFilter(def.status || "all");
      setPagination((prev) => ({ ...prev, current: 1 }));
      return;
    }
    setSegmentFilter(value || "");
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setSegmentFilter("");
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleImportComplete = () => {
    setTimeout(() => {
      setStatusFilter("all");
      setSegmentFilter("");
      fetchGuestsData(1, "", "all", "");
    }, 1000);
  };

  const handleDeleteContact = (guest) => {
    Modal.confirm({
      title: `Delete ${guest.first_name}?`,
      content:
        "Are you sure you want to permanently delete this contact? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await businessStudentService.deleteContact(guest.id);
          if (response.success) {
            message.success("Contact deleted successfully.");
            fetchGuestsData(pagination.current);
          } else {
            throw new Error(response.error || "Failed to delete contact.");
          }
        } catch (error) {
          const errorMessage =
            error.response?.data?.detail ||
            error.message ||
            "An error occurred.";
          message.error(errorMessage);
        }
      },
    });
  };

  const handleSaveSegment = async () => {
    const name = segmentName.trim();
    if (!name) {
      message.warning("Enter a name for this segment.");
      return;
    }
    setSavingSegment(true);
    try {
      const response = await businessContactService.createClientSegment({
        name,
        definition: {
          segment: segmentFilter || "all",
          search: searchText.trim() || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });
      if (!response.success) {
        throw new Error(response.error || "Failed to save segment");
      }
      message.success("Segment saved.");
      setSaveSegmentOpen(false);
      setSegmentName("");
      const segs = await businessContactService.getClientSegments();
      if (segs.success && Array.isArray(segs.data)) {
        setSavedSegments(segs.data);
      }
    } catch (err) {
      message.error(err.message || "Failed to save segment");
    } finally {
      setSavingSegment(false);
    }
  };

  const isAnyFilterActive = searchText !== "" || statusFilter !== "all" || segmentFilter !== "";

  const columns = useMemo(
    () => [
      {
        title: "CLIENT",
        key: "guest",
        sorter: true,
        render: (_, record) => {
          const avatarLetter = record.first_name
            ? record.first_name[0].toUpperCase()
            : record.email
            ? record.email[0].toUpperCase()
            : "?";
          const isUser = record.type === "user";
          const isGuest = record.type === "guest";
          const tooltipText = isUser
            ? "Registered platform user who has booked a class with your business."
            : isGuest
            ? "Guest who booked a class with your business (no platform account)."
            : "Imported or manually added contact. They may not have booked yet.";

          return (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar src={record.avatar_thumb_url} size={40}>
                {avatarLetter}
              </Avatar>
              <div>
                <GuestInfo>
                  <div className="name">
                    {record.first_name || "Unknown"} {record.last_name || ""}
                  </div>
                </GuestInfo>
                <Tooltip title={tooltipText}>
                  <Tag
                    color={isUser ? "blue" : isGuest ? "purple" : "default"}
                    style={{ marginTop: "4px" }}
                  >
                    {isUser
                      ? "Platform User"
                      : isGuest
                      ? "Guest Booker"
                      : "Imported Contact"}
                  </Tag>
                </Tooltip>
              </div>
            </div>
          );
        },
        width: 280,
      },
      {
        title: "CONTACT INFO",
        key: "contact",
        render: (_, record) => (
          <Space direction="vertical" size={4}>
            {record.email && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Mail size={14} color={colors.textSecondary} />
                <a
                  href={`mailto:${record.email}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {record.email}
                </a>
              </div>
            )}
            {record.phone_number && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Phone size={14} color={colors.textSecondary} />
                <span>{formatPhoneNumber(record.phone_number).display}</span>
              </div>
            )}
            {!record.email && !record.phone_number && (
              <Text type="secondary" style={{ fontSize: "13px" }}>
                No contact info
              </Text>
            )}
          </Space>
        ),
        width: 250,
      },
      {
        title: "SERVICES",
        dataIndex: "total_classes_taken",
        key: "total_classes_taken",
        align: "center",
        sorter: true,
        width: 120,
        render: (value) => value ?? 0,
      },
      {
        title: "LTV",
        key: "lifetime_value",
        align: "right",
        sorter: true,
        width: 120,
        render: (_, record) => {
          const value =
            record.lifetime_value != null && record.lifetime_value !== ""
              ? record.lifetime_value
              : record.total_spent_this_business;
          if (value == null || value === "") return "—";
          return `$${parseFloat(value || 0).toFixed(2)}`;
        },
      },
      {
        title: "NO-SHOWS",
        key: "no_show_count",
        width: 110,
        render: (_, record) => record.no_show_count ?? 0,
      },
      {
        title: "ATTEND %",
        key: "attendance_rate",
        width: 110,
        render: (_, record) =>
          record.attendance_rate != null ? `${record.attendance_rate}%` : "—",
      },
      {
        title: "LAST SEEN",
        key: "last_activity_at",
        sorter: true,
        width: 140,
        render: (_, record) => {
          const date =
            record.last_activity_at || record.last_booking_date_this_business;
          return (
            <Text style={{ fontSize: "13px" }}>
              {date ? dayjs(date).format("MMM D, YYYY") : "N/A"}
            </Text>
          );
        },
      },
      {
        title: "TAGS",
        key: "tags",
        width: 180,
        render: (_, record) => {
          const tags = Array.isArray(record.tags) ? record.tags : [];
          if (!tags.length) {
            return (
              <Text type="secondary" style={{ fontSize: "12px" }}>
                —
              </Text>
            );
          }
          return (
            <Space size={[4, 4]} wrap>
              {tags.slice(0, 3).map((tag) => (
                <Tag key={tag} style={{ margin: 0 }}>
                  {tag}
                </Tag>
              ))}
              {tags.length > 3 && <Tag style={{ margin: 0 }}>+{tags.length - 3}</Tag>}
            </Space>
          );
        },
      },
      {
        title: "STATUS",
        key: "status",
        width: 120,
        render: (_, record) => {
          if (!record.status) {
            return (
              <Text type="secondary" style={{ fontSize: "12px" }}>
                —
              </Text>
            );
          }
          return (
            <Tag color={lifecycleTagColor(record.status)}>
              {formatLifecycleStatus(record.status)}
            </Tag>
          );
        },
      },
      {
        title: "ACTIONS",
        key: "actions",
        align: "center",
        width: 100,
        fixed: "right",
        render: (_, record) => {
          const isUser = record.type === "user";
          const menu = (
            <StyledMenu>
              <Menu.Item
                key="profile"
                icon={<Eye size={16} />}
                onClick={(e) => {
                  e.domEvent.stopPropagation();
                  handleGuestClick(record);
                }}
              >
                View Profile
              </Menu.Item>
              {!isUser && (
                <Menu.Item
                  key="delete"
                  danger
                  icon={<Trash2 size={16} />}
                  className="ant-dropdown-menu-item-danger"
                >
                  <Popconfirm
                    title="Are you sure you want to delete this contact?"
                    onConfirm={(e) => {
                      e.stopPropagation();
                      handleDeleteContact(record);
                    }}
                    onCancel={(e) => e.stopPropagation()}
                    okText="Yes, Delete"
                    cancelText="No"
                    placement="left"
                  >
                    <span onClick={(e) => e.stopPropagation()}>
                      Delete Contact
                    </span>
                  </Popconfirm>
                </Menu.Item>
              )}
            </StyledMenu>
          );

          return (
            <Dropdown
              overlay={menu}
              trigger={["click"]}
              placement="bottomRight"
            >
              <TableActionButton
                icon={<MoreVertical size={16} />}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // --- SKELETON LOADER DEFINITIONS ---
  const SkeletonWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${(props) => props.gap || "8px"};
    width: 100%;
  `;

  const SkeletonLine = styled.div`
    height: ${(props) => props.height || "16px"};
    width: ${(props) => props.width || "100%"};
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: loading 1.5s ease-in-out infinite;
    border-radius: 6px;

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `;

  const SkeletonCircle = styled(SkeletonLine)`
    border-radius: 50%;
    width: ${(props) => props.size || "40px"};
    height: ${(props) => props.size || "40px"};
  `;

  const SkeletonTag = styled(SkeletonLine)`
    height: 22px;
    width: 110px;
    border-radius: 6px;
  `;

  // Skeleton for Grid View Card
  const SkeletonGuestCard = () => (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <SkeletonCircle size="48px" />
        <SkeletonWrapper gap="8px">
          <SkeletonLine width="150px" height="16px" />
          <SkeletonLine width="180px" height="14px" />
        </SkeletonWrapper>
      </div>
      <SkeletonTag width="120px" height="24px" />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #f1f5f9",
          paddingTop: "16px",
        }}
      >
        <SkeletonWrapper gap="4px">
          <SkeletonLine width="80px" height="12px" />
          <SkeletonLine width="50px" height="16px" />
        </SkeletonWrapper>
        <SkeletonWrapper gap="4px" style={{ alignItems: "flex-end" }}>
          <SkeletonLine width="80px" height="12px" />
          <SkeletonLine width="70px" height="16px" />
        </SkeletonWrapper>
      </div>
    </div>
  );

  // Skeleton Row for Table View
  const SkeletonTableRow = () => ({
    key: Math.random(),
    guest: (
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <SkeletonCircle size="40px" />
        <SkeletonWrapper gap="8px">
          <SkeletonLine width="120px" height="14px" />
          <SkeletonTag width="100px" height="20px" />
        </SkeletonWrapper>
      </div>
    ),
    contact: (
      <SkeletonWrapper gap="8px">
        <SkeletonLine width="180px" height="14px" />
        <SkeletonLine width="120px" height="14px" />
      </SkeletonWrapper>
    ),
    total_classes_taken: (
      <SkeletonLine width="40px" height="14px" style={{ margin: "0 auto" }} />
    ),
    total_spent_this_business: (
      <SkeletonLine width="80px" height="14px" style={{ float: "right" }} />
    ),
    last_booking_date_this_business: (
      <SkeletonLine width="100px" height="14px" />
    ),
    actions: <SkeletonCircle size="36px" style={{ margin: "0 auto" }} />,
  });

  const generateSkeletonData = (count = 10) => {
    return Array.from({ length: count }, () => SkeletonTableRow());
  };

  const skeletonColumns = useMemo(
    () => [
      {
        title: "CLIENT",
        key: "guest",
        dataIndex: "guest",
        width: 280,
      },
      {
        title: "CONTACT INFO",
        key: "contact",
        dataIndex: "contact",
        width: 250,
      },
      {
        title: "SERVICES",
        key: "classes",
        dataIndex: "total_classes_taken",
        align: "center",
        width: 120,
      },
      {
        title: "LTV",
        key: "spent",
        dataIndex: "total_spent_this_business",
        align: "right",
        width: 120,
      },
      {
        title: "LAST SEEN",
        key: "booking",
        dataIndex: "last_booking_date_this_business",
        width: 140,
      },
      {
        title: "TAGS",
        key: "tags",
        dataIndex: "tags",
        width: 180,
      },
      {
        title: "STATUS",
        key: "status",
        dataIndex: "status",
        width: 120,
      },
      {
        title: "ACTIONS",
        key: "actions",
        dataIndex: "actions",
        align: "center",
        width: 100,
        fixed: "right",
      },
    ],
    []
  );

  const GuestsSkeleton = ({ viewMode, pageSize }) => {
    // Fallback for viewMode if it's still undefined during the very first render
    const currentViewMode =
      viewMode === undefined ? (screens.md ? "table" : "grid") : viewMode;

    if (currentViewMode === "grid") {
      return (
        <GuestsGrid>
          {Array.from({ length: pageSize }).map((_, index) => (
            <motion.div key={index}>
              <SkeletonGuestCard />
            </motion.div>
          ))}
        </GuestsGrid>
      );
    }

    return (
      <TableViewWrapper>
        <Table
          columns={skeletonColumns}
          dataSource={generateSkeletonData(pageSize)}
          rowKey="key"
          pagination={false}
          scroll={{ x: 1200 }}
        />
      </TableViewWrapper>
    );
  };

  return (
    <DashboardWrapper>
        <DashboardBreadcrumb title="Clients" />
        <DashboardHeader>
          <div>
            <PageTitle>Clients</PageTitle>
            <HeaderSubtitle>
              View and manage all your business contacts and platform clients.
            </HeaderSubtitle>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <ActionButton
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setAddClientOpen(true)}
            style={{
              height: "44px",
              background: colors.primary,
              color: "white",
              borderColor: colors.primary,
            }}
          >
            Add client
          </ActionButton>
          <ActionButton
            icon={<Upload size={16} />}
            onClick={() => setIsImportModalVisible(true)}
            style={{
              height: "44px",
            }}
          >
            Import Clients
          </ActionButton>
          </div>
        </DashboardHeader>

        <Divider />

        <ControlsBar>
          <SearchFilterBar>
            <SearchInputStyled
              placeholder="Search by name or email..."
              prefix={<Search size={16} />}
              value={searchText}
              onChange={handleSearchChange}
              allowClear
            />
            <ActionButtonContainer>
              <StyledSelect
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <Option value="all">All clients</Option>
                <Option value="active">Active</Option>
                <Option value="lead">Lead</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="lapsed">Lapsed</Option>
              </StyledSelect>
              <StyledSelect
                placeholder="Segment"
                value={segmentFilter || undefined}
                onChange={handleSegmentFilterChange}
                style={{ minWidth: 160 }}
                allowClear
              >
                <Option value="">All segments</Option>
                <Option value="booked_last_30">Booked last 30 days</Option>
                <Option value="never_returned">Never returned</Option>
                <Option value="high_value">High value</Option>
                <Option value="no_recent_activity">No recent activity</Option>
                <Option value="active_members">Active members</Option>
                <Option value="lapsed_members">Lapsed members</Option>
                <Option value="leads">Leads</Option>
                {savedSegments.map((seg) => (
                  <Option key={seg.id} value={seg.id}>
                    {seg.name}
                  </Option>
                ))}
              </StyledSelect>
              <ActionButton
                style={{ height: "44px" }}
                onClick={() => setSaveSegmentOpen(true)}
                disabled={!isAnyFilterActive}
              >
                Save segment
              </ActionButton>
              <ActionButton
                style={{ height: "44px" }}
                icon={<RefreshCw size={16} />}
                onClick={() => {
                  clearFilters();
                  fetchGuestsData(1, "", "all", "");
                }}
                loading={isLoading && guests.length === 0}
                disabled={isLoading}
              >
                {screens.xs ? "" : "Refresh"}
              </ActionButton>
            </ActionButtonContainer>
          </SearchFilterBar>
          <Button.Group>
            <Button
              type={viewMode === "grid" ? "primary" : "default"}
              icon={<LayoutGrid size={16} />}
              onClick={() => setViewMode("grid")}
            />
            <Button
              type={viewMode === "table" ? "primary" : "default"}
              icon={<List size={16} />}
              onClick={() => setViewMode("table")}
            />
          </Button.Group>
        </ControlsBar>

        <Divider />

        <AnimatePresence mode="wait">
          {isLoading && guests.length === 0 ? (
            <div key="skeleton">
              <GuestsSkeleton
                viewMode={viewMode}
                pageSize={pagination.pageSize}
              />
            </div>
          ) : error ? (
            <NoResultsContainer key="error">
              <h3>Error Loading Data</h3>
              <p>{error}</p>
              <Button
                onClick={() => fetchGuestsData(pagination.current)}
                type="primary"
              >
                Try Again
              </Button>
            </NoResultsContainer>
          ) : guests.length > 0 ? (
            <div key="content">
              {viewMode === "grid" ? (
                <GuestsGrid
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {guests.map((guest) => (
                    <motion.div
                      key={guest.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ClientCard
                        guest={guest}
                        onClick={() => handleGuestClick(guest)}
                        onDelete={() => handleDeleteContact(guest)}
                        isReady={isReadyForAnimation}
                      />
                    </motion.div>
                  ))}
                </GuestsGrid>
              ) : (
                <TableViewWrapper
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Table
                    columns={columns}
                    dataSource={guests}
                    rowKey="id"
                    pagination={false}
                    loading={{
                      spinning: isLoading && guests.length > 0,
                      indicator: <GlobalLoaderWithInlineStyles />,
                    }}
                    onRow={(record) => ({
                      onClick: () => handleGuestClick(record),
                      className: "clickable-row",
                    })}
                    scroll={{ x: 1400 }}
                  />
                </TableViewWrapper>
              )}

              {pagination.total > pagination.pageSize && (
                <PaginationContainer>
                  <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    responsive
                  />
                </PaginationContainer>
              )}
            </div>
          ) : (
            <EmptyStateContainer key="no-results">
              <EmptyStateIcon>
                <lord-icon
                  src="https://cdn.lordicon.com/uoljexdg.json"
                  trigger="in"
                  colors="primary:#94a3b8"
                  style={{ width: 40, height: 40 }}
                />
              </EmptyStateIcon>
              <EmptyStateText>No Clients Found</EmptyStateText>
              <EmptyStateSubtext>
                You don't currently have any clients. They will appear here when
                they book, or when you import from a table.
              </EmptyStateSubtext>
            </EmptyStateContainer>
          )}
        </AnimatePresence>

        {selectedGuest && (
          <ClientProfile
            guest={selectedGuest}
            currentUser={currentUser}
            onClose={handleCloseProfile}
            visible={isProfileVisible}
          />
        )}

        <ImportClientsModal
          visible={isImportModalVisible}
          onClose={() => setIsImportModalVisible(false)}
          onImportComplete={handleImportComplete}
        />

        <Modal
          title="Add client"
          open={addClientOpen}
          onCancel={() => { setAddClientOpen(false); addClientForm.resetFields(); }}
          onOk={() => addClientForm.submit()}
          confirmLoading={addClientSaving}
          okText="Add"
        >
          <Form
            form={addClientForm}
            layout="vertical"
            onFinish={async (values) => {
              setAddClientSaving(true);
              const res = await businessContactService.createContact({
                first_name: values.first_name,
                last_name: values.last_name,
                email: values.email,
                phone_number: values.phone_number,
                source: "manual_entry",
                status: "lead",
              });
              setAddClientSaving(false);
              if (res.success) {
                message.success("Client added");
                setAddClientOpen(false);
                addClientForm.resetFields();
                fetchGuestsData(1, searchText, statusFilter, segmentFilter);
              } else {
                message.error(res.error || "Could not add client");
              }
            }}
          >
            <Form.Item name="first_name" label="First name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="last_name" label="Last name">
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input type="email" />
            </Form.Item>
            <Form.Item name="phone_number" label="Phone">
              <Input />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Save segment"
          open={saveSegmentOpen}
          onCancel={() => {
            setSaveSegmentOpen(false);
            setSegmentName("");
          }}
          onOk={handleSaveSegment}
          confirmLoading={savingSegment}
          okText="Save"
        >
          <Input
            placeholder="Segment name"
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
            onPressEnter={handleSaveSegment}
            autoFocus
          />
        </Modal>
      </DashboardWrapper>
  );
});

export default Guests;
