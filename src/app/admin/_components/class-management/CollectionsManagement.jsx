"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useContext,
  createContext,
  lazy,
  memo,
  Suspense,
} from "react";
import styled, { ThemeProvider } from "styled-components";
import { Drawer as VaulDrawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import {
  Table,
  Card,
  Input,
  Button,
  ConfigProvider,
  Tag,
  Space,
  Form,
  Divider,
  Typography,
  Tooltip,
  Grid,
  Skeleton,
  Switch,
  Upload,
  Radio,
  Select,
  Modal,
  Avatar,
  Empty,
  Spin,
} from "antd";
import message from "@/lib/message";
import { theme as antdComponentTheme } from "@/components/theme";
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  BarChart2,
  Info as InfoIcon,
  GripVertical,
  Sparkles,
  Layers,
  Bot,
  BrainCircuit,
  UserPlus,
  CircleHelp,
  Search,
  X,
  Box,
  RefreshCw,
} from "lucide-react";
import debounce from "lodash/debounce";
import { classManagementService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import { uploadService } from "@/services/apiService";
import {
  formatLucideIconLabel,
  getLucideIconImporter,
  normalizeLucideIconName,
  searchLucideIcons,
} from "@/lib/lucideIconCatalog";
import AdminMetricCards from "../shared/AdminMetricCards";
import {
  bookingTheme,
  FormLabel,
  FormHelpText,
} from "@/app/business/dashboard/_components/tabs/classes/_shared/BookingFlowDesign";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

// --- STYLING & THEME ---
const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  purple: "#8b5cf6", // Added for AI features
  lightBg: "#f8fafc",
  border: "#f1f5f9",
  textPrimary: "#334155",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
};

const hexToRgba = (hex, alpha = 1) => {
  if (!hex?.slice) return `rgba(100, 116, 139, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const iconPreviewCache = new Map();

function getLazyIconPreview(iconKey) {
  const normalizedKey = normalizeLucideIconName(iconKey);
  if (!normalizedKey) return null;
  if (!iconPreviewCache.has(normalizedKey)) {
    const importer = getLucideIconImporter(normalizedKey);
    iconPreviewCache.set(
      normalizedKey,
      lazy(async () => {
        if (!importer) return { default: Box };
        try {
          const module = await importer();
          return { default: module.default || Box };
        } catch {
          return { default: Box };
        }
      }),
    );
  }
  return iconPreviewCache.get(normalizedKey);
}

const IconPreviewFallback = ({ size = 16, color = "#64748b" }) => (
  <Box size={size} color={color} />
);

const IconPreview = memo(
  ({ iconKey, size = 16, color = "#64748b", strokeWidth = 2.2 }) => {
    const LazyIcon = useMemo(() => getLazyIconPreview(iconKey), [iconKey]);
    if (!LazyIcon) {
      return <IconPreviewFallback size={size} color={color} />;
    }
    return (
      <Suspense fallback={<IconPreviewFallback size={size} color={color} />}>
        <LazyIcon size={size} color={color} strokeWidth={strokeWidth} />
      </Suspense>
    );
  },
);

// --- DASHBOARD COMPONENTS (Restored to Original Design) ---
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

const ChartCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  .ant-card-body {
    padding: 24px !important;
  }
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

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
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  @media (max-width: 768px) {
    padding: 16px;
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
`;

const SearchFilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const SectionTitle = styled(Title).attrs({ level: 5 })`
  &.ant-typography {
    font-weight: 600;
    font-size: 17px;
    color: ${colors.textPrimary};
    margin-bottom: 0 !important;
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const HelpText = styled(Text)`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: block;
  margin-bottom: 16px;
`;

const ModalTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  color: ${colors.textPrimary};
`;

// --- Vaul drawer shell (matches business dashboard “Create New Experience” drawer) ---
const CollectionDrawerOverlay = styled(VaulDrawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const CollectionMobileDrawerContent = styled(VaulDrawer.Content)`
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

const CollectionDrawerHandle = styled(VaulDrawer.Handle)`
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

const CollectionDesktopDrawerContent = styled(VaulDrawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: 800px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const CollectionDrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  flex-shrink: 0;
`;

const CollectionDrawerCloseBtn = styled(Button)`
  padding: 8px;
  height: auto;
  border: none;
  background: none;
  &:hover {
    background: #f1f5f9;
  }
`;

const CollectionDrawerBodyScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
  background: #fff;
`;

const CollectionDrawerFooterBar = styled.div`
  border-top: 1px solid #f1f5f9;
  padding: 14px 24px;
  background: white;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
`;

const FormSectionCard = styled.div`
  margin-bottom: 24px;
  background: ${bookingTheme.bg};
  border: 1px solid ${bookingTheme.borderLight};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  padding: 20px;

  &:last-of-type {
    margin-bottom: 0;
  }

  .ant-form-item:last-child {
    margin-bottom: 0;
  }
`;

const SectionCardHeading = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${bookingTheme.textPrimary};
  margin: 0 0 16px;
  letter-spacing: -0.01em;
`;

const AssignModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AssignSearchWrap = styled.div`
  position: relative;
`;

const AssignResultsList = styled.div`
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid ${bookingTheme.borderLight};
  border-radius: 12px;
  background: #fafafa;
`;

const AssignResultRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid ${bookingTheme.borderLight};
  &:last-child {
    border-bottom: none;
  }
`;

const AssignResultMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

const AssignSelectedChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TOGGLE_COLUMN_HELP = {
  search:
    "Keyword search and /search/suggest can match this collection (slug, name, and search aliases). Turn off to hide from free-text search only.",
  iWant:
    "Homepage hero, explore header, and mobile search “I want…” chips. Independent from other placement toggles.",
  featured:
    "Homepage horizontal “featured categories” strip. Separate from “I want…” chips.",
  rows:
    "Homepage collection carousel rows (e.g. “Date night near you”). Off hides from those rows only.",
};

function ToggleColumnHeader({ label, helpKey }) {
  const text = TOGGLE_COLUMN_HELP[helpKey];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>
        {label}
      </span>
      <Tooltip title={text}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            color: colors.textTertiary,
            cursor: "help",
            lineHeight: 0,
          }}
          aria-label={text}
        >
          <CircleHelp size={14} />
        </span>
      </Tooltip>
    </div>
  );
}

function ToggleSettingRow({ title, description, checked, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <Text
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: colors.textPrimary,
            lineHeight: 1.3,
          }}
        >
          {title}
        </Text>
        {description ? (
          <Text
            style={{
              display: "block",
              fontSize: 12,
              color: colors.textSecondary,
              marginTop: 2,
              lineHeight: 1.35,
            }}
          >
            {description}
          </Text>
        ) : null}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

const COLLECTION_FORM_DEFAULTS = {
  name: "",
  slug: "",
  description: "",
  image: [],
  type: "manual",
  ai_criteria: "",
  is_active: true,
  search_aliases: [],
  is_searchable: true,
  show_in_i_want: false,
  show_in_featured_categories: false,
  show_on_homepage_rows: true,
  icon_name: "",
  color: "",
  parent: undefined,
};

function mapCollectionToFormValues(item) {
  if (!item) return { ...COLLECTION_FORM_DEFAULTS };

  return {
    ...COLLECTION_FORM_DEFAULTS,
    name: item.name || "",
    slug: item.slug || "",
    description: item.description || "",
    image: item.image_medium_url
      ? [
          {
            uid: "-1",
            name: "current_image.webp",
            status: "done",
            url: item.image_medium_url,
          },
        ]
      : [],
    is_active: item.is_active !== false,
    type: item.type || "manual",
    ai_criteria: item.automation_rules?.ai_criteria || "",
    search_aliases: Array.isArray(item.search_aliases) ? item.search_aliases : [],
    is_searchable: item.is_searchable !== false,
    show_in_i_want: !!item.show_in_i_want,
    show_in_featured_categories: !!item.show_in_featured_categories,
    show_on_homepage_rows: item.show_on_homepage_rows !== false,
    icon_name: normalizeLucideIconName(item.icon_name) || "",
    color: item.color || "",
    parent:
      item.parent != null && item.parent !== ""
        ? typeof item.parent === "object"
          ? item.parent?.id
          : item.parent
        : undefined,
  };
}

// --- DND & UTILITIES ---
const RowContext = createContext({});
const CollectionTableContext = createContext({ rootIdSet: new Set() });

const DragHandleButton = styled(Button)`
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
`;

const DragHandle = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <DragHandleButton
      type="text"
      size="small"
      ref={setActivatorNodeRef}
      {...listeners}
      icon={<GripVertical size={16} />}
    />
  );
};

const Row = (props) => {
  const { rootIdSet } = useContext(CollectionTableContext);
  const rawKey = props["data-row-key"];
  const rowKey =
    typeof rawKey === "string" && /^\d+$/.test(rawKey) ? Number(rawKey) : rawKey;
  const isRoot =
    rootIdSet.has(rowKey) ||
    (typeof rawKey === "string" && rootIdSet.has(Number(rawKey)));

  if (!isRoot) {
    return <tr {...props} />;
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rowKey });
  const style = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging
      ? {
          position: "relative",
          zIndex: 9999,
          background: "rgba(0,0,0,0.02)",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }
      : {}),
  };
  const contextValue = useMemo(
    () => ({ setActivatorNodeRef, listeners }),
    [setActivatorNodeRef, listeners]
  );
  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
};

// --- Universal Edit Drawer (Collection only) ---
const UniversalEditDrawer = ({
  isVisible,
  onClose,
  data,
  onSave,
  isLoading,
  form,
  parentOptions = [],
  onCoverRemoveIntent,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const typeValue = Form.useWatch("type", form);
  const iconValue = Form.useWatch("icon_name", form);
  const colorValue = Form.useWatch("color", form);
  const [iconSearchQuery, setIconSearchQuery] = useState("");
  const normalizedIconValue = useMemo(
    () => normalizeLucideIconName(iconValue),
    [iconValue],
  );
  const iconPreviewColor = useMemo(() => {
    const raw = String(colorValue ?? "").trim();
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw) ? raw : colors.textSecondary;
  }, [colorValue]);
  const iconOptions = useMemo(() => {
    const results = searchLucideIcons(iconSearchQuery, 80);
    if (normalizedIconValue && !results.includes(normalizedIconValue)) {
      results.unshift(normalizedIconValue);
    }
    return results.map((iconKey) => ({
      value: iconKey,
      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${bookingTheme.borderLight}`,
              background: "#fff",
              flexShrink: 0,
            }}
          >
            <IconPreview iconKey={iconKey} size={15} color={colors.textSecondary} />
          </span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontWeight: 600, color: colors.textPrimary }}>
              {formatLucideIconLabel(iconKey)}
            </span>
            <span style={{ fontSize: 12, color: colors.textSecondary }}>
              {iconKey}
            </span>
          </span>
        </div>
      ),
    }));
  }, [iconSearchQuery, normalizedIconValue]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      setIconSearchQuery("");
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  const renderDrawerContent = () => (
    <CollectionDrawerBodyScroll>
      <Form
        form={form}
        layout="vertical"
        id="universal-edit-form"
        onFinish={onSave}
        initialValues={{
          type: "manual",
          is_active: true,
        }}
        requiredMark={false}
      >
        <FormSectionCard>
          <SectionCardHeading>Basics & cover</SectionCardHeading>
          <Form.Item
            name="name"
            label={<FormLabel>Collection name</FormLabel>}
            rules={[{ required: true }]}
          >
            <Input size="large" placeholder="e.g., Date Night, Under $50" />
          </Form.Item>

          <Form.Item
            name="slug"
            label={
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  color: bookingTheme.textPrimary,
                }}
              >
                Slug
                <Tooltip title="URL-friendly identifier. Auto-generated if left blank.">
                  <InfoIcon size={14} color={colors.textTertiary} />
                </Tooltip>
              </span>
            }
            rules={[
              {
                pattern: /^[a-z0-9-]+$/,
                message: "Lowercase, numbers, and hyphens only.",
              },
            ]}
          >
            <Input
              size="large"
              placeholder="e.g., music, digital-art"
              suffix={
                <Tooltip title="Auto-generate from name">
                  <Button
                    type="text"
                    size="small"
                    icon={<Bot size={18} color={colors.primary} />}
                    onClick={() => {
                      const n = form.getFieldValue("name");
                      if (n)
                        form.setFieldsValue({
                          slug: n
                            .toLowerCase()
                            .replace(/\s+/g, "-")
                            .replace(/[^a-z0-9-]/g, ""),
                        });
                    }}
                  />
                </Tooltip>
              }
            />
          </Form.Item>

          <Form.Item
            name="parent"
            label={<FormLabel>Parent collection</FormLabel>}
            extra={
              <FormHelpText style={{ marginTop: 4 }}>
                Leave empty for a top-level chip on the homepage. Choose a parent to create a
                sub-tag for explore filters (one level deep).
              </FormHelpText>
            }
          >
            <Select
              allowClear
              size="large"
              placeholder="Top-level (no parent)"
              showSearch
              optionFilterProp="label"
              options={parentOptions.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
          </Form.Item>

          <Form.Item label={<FormLabel>Homepage description</FormLabel>}>
            <>
              <FormHelpText style={{ marginTop: 0, marginBottom: 8 }}>
                Shown on the homepage and explore where this collection appears.
              </FormHelpText>
              <Form.Item
                name="description"
                rules={[{ required: true, message: "A description is required." }]}
                noStyle
              >
                <Input.TextArea
                  rows={3}
                  placeholder="e.g., Unleash your inner creative genius with our art classes"
                  style={{ resize: "none" }}
                />
              </Form.Item>
            </>
          </Form.Item>

          <Form.Item
            name="image"
            label={<FormLabel>Cover image</FormLabel>}
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
            rules={[
              {
                required: !data,
                message: "An image is required for new items.",
              },
            ]}
          >
            <Upload
              name="image"
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
              showUploadList={{ showPreviewIcon: false }}
              onRemove={() => {
                onCoverRemoveIntent?.();
                return true;
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Plus size={20} color={colors.textSecondary} />
                <span style={{ fontSize: 13, color: colors.textSecondary }}>
                  Upload
                </span>
              </div>
            </Upload>
          </Form.Item>
        </FormSectionCard>

        <FormSectionCard>
          <SectionCardHeading>Discovery & placement</SectionCardHeading>
          <FormHelpText style={{ marginTop: 0, marginBottom: 16 }}>
            Placement toggles control where this collection appears. The publish
            toggle in the next section acts as a master on/off switch.
          </FormHelpText>
          <Form.Item label={<FormLabel>Search aliases</FormLabel>}>
            <>
              <FormHelpText style={{ marginTop: 0, marginBottom: 8 }}>
                Tokens that map this collection to keyword search (e.g. pottery,
                pizza).
              </FormHelpText>
              <Form.Item
                name="search_aliases"
                normalize={(value) =>
                  (value || [])
                    .map((t) => String(t).toLowerCase().trim())
                    .filter(Boolean)
                }
                noStyle
              >
                <Select
                  mode="tags"
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Type and press Enter — e.g. pottery, ceramics"
                  tokenSeparators={[","]}
                />
              </Form.Item>
            </>
          </Form.Item>

          <Form.Item label={<FormLabel>Collection icon</FormLabel>}>
            <>
              <FormHelpText style={{ marginTop: 0, marginBottom: 8 }}>
                Search valid Lucide icons and preview before saving.
              </FormHelpText>
              <Form.Item name="icon_name" noStyle>
                <Select
                  allowClear
                  showSearch
                  size="large"
                  placeholder="Search icons (e.g. palette, utensils)"
                  options={iconOptions}
                  filterOption={false}
                  onSearch={setIconSearchQuery}
                  onChange={(value) => {
                    const normalized = normalizeLucideIconName(value);
                    form.setFieldValue("icon_name", normalized || "");
                  }}
                  notFoundContent="No matching Lucide icon"
                />
              </Form.Item>
            </>
          </Form.Item>

          <div
            style={{
              marginTop: -8,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "#f8fafc",
                border: `1px solid ${bookingTheme.borderLight}`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconPreview
                iconKey={normalizedIconValue}
                size={18}
                color={iconPreviewColor}
                strokeWidth={2.3}
              />
            </span>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              {normalizedIconValue
                ? `Selected: ${formatLucideIconLabel(normalizedIconValue)}`
                : "Default icon will be used when none is set."}
            </Text>
          </div>

          <Form.Item
            name="color"
            label={<FormLabel>Chip color (hex)</FormLabel>}
          >
            <Input placeholder="#f81e3e" allowClear maxLength={20} size="large" />
          </Form.Item>

          <Form.Item label={<FormLabel>Keyword / suggest</FormLabel>}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                padding: "12px 16px",
                border: `1px solid ${bookingTheme.borderLight}`,
                borderRadius: 12,
                background: bookingTheme.bgSecondary,
              }}
            >
              <Form.Item name="is_searchable" valuePropName="checked" noStyle>
                <ToggleSettingRow
                  title="Include in keyword search"
                  description="Allows keyword search and suggest to match this collection by slug, name, and aliases."
                />
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item label={<FormLabel>“I want…” picker</FormLabel>}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                padding: "12px 16px",
                border: `1px solid ${bookingTheme.borderLight}`,
                borderRadius: 12,
                background: bookingTheme.bgSecondary,
              }}
            >
              <Form.Item name="show_in_i_want" valuePropName="checked" noStyle>
                <ToggleSettingRow
                  title="Show in guided search chips"
                  description="Displays this collection in homepage and mobile “I want…” pickers."
                />
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item label={<FormLabel>Featured categories strip</FormLabel>}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                padding: "12px 16px",
                border: `1px solid ${bookingTheme.borderLight}`,
                borderRadius: 12,
                background: bookingTheme.bgSecondary,
              }}
            >
              <Form.Item
                name="show_in_featured_categories"
                valuePropName="checked"
                noStyle
              >
                <ToggleSettingRow
                  title="Show in featured strip"
                  description="Shows this collection in the homepage featured categories row."
                />
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item label={<FormLabel>Homepage collection rows</FormLabel>}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                padding: "12px 16px",
                border: `1px solid ${bookingTheme.borderLight}`,
                borderRadius: 12,
                background: bookingTheme.bgSecondary,
              }}
            >
              <Form.Item
                name="show_on_homepage_rows"
                valuePropName="checked"
                noStyle
              >
                <ToggleSettingRow
                  title="Show in homepage rows"
                  description="Includes this collection in homepage carousels such as “Date night near you”."
                />
              </Form.Item>
            </div>
          </Form.Item>
        </FormSectionCard>

        <FormSectionCard>
          <SectionCardHeading>How classes are added</SectionCardHeading>
          <Form.Item
            name="type"
            label={<FormLabel>Curation method</FormLabel>}
          >
            <Radio.Group
              buttonStyle="solid"
              size="large"
              style={{ width: "100%" }}
            >
              <Radio.Button
                value="manual"
                style={{ width: "50%", textAlign: "center" }}
              >
                Manual
              </Radio.Button>
              <Radio.Button
                value="automated"
                style={{ width: "50%", textAlign: "center" }}
              >
                <Space size={6}>
                  <BrainCircuit size={16} /> AI automated
                </Space>
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {typeValue === "automated" && (
            <div
              style={{
                background: hexToRgba(colors.purple, 0.04),
                padding: 20,
                borderRadius: 16,
                marginBottom: 16,
                border: `1px solid ${hexToRgba(colors.purple, 0.15)}`,
              }}
            >
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    background: colors.purple,
                    color: "white",
                    padding: 6,
                    borderRadius: 8,
                    height: "fit-content",
                  }}
                >
                  <Bot size={18} />
                </div>
                <div>
                  <Text strong style={{ color: colors.purple, fontSize: 15 }}>
                    AI curator active
                  </Text>
                  <Paragraph
                    style={{
                      margin: 0,
                      color: colors.textSecondary,
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    Saving does not run the AI curator. Use the refresh icon in the
                    Actions column for this row to queue Gemini across all active classes.
                  </Paragraph>
                </div>
              </div>

              <Form.Item
                name="ai_criteria"
                label={
                  <span style={{ fontWeight: 600, color: colors.textPrimary }}>
                    Criteria instructions
                  </span>
                }
                rules={[
                  {
                    required: true,
                    message: "Please describe the criteria for the AI.",
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="e.g. 'Classes suitable for romantic dates, involving wine tasting, pottery, or salsa dancing. Should be for adults.'"
                  style={{
                    borderRadius: 12,
                    borderColor: hexToRgba(colors.purple, 0.2),
                  }}
                />
              </Form.Item>
            </div>
          )}

        </FormSectionCard>

        <FormSectionCard>
          <SectionCardHeading>Publishing</SectionCardHeading>
          <Form.Item label={<FormLabel>Collection is published</FormLabel>}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                padding: "12px 16px",
                border: `1px solid ${bookingTheme.borderLight}`,
                borderRadius: 12,
                background: bookingTheme.bgSecondary,
              }}
            >
              <Form.Item name="is_active" valuePropName="checked" noStyle>
                <ToggleSettingRow
                  title="Visible to customers"
                  description="Master visibility switch. When off, the collection is hidden everywhere, regardless of placement toggles."
                />
              </Form.Item>
            </div>
          </Form.Item>
        </FormSectionCard>
      </Form>
    </CollectionDrawerBodyScroll>
  );

  const drawerFooter = (
    <>
      <Button
        onClick={onClose}
        disabled={isLoading}
        size="middle"
        style={{ borderRadius: 10 }}
      >
        Cancel
      </Button>
      <Button
        type="primary"
        htmlType="submit"
        form="universal-edit-form"
        loading={isLoading}
        key={`btn-${isLoading}`}
        size="middle"
        style={{ borderRadius: 10, padding: "0 32px" }}
      >
        {data ? "Save Changes" : "Create Collection"}
      </Button>
    </>
  );

  const drawerTitle = data ? "Edit collection" : "Create new collection";

  const drawerInner = (
    <>
      <CollectionDrawerHeader>
        <Title level={4} style={{ margin: 0 }}>
          {drawerTitle}
        </Title>
        <CollectionDrawerCloseBtn
          type="text"
          icon={<X size={20} />}
          onClick={onClose}
          aria-label="Close"
        />
      </CollectionDrawerHeader>
      {renderDrawerContent()}
      <CollectionDrawerFooterBar>{drawerFooter}</CollectionDrawerFooterBar>
    </>
  );

  const onOpenChange = (open) => {
    if (!open) onClose();
  };

  return isMobile ? (
    <VaulDrawer.Root open={isVisible} onOpenChange={onOpenChange} dismissible>
      <VaulDrawer.Portal>
        <CollectionDrawerOverlay />
        <CollectionMobileDrawerContent>
          <CollectionDrawerHandle />
          {drawerInner}
        </CollectionMobileDrawerContent>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  ) : (
    <VaulDrawer.Root
      open={isVisible}
      onOpenChange={onOpenChange}
      direction="right"
      dismissible
    >
      <VaulDrawer.Portal>
        <CollectionDrawerOverlay />
        <CollectionDesktopDrawerContent>
          {drawerInner}
        </CollectionDesktopDrawerContent>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
};

// --- Main Component (Collections only) ---
const CollectionsManagement = () => {
  const [collections, setCollections] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditDrawerVisible, setIsEditDrawerVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkTarget, setBulkTarget] = useState(null);
  const [assignQuery, setAssignQuery] = useState("");
  const [assignResults, setAssignResults] = useState([]);
  const [assignSearching, setAssignSearching] = useState(false);
  const [assignSelected, setAssignSelected] = useState([]);
  /** True only after user removes the cover in the drawer; avoids wiping S3/image on save when fileList is empty. */
  const coverRemovalIntendedRef = useRef(false);

  const runAssignSearch = useCallback(async (q) => {
    const trimmed = (q || "").trim();
    if (trimmed.length < 2) {
      setAssignResults([]);
      return;
    }
    setAssignSearching(true);
    try {
      const res = await classManagementService.getClasses({
        search: trimmed,
        page_size: 20,
        page: 1,
      });
      if (res.success) {
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : raw?.results ?? [];
        setAssignResults(list);
      } else {
        setAssignResults([]);
      }
    } catch {
      setAssignResults([]);
    } finally {
      setAssignSearching(false);
    }
  }, []);

  const debouncedAssignSearch = useMemo(
    () => debounce((q) => runAssignSearch(q), 380),
    [runAssignSearch],
  );

  useEffect(
    () => () => debouncedAssignSearch.cancel(),
    [debouncedAssignSearch],
  );

  useEffect(() => {
    if (!bulkModalOpen) return;
    debouncedAssignSearch(assignQuery);
  }, [assignQuery, bulkModalOpen, debouncedAssignSearch]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await classManagementService.getClassAnalytics();
      if (response.success) {
        setDashboardStats(response.data);
      } else {
        message.error(response.error || "Failed to fetch dashboard stats");
      }
    } catch (e) {
      console.error("Fetch dashboard stats error:", e);
      message.error("Error fetching dashboard stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await classManagementService.getCollections();
      if (response.success) {
        setCollections(response.data || []);
      } else {
        message.error(response.error || "Failed to fetch collections");
        setCollections([]);
      }
    } catch (e) {
      console.error("Fetch collections error:", e);
      message.error("Error fetching collections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleReclassifyCollection = useCallback(async (col) => {
    if (!col?.id || col.type !== "automated") return;
    setActionLoading(true);
    message.loading({
      content: "Queueing Gemini curator…",
      key: "reclassify",
      duration: 0,
    });
    try {
      const res = await classManagementService.reclassifyAutomatedCollection(col.id);
      if (res.success) {
        message.success({
          content:
            "AI curator queued — membership updates apply when Celery workers finish.",
          key: "reclassify",
          duration: 5,
        });
      } else {
        const detail =
          typeof res.error === "string"
            ? res.error
            : res.error?.detail || "Failed to queue curator";
        message.error({ content: detail, key: "reclassify", duration: 5 });
      }
    } catch (e) {
      message.error({
        content: "Failed to queue curator",
        key: "reclassify",
        duration: 4,
      });
    } finally {
      message.destroy("reclassify");
      setActionLoading(false);
    }
  }, []);

  const patchCollectionField = useCallback(async (col, partial) => {
    setActionLoading(true);
    try {
      const res = await classManagementService.updateCollection(col.id, partial);
      if (res.success) {
        message.success("Updated");
        setCollections((prev) =>
          prev.map((c) => (c.id === col.id ? { ...c, ...partial } : c)),
        );
      } else {
        message.error(res.error || "Failed to update");
        fetchCollections();
      }
    } catch (e) {
      message.error("Update failed");
      fetchCollections();
    } finally {
      setActionLoading(false);
    }
  }, [fetchCollections]);

  const parentOptions = useMemo(
    () =>
      collections
        .filter(
          (c) =>
            (c.parent == null || c.parent === undefined) &&
            c.id !== selectedItem?.id,
        )
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [collections, selectedItem],
  );

  const orderedCollections = useMemo(() => {
    const roots = collections
      .filter((c) => c.parent == null || c.parent === undefined)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const out = [];
    const seen = new Set();
    for (const r of roots) {
      out.push(r);
      seen.add(r.id);
      const kids = collections
        .filter((c) => c.parent === r.id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      for (const k of kids) {
        out.push(k);
        seen.add(k.id);
      }
    }
    for (const c of collections) {
      if (!seen.has(c.id)) out.push(c);
    }
    return out;
  }, [collections]);

  const rootIdSet = useMemo(
    () =>
      new Set(
        collections
          .filter((c) => c.parent == null || c.parent === undefined)
          .map((c) => c.id),
      ),
    [collections],
  );

  const rootIdsOrdered = useMemo(
    () =>
      orderedCollections
        .filter((c) => c.parent == null || c.parent === undefined)
        .map((c) => c.id),
    [orderedCollections],
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!active?.id || !over?.id || active.id === over.id) return;
    setCollections((prev) => {
      const rootsOnly = prev
        .filter((c) => c.parent == null || c.parent === undefined)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      const oldIndex = rootsOnly.findIndex((c) => c.id === active.id);
      const newIndex = rootsOnly.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const newRoots = arrayMove(rootsOnly, oldIndex, newIndex).map((r, i) => ({
        ...r,
        sort_order: i,
      }));
      updateOrder(newRoots);
      const nonRoots = prev.filter((c) => c.parent != null && c.parent !== undefined);
      return [...newRoots, ...nonRoots];
    });
  };

  const updateOrder = async (items) => {
    setActionLoading(true);
    try {
      const updatePayload = items.map((item, index) => ({
        id: item.id,
        order: index,
      }));
      const response = await classManagementService.updateCollectionOrder(updatePayload);
      if (response?.success) {
        message.success("Collection order updated.");
      } else {
        message.error("Failed to update order. Reverting changes.");
        fetchCollections();
      }
    } catch (error) {
      message.error("An error occurred while updating order.");
      fetchCollections();
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteCollection = (col) => {
    Modal.confirm({
      title: "Delete Collection?",
      content: `Are you sure you want to delete "${col.name}"? Classes will remain but won't be in this collection anymore.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        setActionLoading(true);
        const res = await classManagementService.deleteCollection(col.id);
        if (res.success) {
          message.success("Collection deleted");
          fetchCollections();
        } else {
          message.error(res.error || "Failed to delete");
        }
        setActionLoading(false);
      },
    });
  };

  const handleSaveItem = async () => {
    try {
      const values = await editForm.validateFields();
      setActionLoading(true);
      message.loading({
        content: "Saving...",
        key: "saveAction",
        duration: 0,
      });

      let imageS3Payload = undefined;
      const imageFileObject = values.image?.[0];

      if (imageFileObject?.originFileObj) {
        const fileToUpload = imageFileObject.originFileObj;
        message.loading({
          content: "Uploading image...",
          key: "imageUpload",
          duration: 0,
        });
        const uploadResult = await uploadService.uploadFile(
          fileToUpload,
          "collection_image"
        );

        if (uploadResult.success) {
          imageS3Payload = uploadResult.s3_key;
          message.success({
            content: "Image uploaded!",
            key: "imageUpload",
            duration: 1.5,
          });
        } else {
          message.error({
            content: uploadResult.error || "Image upload failed.",
            key: "imageUpload",
            duration: 3,
          });
          setActionLoading(false);
          message.destroy("saveAction");
          return;
        }
      } else if (selectedItem && coverRemovalIntendedRef.current) {
        imageS3Payload = null;
      }

      const safeValues = {
        ...COLLECTION_FORM_DEFAULTS,
        ...values,
      };

      const payload = {
        name: String(safeValues.name || "").trim(),
        description: String(safeValues.description || "").trim(),
      };

      const normalizedSlug = String(safeValues.slug || "")
        .trim()
        .toLowerCase();
      if (normalizedSlug) {
        payload.slug = normalizedSlug;
      }

      if (imageS3Payload !== undefined) {
        payload.image_s3_key = imageS3Payload;
      }

      payload.is_active = safeValues.is_active !== false;
      payload.type = safeValues.type;
      if (safeValues.type === "automated") {
        payload.automation_rules = {
          ai_criteria: String(safeValues.ai_criteria || "").trim(),
        };
      } else {
        payload.automation_rules = {};
      }

      payload.search_aliases = Array.isArray(safeValues.search_aliases)
        ? safeValues.search_aliases
            .map((token) => String(token || "").trim().toLowerCase())
            .filter(Boolean)
        : [];
      payload.is_searchable = safeValues.is_searchable !== false;
      payload.show_in_i_want = !!safeValues.show_in_i_want;
      payload.show_in_featured_categories = !!safeValues.show_in_featured_categories;
      payload.show_on_homepage_rows = safeValues.show_on_homepage_rows !== false;
      payload.icon_name = normalizeLucideIconName(safeValues.icon_name) || "";
      payload.color = String(safeValues.color || "").trim();
      payload.parent = safeValues.parent ?? null;

      const response = selectedItem
        ? await classManagementService.updateCollection(selectedItem.id, payload)
        : await classManagementService.createCollection(payload);

      if (response.success) {
        message.success({
          content: "Saved successfully",
          key: "saveAction",
          duration: 2,
        });
        setIsEditDrawerVisible(false);
        fetchCollections();
        fetchDashboardStats();
      } else {
        message.error({
          content: response.error || "Failed to save",
          key: "saveAction",
          duration: 4,
        });
      }
    } catch (e) {
      console.error("Save error:", e);
      if (e.errorFields) message.error("Please fill all required fields.");
    } finally {
      setActionLoading(false);
      message.destroy("imageUpload");
    }
  };

  const openDrawer = (item = null) => {
    coverRemovalIntendedRef.current = false;
    setSelectedItem(item);
    editForm.resetFields();
    editForm.setFieldsValue(mapCollectionToFormValues(item));
    setIsEditDrawerVisible(true);
  };

  const collectionColumns = [
    {
      key: "sort",
      width: 50,
      fixed: "left",
      render: (_, col) =>
        col.parent != null && col.parent !== undefined ? (
          <span style={{ display: "inline-block", width: 22 }} aria-hidden />
        ) : (
          <DragHandle />
        ),
    },
    {
      title: "Collection",
      key: "name",
      render: (_, col) => {
        const isChild = col.parent != null && col.parent !== undefined;
        return (
          <Space style={{ marginLeft: isChild ? 8 : 0 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                backgroundColor: col.is_active
                  ? colors.success
                  : colors.textTertiary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Sparkles size={14} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  color: colors.textPrimary,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {isChild ? (
                  <Tag
                    style={{ margin: 0, fontSize: 10, lineHeight: "16px" }}
                    color="default"
                  >
                    Sub
                  </Tag>
                ) : null}
                {col.name}
                {col.type === "automated" && (
                  <Tag
                    color="purple"
                    style={{ margin: 0, fontSize: 10, lineHeight: "16px" }}
                  >
                    <Bot size={10} style={{ marginRight: 4 }} />
                    Auto
                  </Tag>
                )}
              </div>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>
                /{col.slug}
              </div>
              {col.parent_name ? (
                <div
                  style={{
                    fontSize: 11,
                    color: colors.textTertiary,
                    marginTop: 2,
                  }}
                >
                  Under {col.parent_name}
                </div>
              ) : null}
            </div>
          </Space>
        );
      },
    },
    {
      title: "Classes",
      dataIndex: "class_count",
      key: "class_count",
      align: "center",
      render: (val) => <Tag color="blue">{val || 0} classes</Tag>,
    },
    {
      title: <ToggleColumnHeader label="Search" helpKey="search" />,
      key: "is_searchable",
      width: 88,
      align: "center",
      render: (_, col) => (
        <Switch
          size="small"
          checked={col.is_searchable !== false}
          onChange={(checked) =>
            patchCollectionField(col, { is_searchable: checked })
          }
        />
      ),
    },
    {
      title: <ToggleColumnHeader label="I want" helpKey="iWant" />,
      key: "show_in_i_want",
      width: 88,
      align: "center",
      render: (_, col) => (
        <Switch
          size="small"
          checked={!!col.show_in_i_want}
          onChange={(checked) =>
            patchCollectionField(col, { show_in_i_want: checked })
          }
        />
      ),
    },
    {
      title: <ToggleColumnHeader label="Featured" helpKey="featured" />,
      key: "show_in_featured_categories",
      width: 88,
      align: "center",
      render: (_, col) => (
        <Switch
          size="small"
          checked={!!col.show_in_featured_categories}
          onChange={(checked) =>
            patchCollectionField(col, {
              show_in_featured_categories: checked,
            })
          }
        />
      ),
    },
    {
      title: <ToggleColumnHeader label="Rows" helpKey="rows" />,
      key: "show_on_homepage_rows",
      width: 88,
      align: "center",
      render: (_, col) => (
        <Switch
          size="small"
          checked={col.show_on_homepage_rows !== false}
          onChange={(checked) =>
            patchCollectionField(col, { show_on_homepage_rows: checked })
          }
        />
      ),
    },
    {
      title: "Assign",
      key: "bulk_assign",
      width: 72,
      align: "center",
      render: (_, col) => (
        <Button
          type="text"
          size="small"
          icon={<UserPlus size={18} />}
          title="Assign classes to this collection"
          onClick={() => {
            setBulkTarget(col);
            setAssignQuery("");
            setAssignResults([]);
            setAssignSelected([]);
            setBulkModalOpen(true);
          }}
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 100,
      render: (isActive) =>
        isActive ? (
          <Tag color="success">Active</Tag>
        ) : (
          <Tag color="default">Hidden</Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 148,
      align: "right",
      render: (_, col) => (
        <Space size={4}>
          {col.type === "automated" ? (
            <Tooltip title="Run Gemini curator for this collection (all active classes)">
              <Button
                type="text"
                size="small"
                icon={<RefreshCw size={16} />}
                onClick={() => handleReclassifyCollection(col)}
                aria-label={`Run AI curator for ${col.name}`}
              />
            </Tooltip>
          ) : null}
          <Button icon={<Edit size={16} />} onClick={() => openDrawer(col)} />
          <Button
            danger
            icon={<Trash2 size={16} />}
            onClick={() => confirmDeleteCollection(col)}
          />
        </Space>
      ),
    },
  ];

  const statCardsData = [
    {
      title: "Total Collections",
      value: collections.length,
      icon: Layers,
      color: colors.info,
      footer: "Platform-wide",
    },
    {
      title: "Active on Homepage",
      value: collections.filter((c) => c.is_active).length,
      icon: Sparkles,
      color: colors.success,
      footer: "Visible to users",
    },
    {
      title: "Total Active Classes",
      value: dashboardStats?.activeClasses,
      icon: BookOpen,
      color: colors.warning,
      footer: "Currently listed",
    },
    {
      title: "Largest Collection",
      value: collections.length
        ? collections.reduce((a, b) =>
            (a.class_count || 0) >= (b.class_count || 0) ? a : b
          )?.name
        : "—",
      icon: BarChart2,
      color: "#8b5cf6",
      footer: `${
        collections.length
          ? Math.max(...collections.map((c) => c.class_count || 0), 0)
          : 0
      } classes`,
    },
  ];

  return (
    <ThemeProvider theme={appTheme}>
      <ConfigProvider theme={antdComponentTheme}>
        <DashboardWrapper>
          <DashboardHeader>
            <div>
              <PageTitle>Collections</PageTitle>
              <HeaderSubtitle>
                Manage curated lists (e.g. Date Night, Under $50). Manual or AI automated.
              </HeaderSubtitle>
            </div>
          </DashboardHeader>

          <Divider />

          <div style={{ marginBottom: "20px" }}>
            <SectionTitle>
              <BarChart2 size={20} color={colors.primary} />
              Platform Overview
            </SectionTitle>
            <HelpText>
              Collections appear on the homepage and explore. Classes can belong to multiple collections.
            </HelpText>
          </div>

          <AdminMetricCards
            cards={statCardsData}
            loading={statsLoading}
            isReadyForAnimation
          />

          <Divider />

          <TableSection>
            <TableHeader>
              <div style={{ flex: 1 }}>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  Drag rows to reorder. Hover the{" "}
                  <CircleHelp
                    size={14}
                    style={{ verticalAlign: "text-bottom", opacity: 0.65 }}
                  />{" "}
                  icon on a column header to see what each toggle does.
                </Text>
              </div>
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => openDrawer(null)}
              >
                Add Collection
              </Button>
            </TableHeader>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <CollectionTableContext.Provider value={{ rootIdSet }}>
                <SortableContext
                  items={rootIdsOrdered}
                  strategy={verticalListSortingStrategy}
                >
                  <Table
                    columns={collectionColumns}
                    dataSource={orderedCollections}
                    rowKey="id"
                    loading={loading}
                    components={{ body: { row: Row } }}
                    pagination={false}
                  />
                </SortableContext>
              </CollectionTableContext.Provider>
            </DndContext>
          </TableSection>

          <Modal
            title={
              <ModalTitleWrapper>
                <UserPlus size={22} color={colors.primary} />
                {bulkTarget
                  ? `Add classes to “${bulkTarget.name}”`
                  : "Add classes"}
              </ModalTitleWrapper>
            }
            open={bulkModalOpen}
            width={520}
            styles={{ body: { paddingTop: 12 } }}
            onCancel={() => {
              setBulkModalOpen(false);
              setBulkTarget(null);
            }}
            okText={`Add${assignSelected.length ? ` (${assignSelected.length})` : ""}`}
            confirmLoading={actionLoading}
            okButtonProps={{ disabled: assignSelected.length === 0 }}
            onOk={async () => {
              if (!bulkTarget) return;
              const ids = assignSelected.map((c) => c.classId);
              if (!ids.length) {
                message.warning("Select at least one class.");
                return;
              }
              setActionLoading(true);
              const res = await classManagementService.bulkAssignCollectionClasses(
                bulkTarget.id,
                ids,
              );
              setActionLoading(false);
              if (res.success) {
                message.success(
                  `Added ${res.data?.added ?? 0} class(es) to collection.`,
                );
                setBulkModalOpen(false);
                setBulkTarget(null);
                fetchCollections();
              } else {
                message.error(res.error || "Bulk assign failed");
              }
            }}
          >
            <AssignModalBody>
              <Text type="secondary" style={{ fontSize: 13, display: "block" }}>
                Search by class title, host, or location. Results load as you type
                (at least 2 characters).
              </Text>
              {assignSelected.length > 0 ? (
                <AssignSelectedChips>
                  {assignSelected.map((c) => (
                    <Tag
                      key={c.classId}
                      closable
                      onClose={() =>
                        setAssignSelected((prev) =>
                          prev.filter((x) => x.classId !== c.classId),
                        )
                      }
                      style={{ margin: 0, maxWidth: "100%" }}
                    >
                      <span style={{ fontWeight: 600 }}>#{c.classId}</span>{" "}
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 220,
                          display: "inline-block",
                          verticalAlign: "bottom",
                        }}
                      >
                        {c.title}
                      </span>
                    </Tag>
                  ))}
                </AssignSelectedChips>
              ) : null}
              <AssignSearchWrap>
                <Input
                  allowClear
                  size="middle"
                  prefix={<Search size={16} style={{ color: colors.textTertiary }} />}
                  suffix={
                    assignSearching ? <Spin size="small" style={{ marginRight: 4 }} /> : null
                  }
                  placeholder="Search classes…"
                  value={assignQuery}
                  onChange={(e) => setAssignQuery(e.target.value)}
                  style={{ borderRadius: 10 }}
                />
              </AssignSearchWrap>
              <AssignResultsList>
                {assignQuery.trim().length < 2 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    styles={{ root: { margin: "16px 0" } }}
                    description="Type 2+ characters to search"
                  />
                ) : assignSearching ? (
                  <div
                    style={{
                      padding: 24,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Skeleton active paragraph={{ rows: 2 }} title={false} />
                  </div>
                ) : assignResults.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    styles={{ root: { margin: "16px 0" } }}
                    description="No classes match"
                  />
                ) : (
                  assignResults.map((row) => {
                    const thumb =
                      row.images?.[0]?.image_thumb_url ||
                      row.images?.[0]?.image_medium_url;
                    const selected = assignSelected.some(
                      (s) => s.classId === row.classId,
                    );
                    const inThisCollection =
                      bulkTarget &&
                      Array.isArray(row.collections) &&
                      row.collections.some((c) => c.id === bulkTarget.id);
                    return (
                      <AssignResultRow key={row.classId}>
                        <Avatar
                          src={thumb}
                          size={40}
                          shape="square"
                          style={{ borderRadius: 8, flexShrink: 0 }}
                        >
                          <BookOpen size={18} />
                        </Avatar>
                        <AssignResultMeta>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
                              color: colors.textPrimary,
                              lineHeight: 1.3,
                            }}
                          >
                            {row.title}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: colors.textSecondary,
                              marginTop: 2,
                            }}
                          >
                            #{row.classId}
                            {row.business_name
                              ? ` · ${row.business_name}`
                              : ""}
                            {row.status ? (
                              <Tag
                                style={{ marginLeft: 6, fontSize: 10 }}
                                color={
                                  row.status === "active" ? "green" : "default"
                                }
                              >
                                {row.status}
                              </Tag>
                            ) : null}
                          </div>
                        </AssignResultMeta>
                        <Button
                          type={
                            selected || inThisCollection ? "default" : "primary"
                          }
                          size="small"
                          disabled={selected || inThisCollection}
                          onClick={() => {
                            setAssignSelected((prev) => {
                              if (prev.some((p) => p.classId === row.classId))
                                return prev;
                              return [
                                ...prev,
                                {
                                  classId: row.classId,
                                  title: row.title,
                                  business_name: row.business_name,
                                },
                              ];
                            });
                          }}
                          style={{ borderRadius: 8, flexShrink: 0 }}
                        >
                          {inThisCollection
                            ? "In collection"
                            : selected
                              ? "Added"
                              : "Add"}
                        </Button>
                      </AssignResultRow>
                    );
                  })
                )}
              </AssignResultsList>
            </AssignModalBody>
          </Modal>

          <UniversalEditDrawer
            isVisible={isEditDrawerVisible}
            onClose={() => setIsEditDrawerVisible(false)}
            data={selectedItem}
            onSave={handleSaveItem}
            isLoading={actionLoading}
            form={editForm}
            parentOptions={parentOptions}
            onCoverRemoveIntent={() => {
              coverRemovalIntendedRef.current = true;
            }}
          />
        </DashboardWrapper>
      </ConfigProvider>
    </ThemeProvider>
  );
};

export default CollectionsManagement;
