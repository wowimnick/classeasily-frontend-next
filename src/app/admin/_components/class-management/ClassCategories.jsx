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
import { Table, Card, Input, Button, ConfigProvider, Tag, Space, Modal, Form, Divider, Empty, Typography, Tooltip, ColorPicker, Grid, Popconfirm, Spin, Skeleton, Select, Switch, Upload,  } from 'antd';
import message from '@/lib/message';
import * as allIcons from "lucide-react";
import { theme as antdComponentTheme } from "@/components/theme";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Tag as TagIcon,
  Grid as GridIcon,
  BookOpen,
  BarChart2,
  Copy,
  Info as InfoIcon,
  AlertTriangle,
  Edit2,
  PieChart as PieChartIcon,
  ArrowLeft,
  Book,
  PenLine,
  GripVertical,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { classManagementService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import {
  GlobalLoaderWithInlineStyles,
  GlobalLoaderWithoutInlineStyles,
} from "@/components/common/GlobalLoader";
import { uploadService } from "@/services/apiService";
import { motion } from "framer-motion";
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

// --- DYNAMIC ICON HANDLING ---
const formatIconName = (pascalCaseName) => {
  return pascalCaseName.replace(/([A-Z])/g, " $1").trim();
};

const excludedIcons = new Set([
  "LucideProvider",
  "createLucideIcon",
  "IconNode",
  "icons",
  "default",
]);
const iconOptions = Object.keys(allIcons)
  .filter(
    (name) => typeof allIcons[name] === "object" && !excludedIcons.has(name)
  )
  .map((name) => ({
    value: name,
    label: formatIconName(name),
    component: allIcons[name],
  }));

const CategoryIcon = ({ iconName, ...props }) => {
  const IconComponent = allIcons[iconName] || allIcons.Bookmark;
  return <IconComponent {...props} />;
};

// --- STYLING & THEME (FROM BOOKINGSLIST) ---
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

const hexToRgba = (hex, alpha = 1) => {
  if (!hex?.slice) return `rgba(100, 116, 139, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --- MAIN PAGE COMPONENTS ---
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

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
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

const TableTitle = styled(AntTitle).attrs({ level: 4 })`
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
`;

const TableDescription = styled(Paragraph)`
  margin: 0 !important;
  color: ${colors.textSecondary};
  font-size: 14px;
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

const SubcategoryItem = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: ${(props) => hexToRgba(props.color, 0.1)};
  color: ${(props) => props.color};
  border: 1px solid ${(props) => hexToRgba(props.color, 0.3)};
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 13px;
  font-weight: 500;
  gap: 6px;
  transition: all 0.2s ease-in-out;

  .action-icon {
    cursor: pointer;
    color: ${(props) => hexToRgba(props.color, 0.8)};
    &:hover {
      color: ${(props) => props.color};
      transform: scale(1.1);
    }
  }
`;

const CategoryCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  .ant-card-body {
    padding: 16px !important;
  }
`;
const CategoryCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;
const CategoryInfo = styled.div`
  flex: 1;
`;
const CategoryName = styled.div`
  font-weight: 600;
  color: ${colors.textPrimary};
  font-size: 15px;
`;
const CategoryKey = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
`;
const CategoryCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
  &:not(:last-child) {
    border-bottom: 1px solid ${colors.border};
  }
`;
const CategoryCardLabel = styled.div`
  color: ${colors.textSecondary};
`;
const CategoryCardValue = styled.div`
  font-weight: 500;
  text-align: right;
  color: ${colors.textPrimary};
`;
const CategoryCardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid ${colors.border};
  gap: 8px;
`;
const ModalTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  color: ${colors.textPrimary};
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

const CustomRechartsTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          padding: "8px 12px",
          border: `1px solid ${colors.border}`,
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          fontSize: "13px",
          fontFamily: appTheme.token.fontFamily,
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: colors.textPrimary }}>
          {payload[0].name}
        </p>
        <p style={{ margin: "6px 0 0 0", color: payload[0].payload.fill }}>
          Active Classes:{" "}
          <strong style={{ color: colors.textPrimary }}>
            {payload[0].value}
          </strong>
        </p>
      </div>
    );
  }
  return null;
};

const ReassignmentModal = ({
  open,
  onCancel,
  onConfirm,
  data,
  options,
  loading,
}) => {
  const [newId, setNewId] = useState(null);

  useEffect(() => {
    if (open) {
      setNewId(null);
    }
  }, [open]);

  if (!data) return null;

  const { type, target } = data;
  const count = target.class_count;
  const name = target.name;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={
        <ModalTitleWrapper>
          <AlertTriangle color={colors.warning} /> Reassign and Delete
        </ModalTitleWrapper>
      }
      footer={[
        <Button key="back" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          danger
          disabled={!newId}
          loading={loading}
          onClick={() => onConfirm(newId)}
        >
          Reassign and Delete
        </Button>,
      ]}
    >
      <Paragraph>
        The {type} <Text strong>"{name}"</Text> is currently used by{" "}
        <Text strong>{count} class(es)</Text>.
      </Paragraph>
      <Paragraph>
        To delete it, you must first reassign all associated classes to a new{" "}
        {type}.
      </Paragraph>
      {type === "category" && (
        <Paragraph
          type="secondary"
          style={{
            fontStyle: "italic",
            background: hexToRgba(colors.warning, 0.1),
            padding: "8px 12px",
            borderRadius: "8px",
          }}
        >
          <InfoIcon
            size={14}
            style={{ marginRight: 8, verticalAlign: "middle" }}
          />
          This will also clear the subcategory for all affected classes. You may
          need to set a new subcategory for them afterwards.
        </Paragraph>
      )}
      <Select
        style={{ width: "100%", marginTop: "12px" }}
        placeholder={`Select a new ${type}...`}
        value={newId}
        onChange={setNewId}
        options={options}
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
      />
    </Modal>
  );
};

const ClassCategories = () => {
  const [categories, setCategories] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddSubcategoryModalVisible, setIsAddSubcategoryModalVisible] =
    useState(false);
  const [isEditSubcategoryModalVisible, setIsEditSubcategoryModalVisible] =
    useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [reassignmentData, setReassignmentData] = useState(null);

  const [chartView, setChartView] = useState({
    type: "categories",
    category: null,
  });
  const [editForm] = Form.useForm();
  const [subcategoryForm] = Form.useForm();
  const [editSubcategoryForm] = Form.useForm();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    setChartLoading(true);
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
      setChartLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const params = searchText ? { search: searchText } : {};
    try {
      const response = await classManagementService.getCategories(params);
      if (response.success) {
        const data = (response.data || []).map((cat) => ({
          ...cat,
          subcategories: cat.subcategories || [],
        }));
        setCategories(data);
      } else {
        message.error(response.error || "Failed to fetch categories");
        setCategories([]);
      }
    } catch (e) {
      console.error("Fetch categories error:", e);
      message.error("Error fetching categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setCategories((prev) => {
        const oldIndex = prev.findIndex((cat) => cat.id === active.id);
        const newIndex = prev.findIndex((cat) => cat.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;

        const newArray = arrayMove(prev, oldIndex, newIndex);

        // Optimistically update UI, then send update to backend
        updateCategoryOrder(newArray);

        return newArray;
      });
    }
  };

  const updateCategoryOrder = async (reorderedCategories) => {
    setActionLoading(true);
    try {
      const updatePayload = reorderedCategories.map((cat, index) => ({
        id: cat.id,
        order: index, // Send the new index as the sort_order
      }));
      const response = await classManagementService.updateCategoryOrder(
        updatePayload
      );
      if (response?.success) {
        message.success("Category order updated successfully.");
      } else {
        message.error("Failed to update category order. Reverting changes.");
        fetchCategories(); // Re-fetch to revert optimistic update on failure
      }
    } catch (error) {
      message.error("An error occurred while updating category order.");
      fetchCategories(); // Re-fetch on error
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubcategory = async (categoryId, subcategoryId) => {
    setActionLoading(true);
    message.loading({ content: "Deleting...", key: "deleteAction" });
    const response = await classManagementService.deleteSubcategory(
      categoryId,
      subcategoryId
    );
    if (response.success) {
      message.success({ content: "Subcategory deleted", key: "deleteAction" });
      fetchCategories();
      fetchDashboardStats();
    } else {
      message.error({
        content: response.error || "Deletion failed",
        key: "deleteAction",
      });
    }
    setActionLoading(false);
  };

  const handleSaveCategory = async () => {
    try {
      const values = await editForm.validateFields();
      setActionLoading(true);
      message.loading({
        content: "Saving...",
        key: "categoryAction",
        duration: 0,
      });

      // --- S3 UPLOAD LOGIC ---
      let imageS3Key = undefined; // Use undefined to avoid sending the key if no change

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
          "category_image"
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
          message.destroy("categoryAction");
          return;
        }
      } else if (values.image === undefined || values.image.length === 0) {
        imageS3Key = null;
      }

      // --- JSON PAYLOAD CONSTRUCTION ---
      const payload = {
        name: values.name,
        description: values.description,
        is_featured: values.is_featured,
        color:
          typeof values.color === "object" && values.color.toHexString
            ? values.color.toHexString()
            : values.color,
        icon_name: values.icon_name,
        ...(values.slug && { key: values.slug }),
      };

      if (imageS3Key !== undefined) {
        payload.image_s3_key = imageS3Key;
      }

      // --- API CALL ---
      const serviceCall = selectedCategory
        ? classManagementService.updateCategory(selectedCategory.id, payload)
        : classManagementService.createCategory(payload);

      const response = await serviceCall;

      if (response.success) {
        message.success({
          content: `Category ${selectedCategory ? "updated" : "created"}`,
          key: "categoryAction",
          duration: 2,
        });
        setIsEditModalVisible(false);
        fetchCategories();
        fetchDashboardStats();
      } else {
        const errorMessage =
          typeof response.error === "object"
            ? Object.values(response.error).flat().join(" ")
            : response.error;
        message.error({
          content:
            errorMessage ||
            `Failed to ${selectedCategory ? "update" : "create"} category`,
          key: "categoryAction",
          duration: 4,
        });
      }
    } catch (e) {
      console.error("Save category error:", e);
      if (e.errorFields)
        message.error({
          content: "Please fill all required fields.",
          key: "categoryAction",
          duration: 2,
        });
    } finally {
      setActionLoading(false);
      message.destroy("imageUpload");
    }
  };

  const handleAddSubcategory = async () => {
    try {
      const values = await subcategoryForm.validateFields();
      setActionLoading(true);
      message.loading({ content: "Adding...", key: "subcategoryAction" });
      const response = await classManagementService.addSubcategory(
        selectedCategory.id,
        values
      );
      if (response.success) {
        message.success({
          content: "Subcategory added",
          key: "subcategoryAction",
        });
        setIsAddSubcategoryModalVisible(false);
        fetchCategories();
        fetchDashboardStats();
      } else {
        message.error({
          content: response.error || "Failed to add subcategory",
          key: "subcategoryAction",
        });
      }
    } catch (e) {
      console.error("Add subcategory error:", e);
      if (e.errorFields)
        message.error({
          content: "Please fill all required fields.",
          key: "subcategoryAction",
        });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSubcategory = async () => {
    try {
      const values = await editSubcategoryForm.validateFields();
      setActionLoading(true);
      message.loading({ content: "Updating...", key: "subcategoryAction" });
      const response = await classManagementService.updateSubcategory(
        selectedCategory.id,
        editingSubcategory.id,
        values
      );
      if (response.success) {
        message.success({
          content: "Subcategory updated",
          key: "subcategoryAction",
        });
        setIsEditSubcategoryModalVisible(false);
        fetchCategories();
      } else {
        message.error({
          content: response.error || "Failed to update subcategory",
          key: "subcategoryAction",
        });
      }
    } catch (e) {
      console.error("Update subcategory error:", e);
      if (e.errorFields)
        message.error({
          content: "Please fill all required fields.",
          key: "subcategoryAction",
        });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    setActionLoading(true);
    message.loading({ content: "Deleting...", key: "deleteAction" });
    const response = await classManagementService.deleteCategory(categoryId);
    if (response.success) {
      message.success({ content: "Category deleted", key: "deleteAction" });
      fetchCategories();
      fetchDashboardStats();
    } else {
      message.error({
        content: response.error || "Failed to delete category",
        key: "deleteAction",
      });
    }
    setActionLoading(false);
  };

  const handleInitiateDelete = (item, type, parentCategory = null) => {
    if (item.class_count > 0) {
      setReassignmentData({ type, target: item, parent: parentCategory });
    } else {
      Modal.confirm({
        title: `Delete this ${type}?`,
        content: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
        okText: "Delete",
        okType: "danger",
        cancelText: "Cancel",
        onOk: () => {
          if (type === "category") {
            handleDeleteCategory(item.id);
          } else {
            handleDeleteSubcategory(parentCategory.id, item.id);
          }
        },
      });
    }
  };

  const handleConfirmReassignment = async (newId) => {
    if (!reassignmentData) return;
    const { type, target, parent } = reassignmentData;

    setActionLoading(true);
    message.loading({
      content: "Reassigning and deleting...",
      key: "reassignAction",
    });

    let response;
    if (type === "category") {
      response = await classManagementService.deleteCategoryWithReassignment(
        target.id,
        newId
      );
    } else {
      response = await classManagementService.deleteSubcategoryWithReassignment(
        parent.id,
        target.id,
        newId
      );
    }

    if (response.success) {
      message.success({
        content:
          response.data?.detail ||
          `${
            type.charAt(0).toUpperCase() + type.slice(1)
          } deleted successfully.`,
        key: "reassignAction",
      });
      setReassignmentData(null);
      fetchCategories();
      fetchDashboardStats();
    } else {
      message.error({
        content: response.error || "An error occurred.",
        key: "reassignAction",
      });
    }
    setActionLoading(false);
  };

  const openCategoryModal = (category = null) => {
    setSelectedCategory(category);
    if (category) {
      const fileList = category.image_medium_url
        ? [
            {
              uid: "-1",
              name: "current_image.webp",
              status: "done",
              url: category.image_medium_url,
            },
          ]
        : [];

      editForm.setFieldsValue({
        name: category.name,
        slug: category.key,
        description: category.description,
        is_featured: category.is_featured,
        image: fileList,
        color: category.color || colors.primary,
        icon_name: category.icon_name || "Bookmark",
      });
    } else {
      editForm.resetFields();
      editForm.setFieldsValue({
        color: colors.primary,
        icon_name: "Bookmark",
        is_featured: false,
        image: [],
      });
    }
    setIsEditModalVisible(true);
  };

  const showAddSubcategoryModal = (category) => {
    setSelectedCategory(category);
    subcategoryForm.resetFields();
    setIsAddSubcategoryModalVisible(true);
  };

  const openEditSubcategoryModal = (subcategory, category) => {
    setSelectedCategory(category);
    setEditingSubcategory(subcategory);
    editSubcategoryForm.setFieldsValue({
      name: subcategory.name,
      key: subcategory.key,
      description: subcategory.description,
    });
    setIsEditSubcategoryModalVisible(true);
  };

  const columns = [
    { key: "sort", width: 50, fixed: "left", render: () => <DragHandle /> },
    {
      title: "Category",
      key: "category",
      render: (_, cat) => (
        <Space>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              backgroundColor: cat.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <CategoryIcon iconName={cat.icon_name} size={14} />
          </div>
          <div>
            <div
              style={{
                fontWeight: 500,
                fontSize: 14,
                color: colors.textPrimary,
              }}
            >
              {cat.name}
            </div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>
              {cat.key} ({cat.class_count} classes)
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Active Classes",
      dataIndex: "activeClasses",
      key: "activeClasses",
      sorter: (a, b) => (a.activeClasses || 0) - (b.activeClasses || 0),
      align: "center",
      width: 130,
      render: (val) => <span style={{ fontWeight: 500 }}>{val || 0}</span>,
    },
    {
      title: "Subcategories",
      key: "subcategories",
      render: (_, cat) => {
        const subs = cat.subcategories || [];
        return (
          <div
            style={{
              maxWidth: 450,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
            }}
          >
            {subs.length > 0 ? (
              subs.map((s) => (
                <SubcategoryItem key={s.id} color={cat.color}>
                  <span>
                    {s.name} ({s.class_count})
                  </span>
                  <Tooltip title="Edit">
                    <PenLine
                      size={12}
                      className="action-icon"
                      onClick={() => openEditSubcategoryModal(s, cat)}
                    />
                  </Tooltip>
                  <Tooltip title="Delete">
                    <Trash2
                      size={12}
                      className="action-icon"
                      onClick={() =>
                        handleInitiateDelete(s, "subcategory", cat)
                      }
                    />
                  </Tooltip>
                </SubcategoryItem>
              ))
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                None
              </Text>
            )}
            <Button
              type="text"
              icon={<Plus size={13} />}
              size="small"
              onClick={() => showAddSubcategoryModal(cat)}
              style={{ marginLeft: 4, padding: "0 4px", height: 22 }}
            >
              Add
            </Button>
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      align: "right",
      render: (_, cat) => (
        <Space>
          <Button
            icon={<Edit size={14} />}
            onClick={() => openCategoryModal(cat)}
            size="middle"
          >
            Edit
          </Button>
          <Button
            danger
            icon={<Trash2 size={14} />}
            onClick={() => handleInitiateDelete(cat, "category")}
            size="middle"
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const renderCategoryCard = (cat) => {
    const subs = cat.subcategories || [];
    return (
      <CategoryCard key={cat.id}>
        <CategoryCardHeader>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: cat.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <CategoryIcon iconName={cat.icon_name} size={20} />
          </div>
          <CategoryInfo>
            <CategoryName>{cat.name}</CategoryName>
            <CategoryKey>{cat.key}</CategoryKey>
          </CategoryInfo>
        </CategoryCardHeader>
        <div>
          <CategoryCardRow>
            <CategoryCardLabel>Total Classes</CategoryCardLabel>
            <CategoryCardValue>{cat.class_count || 0}</CategoryCardValue>
          </CategoryCardRow>
          <CategoryCardRow>
            <CategoryCardLabel>Subcategories</CategoryCardLabel>
            <CategoryCardValue>{subs.length}</CategoryCardValue>
          </CategoryCardRow>
          {subs.length > 0 && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {subs.map((s) => (
                <SubcategoryItem key={s.id} color={cat.color}>
                  <span>
                    {s.name} ({s.class_count})
                  </span>
                  <Tooltip title="Edit">
                    <PenLine
                      size={12}
                      className="action-icon"
                      onClick={() => openEditSubcategoryModal(s, cat)}
                    />
                  </Tooltip>
                  <Tooltip title="Delete">
                    <Trash2
                      size={12}
                      className="action-icon"
                      onClick={() =>
                        handleInitiateDelete(s, "subcategory", cat)
                      }
                    />
                  </Tooltip>
                </SubcategoryItem>
              ))}
            </div>
          )}
        </div>
        <CategoryCardFooter>
          <Button
            icon={<Plus size={14} />}
            onClick={() => showAddSubcategoryModal(cat)}
            size="small"
          >
            Subcategory
          </Button>
          <Button
            icon={<Edit size={14} />}
            onClick={() => openCategoryModal(cat)}
            size="small"
          >
            Edit
          </Button>
          <Button
            danger
            icon={<Trash2 size={14} />}
            onClick={() => handleInitiateDelete(cat, "category")}
            size="small"
          >
            Delete
          </Button>
        </CategoryCardFooter>
      </CategoryCard>
    );
  };

  const pieChartData =
    chartView.type === "categories"
      ? dashboardStats?.categoryClassCounts?.map((c) => ({
          name: c.name,
          value: c.class_count,
          color: c.color,
          id: c.id,
        }))
      : dashboardStats?.subcategoryClassCounts
          ?.filter((sc) => sc.category_id === chartView.category.id)
          .map((sc) => ({
            name: sc.name,
            value: sc.class_count,
            color: sc.category__color,
            id: sc.id,
          }));

  const statCardsData = [
    {
      title: "Total Categories",
      value: dashboardStats?.totalCategories,
      icon: TagIcon,
      color: colors.info,
      footer: "Platform-wide",
    },
    {
      title: "Total Subcategories",
      value: dashboardStats?.totalSubcategories,
      icon: GridIcon,
      color: colors.success,
      footer: "Across all categories",
    },
    {
      title: "Total Active Classes",
      value: dashboardStats?.activeClasses,
      icon: BookOpen,
      color: colors.warning,
      footer: "Currently listed",
    },
    {
      title: "Most Active Category",
      value: dashboardStats?.categoryClassCounts?.[0]?.name,
      icon: BarChart2,
      color: "#8b5cf6",
      footer: `${
        dashboardStats?.categoryClassCounts?.[0]?.class_count ?? 0
      } active classes`,
    },
  ];

  const getReassignmentOptions = () => {
    if (!reassignmentData) return [];
    const { type, target, parent } = reassignmentData;

    if (type === "category") {
      return categories
        .filter((c) => c.id !== target.id)
        .map((c) => ({ label: c.name, value: c.id }));
    }

    if (type === "subcategory" && parent) {
      return parent.subcategories
        .filter((s) => s.id !== target.id)
        .map((s) => ({ label: s.name, value: s.id }));
    }

    return [];
  };

  return (
    <ThemeProvider theme={appTheme}>
      <ConfigProvider theme={antdComponentTheme}>
        <DashboardWrapper>
          <DashboardHeader>
            <div>
              <PageTitle>Class Categories</PageTitle>
              <HeaderSubtitle>
                Organize classes by defining broad categories and specific
                subcategories for better discovery.
              </HeaderSubtitle>
            </div>
            <ActionButtonsContainer>
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => openCategoryModal()}
              >
                Add New Category
              </Button>
            </ActionButtonsContainer>
          </DashboardHeader>

          <Divider />

          <div style={{ marginBottom: "20px" }}>
            <SectionTitle>
              <BarChart2 size={20} color={colors.primary} />
              Platform Overview
            </SectionTitle>
            <HelpText>
              A high-level overview of class and category distribution on the
              platform.
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

          <ChartCard>
            <ChartHeader>
              <SectionTitle>
                <PieChartIcon size={20} color={colors.primary} />
                {chartView.type === "categories"
                  ? "Class Distribution by Category"
                  : `Subcategories in ${chartView.category.name}`}
              </SectionTitle>
              {chartView.type === "subcategories" && (
                <Button
                  icon={<ArrowLeft size={14} />}
                  onClick={() =>
                    setChartView({ type: "categories", category: null })
                  }
                >
                  Back to Categories
                </Button>
              )}
            </ChartHeader>
            <HelpText>
              Distribution of active classes. Click a category to see its
              subcategory breakdown.
            </HelpText>
            <div
              style={{
                height: 300,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {chartLoading ? (
                <GlobalLoaderWithoutInlineStyles />
              ) : !pieChartData || pieChartData.length === 0 ? (
                <Empty
                  description={
                    chartView.type === "categories"
                      ? "No category data"
                      : "No subcategories with active classes"
                  }
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 50 : 70}
                      outerRadius={isMobile ? 80 : 100}
                      paddingAngle={2}
                      onClick={(data) => {
                        if (chartView.type === "categories") {
                          setChartView({
                            type: "subcategories",
                            category: data.payload.payload,
                          });
                        }
                      }}
                    >
                      {pieChartData.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={hexToRgba(entry.color, 0.8)}
                          stroke={entry.color}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomRechartsTooltip />} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>

          <Divider />

          <TableSection
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <TableHeader>
              <TableTitle>
                <Book size={20} />
                Manage Categories
              </TableTitle>
              <TableDescription>
                Create, edit, and manage all class categories and their
                associated subcategories. Drag and drop to reorder.
              </TableDescription>
            </TableHeader>

            <FilterBar>
              <SearchFilterContainer>
                <Input
                  placeholder="Search categories..."
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onSearch={fetchCategories}
                  style={{ width: isMobile ? "100%" : 280 }}
                />
              </SearchFilterContainer>
            </FilterBar>

            {isMobile ? (
              <div style={{ padding: "0 8px 8px" }}>
                {loading ? (
                  <Skeleton active paragraph={{ rows: 4 }} />
                ) : categories.length > 0 ? (
                  categories.map(renderCategoryCard)
                ) : (
                  <Empty description="No categories found" />
                )}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Table
                    columns={columns}
                    dataSource={categories}
                    rowKey="id"
                    loading={{
                      spinning: loading,
                      indicator: <GlobalLoaderWithInlineStyles />,
                    }}
                    components={{ body: { row: Row } }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ["5", "10", "20"],
                    }}
                    locale={{
                      emptyText: <Empty description="No categories found" />,
                    }}
                  />
                </SortableContext>
              </DndContext>
            )}
          </TableSection>

          <ReassignmentModal
            open={!!reassignmentData}
            onCancel={() => setReassignmentData(null)}
            onConfirm={handleConfirmReassignment}
            data={reassignmentData}
            options={getReassignmentOptions()}
            loading={actionLoading}
          />

          <Modal
            title={
              <ModalTitleWrapper>
                {selectedCategory ? <Edit2 size={20} /> : <Plus size={20} />}{" "}
                {selectedCategory ? `Edit Category` : "Add New Category"}
              </ModalTitleWrapper>
            }
            open={isEditModalVisible}
            onCancel={() => setIsEditModalVisible(false)}
            footer={null}
            width={isMobile ? "95%" : 500}
            destroyOnClose
          >
            <Form
              form={editForm}
              layout="vertical"
              onFinish={handleSaveCategory}
              initialValues={{
                color: colors.primary,
                icon_name: "Bookmark",
                is_featured: false,
              }}
            >
              <Form.Item
                name="name"
                label="Category Name"
                rules={[{ required: true }]}
              >
                <Input placeholder="e.g., Music, Art" />
              </Form.Item>
              <Form.Item
                name="slug"
                label="Category Slug"
                tooltip={{
                  title:
                    "URL-friendly identifier (e.g., 'digital-art'). Auto-generates from name if left blank.",
                  icon: <InfoIcon size={13} />,
                }}
                rules={[
                  {
                    pattern: /^[a-z0-9-]+$/,
                    message: "Lowercase, numbers, and hyphens only.",
                  },
                ]}
              >
                <Input
                  placeholder="e.g., music, digital-art"
                  suffix={
                    <Tooltip title="Auto-generate from name">
                      <Button
                        type="text"
                        size="small"
                        icon={<allIcons.Bot size={20} />}
                        style={{
                          margin: 0,
                          padding: 0,
                          height: 22,
                          lineHeight: 1,
                        }}
                        onClick={() => {
                          const n = editForm.getFieldValue("name");
                          if (n)
                            editForm.setFieldsValue({
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
                label="Homepage Description"
                tooltip="Short, catchy description for the category card on the homepage."
                rules={[
                  { required: true, message: "A description is required." },
                ]}
              >
                <Input.TextArea
                  rows={2}
                  placeholder="e.g., Unleash your inner creative genius"
                />
              </Form.Item>
              <Form.Item
                name="image"
                label="Homepage Image"
                tooltip="Image for the category card (e.g., 500x500px). Uploading a new image will replace the old one."
                valuePropName="fileList"
                getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                rules={[
                  {
                    required: !selectedCategory,
                    message: "An image is required for new categories.",
                  },
                ]}
              >
                <Upload
                  name="image"
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => false}
                >
                  <div>
                    <Plus />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
              <Form.Item
                name="is_featured"
                label="Feature on Homepage"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Divider>Admin Panel Display</Divider>
              <Form.Item
                name="icon_name"
                label="Icon (for Admin Panel)"
                tooltip="Select an icon that represents this category in the admin panel."
                rules={[{ required: true, message: "Please select an icon." }]}
              >
                <Select
                  showSearch
                  placeholder="Search for an icon..."
                  optionFilterProp="label"
                >
                  {iconOptions.map((opt) => (
                    <Select.Option
                      key={opt.value}
                      value={opt.value}
                      label={opt.label}
                    >
                      <Space>
                        <opt.component size={16} />
                        {opt.label}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="color"
                label="Category Color (for Admin Panel)"
                rules={[{ required: true }]}
              >
                <ColorPicker
                  format="hex"
                  presets={[
                    {
                      label: "Recommended",
                      colors: [
                        "#3b82f6",
                        "#8b5cf6",
                        "#ec4899",
                        "#10b981",
                        "#f97316",
                        "#0ea5e9",
                        "#ef4444",
                        "#64748b",
                      ],
                    },
                  ]}
                  style={{ padding: "10px 10px" }}
                  showText
                />
              </Form.Item>
              <Divider />
              <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                <Space>
                  <Button
                    onClick={() => setIsEditModalVisible(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={actionLoading}
                  >
                    {selectedCategory ? "Update Category" : "Create Category"}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title={
              <ModalTitleWrapper>
                <Plus size={20} />
                Add Subcategory to: {selectedCategory?.name || ""}
              </ModalTitleWrapper>
            }
            open={isAddSubcategoryModalVisible}
            onCancel={() => setIsAddSubcategoryModalVisible(false)}
            footer={null}
            width={isMobile ? "95%" : 500}
            destroyOnClose
          >
            {selectedCategory && (
              <Form
                form={subcategoryForm}
                layout="vertical"
                onFinish={handleAddSubcategory}
              >
                <div
                  style={{
                    marginBottom: 20,
                    padding: 12,
                    background: hexToRgba(selectedCategory.color, 0.1),
                    borderRadius: 12,
                  }}
                >
                  <Space>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        backgroundColor: selectedCategory.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                      }}
                    >
                      <CategoryIcon
                        iconName={selectedCategory.icon_name}
                        size={14}
                      />
                    </div>
                    <Text
                      strong
                      style={{ fontSize: 16, color: selectedCategory.color }}
                    >
                      {selectedCategory.name}
                    </Text>
                  </Space>
                </div>
                <Form.Item
                  name="name"
                  label="Subcategory Name"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="e.g., Piano, Guitar" />
                </Form.Item>
                <Form.Item
                  name="key"
                  label="Subcategory Key"
                  tooltip={{
                    title: "URL-friendly identifier",
                    icon: <InfoIcon size={13} />,
                  }}
                  rules={[
                    { required: true },
                    {
                      pattern: /^[a-z0-9-]+$/,
                      message: "Lowercase, numbers, hyphens only",
                    },
                  ]}
                >
                  <Input
                    placeholder="e.g., piano, oil-painting"
                    suffix={
                      <Tooltip title="Auto-generate from name">
                        <Button
                          type="text"
                          size="small"
                          icon={<Copy size={13} />}
                          onClick={() => {
                            const n = subcategoryForm.getFieldValue("name");
                            if (n)
                              subcategoryForm.setFieldsValue({
                                key: n
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
                <Form.Item name="description" label="Description (Optional)">
                  <Input.TextArea
                    placeholder="A short description of this subcategory"
                    rows={2}
                  />
                </Form.Item>
                <Divider />
                <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                  <Space>
                    <Button
                      onClick={() => setIsAddSubcategoryModalVisible(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={actionLoading}
                    >
                      Add Subcategory
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </Modal>

          <Modal
            title={
              <ModalTitleWrapper>
                <PenLine size={20} />
                Edit Subcategory in: {selectedCategory?.name || ""}
              </ModalTitleWrapper>
            }
            open={isEditSubcategoryModalVisible}
            onCancel={() => setIsEditSubcategoryModalVisible(false)}
            footer={null}
            width={isMobile ? "95%" : 500}
            destroyOnClose
          >
            {editingSubcategory && (
              <Form
                form={editSubcategoryForm}
                layout="vertical"
                onFinish={handleUpdateSubcategory}
              >
                <div
                  style={{
                    marginBottom: 20,
                    padding: 12,
                    background: hexToRgba(selectedCategory?.color, 0.1),
                    borderRadius: 12,
                  }}
                >
                  <Space>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        backgroundColor: selectedCategory?.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                      }}
                    >
                      <CategoryIcon
                        iconName={selectedCategory?.icon_name}
                        size={14}
                      />
                    </div>
                    <Text
                      strong
                      style={{ fontSize: 16, color: selectedCategory?.color }}
                    >
                      {selectedCategory?.name}
                    </Text>
                  </Space>
                </div>
                <Form.Item
                  name="name"
                  label="Subcategory Name"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="e.g., Piano, Guitar" />
                </Form.Item>
                <Form.Item
                  name="key"
                  label="Subcategory Key"
                  tooltip={{
                    title: "URL-friendly identifier",
                    icon: <InfoIcon size={13} />,
                  }}
                  rules={[
                    { required: true },
                    {
                      pattern: /^[a-z0-9-]+$/,
                      message: "Lowercase, numbers, hyphens only",
                    },
                  ]}
                >
                  <Input
                    placeholder="e.g., piano, oil-painting"
                    suffix={
                      <Tooltip title="Auto-generate from name">
                        <Button
                          type="text"
                          size="small"
                          icon={<Copy size={13} />}
                          onClick={() => {
                            const n = editSubcategoryForm.getFieldValue("name");
                            if (n)
                              editSubcategoryForm.setFieldsValue({
                                key: n
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
                <Form.Item name="description" label="Description (Optional)">
                  <Input.TextArea
                    placeholder="A short description of this subcategory"
                    rows={2}
                  />
                </Form.Item>
                <Divider />
                <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                  <Space>
                    <Button
                      onClick={() => setIsEditSubcategoryModalVisible(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={actionLoading}
                    >
                      Update Subcategory
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </Modal>
        </DashboardWrapper>
      </ConfigProvider>
    </ThemeProvider>
  );
};

export default ClassCategories;
