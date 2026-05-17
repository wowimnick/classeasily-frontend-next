"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback,
} from "react";
import { useAuthStore } from "@/lib/auth-client";
import styled, { keyframes } from "styled-components";
import {
  Card,
  Select,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  Alert,
  Tooltip,
  ConfigProvider,
  Divider,
  Checkbox,
  Col,
  ColorPicker,
  Grid,
  Empty,
  Row as AntRow,
  Typography,
  Collapse,
  Avatar,
} from "antd";
import { AdminCompactTable } from "../shared/AdminCompactTable";
import message from "@/lib/message";
import {
  Shield,
  Users,
  Plus,
  Edit,
  Trash2,
  Copy,
  Save,
  GripVertical,
  X,
  Briefcase,
} from "lucide-react";
import { roleService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme.js";

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
import { LordIcon } from "@/services/ReactUtils";

import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";

import { adminColors as colors } from "../shared/adminColors";
import { formatDate } from "../shared/adminUtils";
import {
  TableSection,
  TableHeader,
  TableTitle,
  TableDescription,
  FilterBar,
  SearchFilterContainer,
} from "../shared/adminTableStyles";
import {
  ActionButtonsContainer,
  RefreshButton,
} from "../shared/AdminButtons";
import {
  MobileCard,
  MobileCardContent,
  MobileCardRow,
  MobileCardLabel,
  MobileCardFooter,
} from "../shared/adminMobileStyles";

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const roleColorOptions = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#78716c",
];

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

// --- SKELETON COMPONENTS ---
const SkeletonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`;

const SkeletonLine = styled.div`
  height: ${(props) => props.height || "16px"};
  width: ${(props) => props.width || "100%"};
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
  border-radius: 4px;
  margin-bottom: ${(props) => props.marginBottom || "0"};

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
  width: ${(props) => props.size || "36px"};
  height: ${(props) => props.size || "36px"};
  margin-bottom: 0;
  flex-shrink: 0;
`;

const SkeletonTag = styled(SkeletonLine)`
  height: 24px;
  width: ${(props) => props.width || "80px"};
  border-radius: 6px;
  display: inline-block;
  margin-bottom: 0;
`;

// --- VAUL DRAWER STYLES ---
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 90%;
  max-height: 90vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;

const DrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DrawerHeader = styled.div`
  background: white;
  border-bottom: 1px solid ${colors.border};
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const DrawerTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.textPrimary};
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const DrawerFooter = styled.div`
  padding: 16px 20px;
  border-top: 1px solid ${colors.border};
  background: white;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

// --- MODAL & PERMISSION STYLES ---
const RoleTag = styled(Tag)`
  border: none !important;
  font-weight: 500;
  padding: 4px 10px;
  font-size: 13px;
  border-radius: 6px;
`;
const UserCount = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${colors.textSecondary};
  font-size: 13px;
`;

const PermissionsContainer = styled.div`
  background: ${colors.lightBg};
  border: 1px solid ${colors.border};
  padding: 16px;
  border-radius: 8px;
`;
const PermissionCheckboxLabel = styled.div`
  font-size: 14px;
  div:first-child {
    font-weight: 500;
    color: ${colors.textPrimary};
  }
  div:last-child {
    font-size: 12px;
    color: ${colors.textSecondary};
    font-weight: normal;
  }
`;
const CollapsePanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;
const StyledFormItem = styled(Form.Item)`
  margin-bottom: 0px !important;
`;
const HelpText = styled(Text)`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: block;
  margin-top: 4px;
  margin-bottom: 16px;
`;
const DragHandleButton = styled(Button)`
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
`;

// --- GENERATORS ---
const generateSkeletonData = (count = 5) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `skeleton-${i}`,
    name: <SkeletonTag width="120px" />,
    description: <SkeletonLine width="200px" />,
    user_count: <SkeletonLine width="30px" />,
    updated_at: <SkeletonLine width="100px" />,
    actions: <SkeletonCircle size="32px" />,
  }));
};

// --- DND & UTILITIES ---
const RowContext = React.createContext({});

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

// --- MAIN COMPONENT ---
const RolesManagement = () => {
  const user = useAuthStore((state) => state.user);
  const [searchText, setSearchText] = useState("");
  // Combined state for modal/drawer visibility
  const [modalState, setModalState] = useState({
    visible: false,
    mode: "create", // 'create' or 'edit'
  });

  const [selectedRole, setSelectedRole] = useState(null);
  const [editedPermissions, setEditedPermissions] = useState([]);
  const [permissionSearchText, setPermissionSearchText] = useState("");
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [form] = Form.useForm();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const isElevatedRoleManager =
    user?.role?.name === "Super Admin" || Boolean(user?.is_superuser);

  const fetchAllData = useCallback(() => {
    setLoading(true);
    Promise.all([
      roleService.getRoles(searchText ? { search: searchText } : {}),
      roleService.getPermissions(),
    ])
      .then(([rolesResponse, permsResponse]) => {
        if (rolesResponse.success) {
          setRoles(
            [...rolesResponse.data].sort(
              (a, b) => b.hierarchy_level - a.hierarchy_level
            )
          );
        } else {
          message.error("Failed to fetch roles");
        }
        if (permsResponse.success) {
          setPermissionGroups(permsResponse.data);
        } else {
          message.error("Failed to fetch permissions");
        }
      })
      .catch((err) => {
        message.error("An error occurred while fetching data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchText]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setRoles((prevRoles) => {
        const oldIndex = prevRoles.findIndex((role) => role.id === active.id);
        const newIndex = prevRoles.findIndex((role) => role.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prevRoles;
        const newRolesArray = arrayMove(prevRoles, oldIndex, newIndex);
        const rolesWithNewHierarchy = newRolesArray.map((role, index) => ({
          ...role,
          hierarchy_level: newRolesArray.length - index,
        }));
        updateRoleOrder(rolesWithNewHierarchy);
        return rolesWithNewHierarchy;
      });
    }
  };

  const updateRoleOrder = async (reorderedRoles) => {
    setActionLoading(true);
    try {
      const updatePayload = reorderedRoles.map((role, index) => ({
        id: role.id,
        hierarchy_level: reorderedRoles.length - index,
      }));
      const response = await roleService.updateRoleOrder(updatePayload);
      if (response?.success) message.success("Role hierarchy updated");
      else message.error("Failed to update role hierarchy");
    } catch (error) {
      message.error("Error updating role hierarchy");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRole = () => {
    form.resetFields();
    form.setFieldsValue({
      color: roleColorOptions[0],
      initial_position: "bottom",
    });
    setEditedPermissions([]);
    setSelectedRole(null);
    setModalState({ visible: true, mode: "create" });
  };

  const handleEditRole = async (role) => {
    setSelectedRole(role);
    setActionLoading(true);
    try {
      const response = await roleService.getRole(role.id);
      if (response.success) {
        const { name, description, is_default, color, permissions } =
          response.data;
        form.setFieldsValue({ name, description, is_default, color });
        setEditedPermissions(permissions || []);
        setModalState({ visible: true, mode: "edit" });
      } else message.error("Failed to fetch role details");
    } catch (error) {
      message.error("Error fetching role details");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicateRole = async (role) => {
    setActionLoading(true);
    try {
      const response = await roleService.duplicateRole(role.id, {
        name: `${role.name} (Copy)`,
      });
      if (response.success) {
        message.success(`Role "${role.name}" duplicated successfully.`);
        fetchAllData();
      } else {
        message.error(response.error?.detail || `Failed to duplicate role.`);
      }
    } catch (error) {
      message.error("An error occurred while duplicating the role.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRole = (role) => {
    setSelectedRole(role);
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRole) return;
    setActionLoading(true);
    try {
      const response = await roleService.deleteRole(selectedRole.id);
      if (response.success) {
        message.success(`Role "${selectedRole.name}" deleted`);
        fetchAllData();
        setDeleteConfirmVisible(false);
      } else {
        message.error(response.error?.detail || "Failed to delete role");
      }
    } catch (error) {
      message.error("Error deleting role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormSubmit = async () => {
    const isEditing = modalState.mode === "edit";
    try {
      const values = await form.validateFields();
      setActionLoading(true);
      if (values.color && typeof values.color !== "string")
        values.color = values.color.toHexString();
      values.permissions = editedPermissions;

      const response = isEditing
        ? await roleService.updateRole(selectedRole.id, {
            ...values,
            hierarchy_level: selectedRole.hierarchy_level,
          })
        : await roleService.createRole({
            ...values,
            hierarchy_level:
              values.initial_position === "top"
                ? roles.length > 0
                  ? Math.max(...roles.map((r) => r.hierarchy_level)) + 1
                  : 10
                : roles.length > 0
                ? Math.max(
                    1,
                    Math.min(...roles.map((r) => r.hierarchy_level)) - 1
                  )
                : 1,
          });

      if (response.success) {
        message.success(
          `Role "${values.name}" ${isEditing ? "updated" : "created"}`
        );
        fetchAllData();
        setModalState({ ...modalState, visible: false });
      } else {
        message.error(
          response.error || `Failed to ${isEditing ? "update" : "create"} role`
        );
      }
    } catch (error) {
      if (error.errorFields) message.error("Please check form errors");
    } finally {
      setActionLoading(false);
    }
  };

  const allPermissionIds = useMemo(
    () =>
      permissionGroups.flatMap((group) => group.permissions.map((p) => p.id)),
    [permissionGroups]
  );

  const filteredPermissionGroups = useMemo(() => {
    if (!permissionSearchText) return permissionGroups;
    const lowercasedFilter = permissionSearchText.toLowerCase();

    return permissionGroups
      .map((group) => {
        const filteredPermissions = group.permissions.filter(
          (p) =>
            p.name.toLowerCase().includes(lowercasedFilter) ||
            (p.description || "").toLowerCase().includes(lowercasedFilter)
        );
        if (filteredPermissions.length > 0) {
          return { ...group, permissions: filteredPermissions };
        }
        return null;
      })
      .filter(Boolean);
  }, [permissionGroups, permissionSearchText]);

  // --- RENDERERS ---

  const columns = [
    { key: "sort", width: 50, fixed: "left", render: () => <DragHandle /> },
    {
      title: "Role Name",
      dataIndex: "name",
      key: "name",
      width: 200,
      fixed: "left",
      render: (name, role) => {
        if (React.isValidElement(name)) return name; // Skeleton check
        return (
          <Space>
            <RoleTag color={role.color || colors.textSecondary}>{name}</RoleTag>
            {role.is_default && <Tag color="blue">Default</Tag>}
          </Space>
        );
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      responsive: ["md"],
      ellipsis: true,
      render: (desc) => {
        if (React.isValidElement(desc)) return desc;
        return desc;
      },
    },
    {
      title: "Users",
      dataIndex: "user_count",
      key: "user_count",
      width: 100,
      align: "center",
      render: (count) => {
        if (React.isValidElement(count)) return count;
        return (
          <UserCount>
            <Users size={16} />
            {count}
          </UserCount>
        );
      },
    },
    {
      title: "Last Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (date) => {
        if (React.isValidElement(date)) return date;
        return formatDate(date);
      },
      responsive: ["lg"],
      width: 150,
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      align: "center",
      fixed: "right",
      render: (_, role) => {
        if (React.isValidElement(role.actions)) return role.actions;
        const canEdit =
          isElevatedRoleManager ||
          user?.role?.hierarchy_level > role.hierarchy_level;
        const canDelete =
          !role.is_system &&
          role.user_count === 0 &&
          (isElevatedRoleManager ||
            user?.role?.hierarchy_level > role.hierarchy_level);
        const actionsDisabled = actionLoading || loading;
        return (
          <Space>
            <Tooltip
              title={
                canEdit
                  ? "Edit Role"
                  : "Cannot edit roles with equal or higher privilege"
              }
            >
              <Button
                icon={<Edit size={16} />}
                onClick={() => handleEditRole(role)}
                disabled={!canEdit || actionsDisabled}
              />
            </Tooltip>
            <Tooltip title="Duplicate Role">
              <Button
                icon={<Copy size={16} />}
                onClick={() => handleDuplicateRole(role)}
                disabled={actionsDisabled}
              />
            </Tooltip>
            <Tooltip
              title={
                role.is_system
                  ? "System roles cannot be deleted"
                  : role.user_count > 0
                  ? "Role is assigned to users"
                  : !canDelete
                  ? "Cannot delete roles with equal/higher privilege"
                  : "Delete Role"
              }
            >
              <Button
                icon={<Trash2 size={16} />}
                danger
                onClick={() => handleDeleteRole(role)}
                disabled={!canDelete || actionsDisabled}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const renderMobileRoleCard = (role) => {
    // Check if it's a skeleton object
    if (React.isValidElement(role.name)) {
      return (
        <MobileCard key={role.id}>
          <MobileCardContent>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              {role.name}
              {role.user_count}
            </div>
            <MobileCardRow>
              <SkeletonLine width="100%" height="14px" />
            </MobileCardRow>
            <MobileCardFooter>
              <SkeletonCircle size="28px" />
              <SkeletonCircle size="28px" />
            </MobileCardFooter>
          </MobileCardContent>
        </MobileCard>
      );
    }

    // Real Data Card
    const canEdit =
      isElevatedRoleManager ||
      user?.role?.hierarchy_level > role.hierarchy_level;
    const canDelete =
      !role.is_system &&
      role.user_count === 0 &&
      (isElevatedRoleManager ||
        user?.role?.hierarchy_level > role.hierarchy_level);
    const actionsDisabled = actionLoading || loading;

    return (
      <MobileCard key={role.id}>
        <MobileCardContent>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "12px",
            }}
          >
            <Space direction="vertical" align="start">
              <RoleTag color={role.color || colors.textSecondary}>
                {role.name}
              </RoleTag>
              {role.is_default && <Tag color="blue">Default</Tag>}
            </Space>
            <UserCount>
              <Users size={16} />
              {role.user_count}
            </UserCount>
          </div>

          <MobileCardRow>
            <MobileCardLabel>Description</MobileCardLabel>
          </MobileCardRow>
          <Text type="secondary" style={{ fontSize: 13, marginTop: "-8px" }}>
            {role.description || "N/A"}
          </Text>

          <MobileCardFooter>
            <Button
              size="small"
              icon={<Edit size={14} />}
              onClick={() => handleEditRole(role)}
              disabled={!canEdit || actionsDisabled}
            />
            <Button
              size="small"
              icon={<Copy size={14} />}
              onClick={() => handleDuplicateRole(role)}
              disabled={actionsDisabled}
            />
            <Button
              size="small"
              icon={<Trash2 size={14} />}
              danger
              onClick={() => handleDeleteRole(role)}
              disabled={!canDelete || actionsDisabled}
            />
          </MobileCardFooter>
        </MobileCardContent>
      </MobileCard>
    );
  };

  const renderPermissionGroups = () => {
    if (filteredPermissionGroups.length === 0) {
      return <Empty description="No permissions match your search." />;
    }

    return (
      <Collapse accordion>
        {filteredPermissionGroups.map((group) => {
          const totalInGroup = group.permissions.length;
          const selectedInGroup = group.permissions.filter((p) =>
            editedPermissions.includes(p.id)
          ).length;

          return (
            <Panel
              header={
                <CollapsePanelHeader>
                  <Text>{group.name}</Text>
                  <Tag
                    color={
                      selectedInGroup === totalInGroup
                        ? "green"
                        : selectedInGroup > 0
                        ? "blue"
                        : "default"
                    }
                  >
                    {selectedInGroup} / {totalInGroup}
                  </Tag>
                </CollapsePanelHeader>
              }
              key={group.id}
            >
              <AntRow gutter={[8, 16]}>
                {group.permissions.map((p) => (
                  <Col xs={24} sm={12} key={p.id}>
                    <Checkbox
                      checked={editedPermissions.includes(p.id)}
                      onChange={(e) =>
                        setEditedPermissions((prev) =>
                          e.target.checked
                            ? [...prev, p.id]
                            : prev.filter((id) => id !== p.id)
                        )
                      }
                    >
                      <PermissionCheckboxLabel>
                        <div>{p.name}</div>
                        <div>
                          {p.description || "No description available."}
                        </div>
                      </PermissionCheckboxLabel>
                    </Checkbox>
                  </Col>
                ))}
              </AntRow>
            </Panel>
          );
        })}
      </Collapse>
    );
  };

  const renderFormContent = () => (
    <Form form={form} layout="vertical">
      <StyledFormItem name="name" label="Role Name" rules={[{ required: true }]}>
        <Input
          placeholder="e.g., Content Moderator"
          disabled={modalState.mode === "edit" && selectedRole?.is_system}
        />
      </StyledFormItem>
      <HelpText>
        A clear and concise name for the role (e.g., 'Content Moderator').
      </HelpText>

      <StyledFormItem
        name="description"
        label="Description"
        rules={[{ required: true }]}
      >
        <Input.TextArea
          rows={2}
          placeholder="e.g., Responsible for reviewing and managing user-generated content."
        />
      </StyledFormItem>
      <HelpText>
        Briefly describe the role's purpose and main responsibilities.
      </HelpText>

      <AntRow gutter={24}>
        <Col xs={24} sm={12}>
          <StyledFormItem
            name="color"
            label="Role Color"
            rules={[{ required: true }]}
            valuePropName="color"
            getValueFromEvent={(color) => color.toHexString()}
          >
            <ColorPicker
              format="hex"
              presets={[{ label: "Recommended", colors: roleColorOptions }]}
              showText
            />
          </StyledFormItem>
          <HelpText>
            This color is used throughout the UI to identify the role visually.
          </HelpText>
        </Col>
        {modalState.mode === "create" && (
          <Col xs={24} sm={12}>
            <StyledFormItem
              name="initial_position"
              label="Initial Position"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="top">Top (Higher Privilege)</Option>
                <Option value="bottom">Bottom (Lower Privilege)</Option>
              </Select>
            </StyledFormItem>
            <HelpText>Top is for higher privilege, bottom is for lower.</HelpText>
          </Col>
        )}
      </AntRow>
      <StyledFormItem name="is_default" valuePropName="checked">
        <Checkbox>Make this the default role for new users</Checkbox>
      </StyledFormItem>
      <HelpText>
        If checked, all new users will be assigned this role upon registration.
      </HelpText>

      <Divider orientation="left" plain>
        Permissions
      </Divider>
      <HelpText>
        Grant specific permissions to define what users with this role can access
        and do.
      </HelpText>

      <PermissionsContainer>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Input.Search
            placeholder="Search permissions..."
            allowClear
            onChange={(e) => setPermissionSearchText(e.target.value)}
            style={{ flexGrow: 1, minWidth: "200px", maxWidth: "300px" }}
          />
          <Checkbox
            checked={
              editedPermissions.length === allPermissionIds.length &&
              allPermissionIds.length > 0
            }
            indeterminate={
              editedPermissions.length > 0 &&
              editedPermissions.length < allPermissionIds.length
            }
            onChange={(e) =>
              setEditedPermissions(e.target.checked ? allPermissionIds : [])
            }
          >
            Select All
          </Checkbox>
        </div>
        {renderPermissionGroups()}
      </PermissionsContainer>
    </Form>
  );

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>Roles & Permissions</PageTitle>
            <HeaderSubtitle>
              Create and manage user roles and their associated permissions.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <Button
              type="primary"
              size="middle"
              style={{ borderRadius: "12px" }}
              icon={<Plus size={16} />}
              onClick={handleCreateRole}
              disabled={actionLoading}
            >
              Create Role
            </Button>
            <RefreshButton
              icon={
                <LordIcon
                  src="https://cdn.lordicon.com/valwmkhs.json"
                  trigger="hover"
                  size="20px"
                />
              }
              onClick={fetchAllData}
              loading={loading}
            />
          </ActionButtonsContainer>
        </DashboardHeader>

        <Divider />

        <TableSection
          transition={{ duration: 0.4 }}
        >
          <TableHeader>
            <TableTitle>
              <Shield /> All System Roles
            </TableTitle>
            <TableDescription>
              Drag and drop roles to set their hierarchy. Roles at the top have
              higher privilege.
            </TableDescription>
          </TableHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input
                placeholder="Search roles..."
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: isMobile ? "100%" : 280 }}
              />
            </SearchFilterContainer>
            <Tag color="cyan" style={{ width: "fit-content" }}>
              {loading ? <SkeletonLine width="20px" /> : roles.length} Roles
            </Tag>
          </FilterBar>

          {isMobile ? (
            <div style={{ padding: "8px" }}>
              {loading
                ? generateSkeletonData(5).map(renderMobileRoleCard)
                : roles.length > 0
                ? roles.map(renderMobileRoleCard)
                : <Empty description="No roles found" />}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={roles.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
                <AdminCompactTable
                  columns={columns}
                  dataSource={
                    loading ? generateSkeletonData(roles.length || 5) : roles
                  }
                  rowKey="id"
                  pagination={false}
                  components={{ body: { row: Row } }}
                  scroll={{ x: 1000 }}
                  loading={false}
                />
              </SortableContext>
            </DndContext>
          )}
        </TableSection>

        {/* Edit/Create Form - Responsive (Drawer on Mobile, Modal on Desktop) */}
        {isMobile ? (
          <Drawer.Root
            open={modalState.visible}
            onOpenChange={(open) =>
              setModalState((prev) => ({ ...prev, visible: open }))
            }
          >
            <Drawer.Portal>
              <StyledDrawerOverlay />
              <StyledDrawerContent>
                <DrawerHandle />
                <DrawerHeader>
                  <DrawerTitle>
                    {modalState.mode === "edit"
                      ? `Edit Role: ${selectedRole?.name}`
                      : "Create New Role"}
                  </DrawerTitle>
                  <Button
                    type="text"
                    icon={<X size={20} />}
                    onClick={() =>
                      setModalState((prev) => ({ ...prev, visible: false }))
                    }
                  />
                </DrawerHeader>
                <DrawerBody>{renderFormContent()}</DrawerBody>
                <DrawerFooter>
                  <Button
                    onClick={() =>
                      setModalState((prev) => ({ ...prev, visible: false }))
                    }
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<Save size={16} />}
                    loading={actionLoading}
                    onClick={handleFormSubmit}
                    key={`btn-${actionLoading}`}>
                    Save Changes
                  </Button>
                </DrawerFooter>
              </StyledDrawerContent>
            </Drawer.Portal>
          </Drawer.Root>
        ) : (
          <Modal
            title={
              modalState.mode === "edit"
                ? `Edit Role: ${selectedRole?.name}`
                : "Create New Role"
            }
            open={modalState.visible}
            onCancel={() =>
              setModalState((prev) => ({ ...prev, visible: false }))
            }
            width={900}
            destroyOnClose
            footer={[
              <Button
                key="back"
                onClick={() =>
                  setModalState((prev) => ({ ...prev, visible: false }))
                }
              >
                Cancel
              </Button>,
              <Button
                key={`btn-${actionLoading}`}
                type="primary"
                icon={<Save size={16} />}
                loading={actionLoading}
                onClick={handleFormSubmit}
              >
                Save Changes
              </Button>,
            ]}
          >
            {renderFormContent()}
          </Modal>
        )}

        <Modal
          title="Confirm Deletion"
          open={deleteConfirmVisible}
          onCancel={() => setDeleteConfirmVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setDeleteConfirmVisible(false)}>
              Cancel
            </Button>,
            <Button
              key={`btn-${actionLoading}`}
              danger
              type="primary"
              onClick={handleConfirmDelete}
              loading={actionLoading}
            >
              Delete Role
            </Button>,
          ]}
        >
          <Space align="start" size="middle">
            <Shield color={colors.error} size={32} />
            <div>
              <p>
                Are you sure you want to delete the{" "}
                <strong>{selectedRole?.name}</strong> role? This action cannot
                be undone.
              </p>
              {selectedRole?.is_system && (
                <Alert
                  message="System roles cannot be deleted."
                  type="error"
                  showIcon
                  style={{ marginBottom: 8 }}
                />
              )}
              {selectedRole?.user_count > 0 && (
                <Alert
                  message={`This role is assigned to ${selectedRole.user_count} user(s). Reassign them first.`}
                  type="warning"
                  showIcon
                  style={{ marginBottom: 8 }}
                />
              )}
              {user?.role?.hierarchy_level <= selectedRole?.hierarchy_level &&
                !selectedRole?.is_system &&
                !isElevatedRoleManager && (
                  <Alert
                    message="You cannot delete a role with equal or higher privileges than your own."
                    type="error"
                    showIcon
                  />
                )}
            </div>
          </Space>
        </Modal>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default RolesManagement;