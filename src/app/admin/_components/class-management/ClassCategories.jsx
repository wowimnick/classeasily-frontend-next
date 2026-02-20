"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
  createContext,
} from "react";
import styled, { ThemeProvider } from "styled-components";
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
  X,
  Sparkles,
  Layers,
  Bot,
  BrainCircuit,
} from "lucide-react";
import { classManagementService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import { uploadService } from "@/services/apiService";
import { motion } from "framer-motion";
import { Drawer } from "vaul";
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

const { Title: AntTitle, Text, Paragraph } = Typography;
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

// --- DASHBOARD COMPONENTS (Restored to Original Design) ---
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
  box-shadow: inset 0px -1px 11px 1px #0000000d;
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
`;

const StatCard = styled(Card)`
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  transition: all 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  .ant-card-body {
    padding: 20px !important;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }
`;

const StatHeader = styled.div`
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
  background: ${(props) => props.background};
  color: ${(props) => props.color};
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${colors.textPrimary};
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: block;
  margin-top: 4px;
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

const TableDescription = styled(Paragraph)`
  margin: 0 !important;
  color: ${colors.textSecondary};
  font-size: 14px;
  max-width: 600px;
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

const SectionTitle = styled(AntTitle).attrs({ level: 5 })`
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

// --- NEW REDESIGNED DRAWER STYLES (Only these are changed) ---
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  z-index: 1049;
  animation: fadeIn 0.2s ease-out;
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 28px 28px 0 0;
  height: 92%;
  max-height: 96vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.12);

  &:after {
    content: "";
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 4px;
    background: #e2e8f0;
    border-radius: 2px;
  }
`;

const DesktopDrawerContent = styled(Drawer.Content)`
  right: 20px;
  top: 20px;
  bottom: 20px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: 650px; /* Wider width */
  display: flex;
  max-width: calc(100vw - 40px);
`;

const DesktopDrawerInner = styled.div`
  background: white;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid ${colors.border};
  overflow: hidden;
`;

const DrawerHeader = styled.div`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid ${colors.border};
  padding: 24px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  z-index: 10;
`;

const DrawerHeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${colors.textPrimary};
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const CloseButton = styled.button`
  padding: 8px;
  border-radius: 50%;
  border: 1px solid ${colors.border};
  background: white;
  color: ${colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${colors.lightBg};
    color: ${colors.textPrimary};
    transform: scale(1.05);
  }
  &:active {
    transform: scale(0.95);
  }
`;

const DrawerFormContainer = styled.div`
  padding: 32px;
  overflow-y: auto;
  flex: 1;
`;

const DrawerFooter = styled.div`
  padding: 24px 32px;
  border-top: 1px solid ${colors.border};
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  flex-shrink: 0;
  background: #fcfcfc;
`;

const DrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

// --- DND & UTILITIES ---
const RowContext = createContext({});

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
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props["data-row-key"] });
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
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const typeValue = Form.useWatch("type", form);

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

  if (!shouldRender) return null;

  const renderDrawerContent = () => (
    <>
      <DrawerHeader>
        <DrawerHeaderTitle>
          {data ? "Edit Collection" : "Add New Collection"}
        </DrawerHeaderTitle>
        <CloseButton onClick={onClose} aria-label="Close">
          <X size={20} />
        </CloseButton>
      </DrawerHeader>

      <DrawerFormContainer>
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
          <Form.Item
            name="name"
            label={<span style={{ fontWeight: 600 }}>Collection Name</span>}
            rules={[{ required: true }]}
          >
            <Input size="middle" placeholder="e.g., Date Night, Under $50" />
          </Form.Item>

          <Form.Item
            name="slug"
            label={
              <Space>
                <span style={{ fontWeight: 600 }}>Slug</span>
                <Tooltip title="URL-friendly identifier. Auto-generated if left blank.">
                  <InfoIcon size={14} color={colors.textTertiary} />
                </Tooltip>
              </Space>
            }
            rules={[
              {
                pattern: /^[a-z0-9-]+$/,
                message: "Lowercase, numbers, and hyphens only.",
              },
            ]}
          >
            <Input
              size="middle"
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
            name="description"
            label={
              <span style={{ fontWeight: 600 }}>Homepage Description</span>
            }
            rules={[{ required: true, message: "A description is required." }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="e.g., Unleash your inner creative genius with our art classes"
              style={{ resize: "none" }}
            />
          </Form.Item>

          <Form.Item
            name="image"
            label={<span style={{ fontWeight: 600 }}>Cover Image</span>}
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

          <div style={{ marginTop: 32 }}>
              <Divider
                orientation="left"
                style={{ borderColor: colors.border }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    fontWeight: 600,
                  }}
                >
                  Collection Settings
                </span>
              </Divider>

              <Form.Item
                name="type"
                label={<span style={{ fontWeight: 600 }}>Curation Method</span>}
                tooltip="How should classes be added to this collection?"
              >
                <Radio.Group
                  buttonStyle="solid"
                  size="middle"
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
                      <BrainCircuit size={16} /> AI Automated
                    </Space>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              {typeValue === "automated" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    style={{
                      background: hexToRgba(colors.purple, 0.04),
                      padding: 20,
                      borderRadius: 16,
                      marginBottom: 24,
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
                        <Text
                          strong
                          style={{ color: colors.purple, fontSize: 15 }}
                        >
                          AI Curator Active
                        </Text>
                        <Paragraph
                          style={{
                            margin: 0,
                            color: colors.textSecondary,
                            fontSize: 13,
                            marginTop: 4,
                          }}
                        >
                          The system will automatically find and add classes
                          matching your criteria.
                        </Paragraph>
                      </div>
                    </div>

                    <Form.Item
                      name="ai_criteria"
                      label={
                        <span
                          style={{ fontWeight: 600, color: colors.textPrimary }}
                        >
                          Criteria Instructions
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
                </motion.div>
              )}

              <Form.Item
                name="is_active"
                label={<span style={{ fontWeight: 600 }}>Visibility</span>}
                valuePropName="checked"
                style={{ marginTop: 24 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                  }}
                >
                  <span style={{ fontSize: 14 }}>Show on Homepage</span>
                  <Switch />
                </div>
              </Form.Item>
            </div>
        </Form>
      </DrawerFormContainer>

      <DrawerFooter>
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
      </DrawerFooter>
    </>
  );

  return (
    <Drawer.Root
      open={isVisible}
      onOpenChange={(open) => !open && onClose()}
      direction={isMobile ? "bottom" : "right"}
      dismissible
    >
      <Drawer.Portal>
        <StyledDrawerOverlay />
        {isMobile ? (
          <StyledDrawerContent>
            <DrawerHandle />
            {renderDrawerContent()}
          </StyledDrawerContent>
        ) : (
          <DesktopDrawerContent>
            <DesktopDrawerInner>{renderDrawerContent()}</DesktopDrawerInner>
          </DesktopDrawerContent>
        )}
      </Drawer.Portal>
    </Drawer.Root>
  );
};

// --- Main Component (Collections only) ---
const ClassCategories = () => {
  const [collections, setCollections] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditDrawerVisible, setIsEditDrawerVisible] = useState(false);
  const [editForm] = Form.useForm();

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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setCollections((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === active.id);
        const newIndex = prev.findIndex((c) => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const newArray = arrayMove(prev, oldIndex, newIndex);
        updateOrder(newArray);
        return newArray;
      });
    }
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

      let imageS3Key = undefined;
      const imageFileObject = values.image?.[0];

      if (imageFileObject && imageFileObject.originFileObj) {
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
          imageS3Key = uploadResult.s3_key;
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
      } else if (values.image === undefined || values.image.length === 0) {
        imageS3Key = null;
      }

      const payload = {
        name: values.name,
        description: values.description,
        ...(values.slug && { slug: values.slug }),
      };

      if (imageS3Key !== undefined) {
        payload.image_s3_key = imageS3Key;
      }

      payload.is_active = values.is_active;
      payload.type = values.type;
      if (values.type === "automated") {
        payload.automation_rules = { ai_criteria: values.ai_criteria };
      } else {
        payload.automation_rules = {};
      }

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
    setSelectedItem(item);
    if (item) {
      const fileList = item.image_medium_url
        ? [
            {
              uid: "-1",
              name: "current_image.webp",
              status: "done",
              url: item.image_medium_url,
            },
          ]
        : [];

      editForm.setFieldsValue({
        name: item.name,
        slug: item.slug,
        description: item.description,
        image: fileList,
        is_active: item.is_active,
        type: item.type || "manual",
        ai_criteria: item.automation_rules?.ai_criteria,
      });
    } else {
      editForm.resetFields();
      editForm.setFieldsValue({
        is_active: true,
        type: "manual",
        image: [],
      });
    }
    setIsEditDrawerVisible(true);
  };

  const collectionColumns = [
    { key: "sort", width: 50, fixed: "left", render: () => <DragHandle /> },
    {
      title: "Collection",
      key: "name",
      render: (_, col) => (
        <Space>
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
              }}
            >
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
          </div>
        </Space>
      ),
    },
    {
      title: "Classes",
      dataIndex: "class_count",
      key: "class_count",
      align: "center",
      render: (val) => <Tag color="blue">{val || 0} classes</Tag>,
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
      width: 100,
      align: "right",
      render: (_, col) => (
        <Space>
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

          <StatsGrid>
            {statCardsData.map((stat) => (
              <StatCard key={stat.title}>
                {statsLoading ? (
                  <Skeleton active paragraph={{ rows: 2 }} />
                ) : (
                  <>
                    <StatHeader>
                      <IconContainer
                        color={stat.color}
                        background={hexToRgba(stat.color, 0.1)}
                      >
                        <stat.icon size={18} />
                      </IconContainer>
                    </StatHeader>
                    <div>
                      <StatValue>{stat.value ?? "N/A"}</StatValue>
                      <StatLabel>{stat.title}</StatLabel>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                          marginTop: 4,
                        }}
                      >
                        {stat.footer}
                      </Text>
                    </div>
                  </>
                )}
              </StatCard>
            ))}
          </StatsGrid>

          <Divider />

          <TableSection
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <TableHeader>
              <div style={{ flex: 1 }}>
                <TableDescription>
                  Curated lists like "Date Night" or "Under $50". Can be manual or AI automated. Drag to reorder.
                </TableDescription>
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
              <SortableContext
                items={collections.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <Table
                  columns={collectionColumns}
                  dataSource={collections}
                  rowKey="id"
                  loading={loading}
                  components={{ body: { row: Row } }}
                  pagination={false}
                />
              </SortableContext>
            </DndContext>
          </TableSection>

          <UniversalEditDrawer
            isVisible={isEditDrawerVisible}
            onClose={() => setIsEditDrawerVisible(false)}
            data={selectedItem}
            onSave={handleSaveItem}
            isLoading={actionLoading}
            form={editForm}
          />
        </DashboardWrapper>
      </ConfigProvider>
    </ThemeProvider>
  );
};

export default ClassCategories;
