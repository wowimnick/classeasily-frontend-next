"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback,
} from "react";
import { useAuthStore } from "@/lib/auth-client";
import styled from "styled-components";
import {
  Skeleton,
  Table,
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
  message,
  Grid,
  Empty,
  Row as AntRow,
  Typography,
  Collapse,
} from "antd";
import {
  Shield,
  Users,
  Plus,
  Edit,
  Trash2,
  Copy,
  Search,
  Save,
  GripVertical,
  ListOrdered,
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
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";
import { motion } from "framer-motion";

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

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
};
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
`;
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

// --- MODAL & PERMISSION STYLES ---
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
const MobileCardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${colors.border};
`;

// --- DND & UTILITIES ---
const RowContext = React.createContext({});
const formatDate = (dateString) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));

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
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
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
    setIsCreateModalVisible(true);
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
        setIsEditModalVisible(true);
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

  const handleFormSubmit = async (isEditing) => {
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
        setIsEditModalVisible(false);
        setIsCreateModalVisible(false);
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

  const columns = [
    { key: "sort", width: 50, fixed: "left", render: () => <DragHandle /> },
    {
      title: "Role Name",
      dataIndex: "name",
      key: "name",
      width: 200,
      fixed: "left",
      render: (name, role) => (
        <Space>
          <RoleTag color={role.color || colors.textSecondary}>{name}</RoleTag>
          {role.is_default && <Tag color="blue">Default</Tag>}
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      responsive: ["md"],
      ellipsis: true,
    },
    {
      title: "Users",
      dataIndex: "user_count",
      key: "user_count",
      width: 100,
      align: "center",
      render: (count) => (
        <UserCount>
          <Users size={16} />
          {count}
        </UserCount>
      ),
    },
    {
      title: "Last Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      render: formatDate,
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
        const canEdit = user?.role?.hierarchy_level > role.hierarchy_level;
        const canDelete =
          !role.is_system &&
          role.user_count === 0 &&
          user?.role?.hierarchy_level > role.hierarchy_level;
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
    const canEdit = user?.role?.hierarchy_level > role.hierarchy_level;
    const canDelete =
      !role.is_system &&
      role.user_count === 0 &&
      user?.role?.hierarchy_level > role.hierarchy_level;
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
              {roles.length} Roles
            </Tag>
          </FilterBar>

          {isMobile ? (
            <div style={{ padding: "8px" }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : roles.length > 0 ? (
                roles.map(renderMobileRoleCard)
              ) : (
                <Empty description="No roles found" />
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
                items={roles.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
                <StyledTable
                  columns={columns}
                  dataSource={roles}
                  rowKey="id"
                  loading={{
                    spinning: loading,
                    indicator: <GlobalLoaderWithInlineStyles />,
                  }}
                  pagination={false}
                  components={{ body: { row: Row } }}
                  scroll={{ x: 1000 }}
                />
              </SortableContext>
            </DndContext>
          )}
        </TableSection>

        <Modal
          title={
            isEditModalVisible
              ? `Edit Role: ${selectedRole?.name}`
              : "Create New Role"
          }
          open={isCreateModalVisible || isEditModalVisible}
          onCancel={() => {
            setIsCreateModalVisible(false);
            setIsEditModalVisible(false);
          }}
          width={isMobile ? "95%" : 900}
          destroyOnClose
          footer={[
            <Button
              key="back"
              onClick={() => {
                setIsCreateModalVisible(false);
                setIsEditModalVisible(false);
              }}
            >
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              icon={<Save size={16} />}
              loading={actionLoading}
              onClick={() => handleFormSubmit(isEditModalVisible)}
            >
              Save Changes
            </Button>,
          ]}
        >
          <Form form={form} layout="vertical">
            <StyledFormItem
              name="name"
              label="Role Name"
              rules={[{ required: true }]}
            >
              <Input
                placeholder="e.g., Content Moderator"
                disabled={isEditModalVisible && selectedRole?.is_system}
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
                    presets={[
                      { label: "Recommended", colors: roleColorOptions },
                    ]}
                    showText
                  />
                </StyledFormItem>
                <HelpText>
                  This color is used throughout the UI to identify the role
                  visually.
                </HelpText>
              </Col>
              {!isEditModalVisible && (
                <Col xs={24} sm={12}>
                  <StyledFormItem
                    name="initial_position"
                    label="Initial Position in Hierarchy"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Option value="top">At the top (Higher Privilege)</Option>
                      <Option value="bottom">
                        At the bottom (Lower Privilege)
                      </Option>
                    </Select>
                  </StyledFormItem>
                  <HelpText>
                    Top is for higher privilege, bottom is for lower.
                  </HelpText>
                </Col>
              )}
            </AntRow>
            <StyledFormItem name="is_default" valuePropName="checked">
              <Checkbox>Make this the default role for new users</Checkbox>
            </StyledFormItem>
            <HelpText>
              If checked, all new users will be assigned this role upon
              registration.
            </HelpText>

            <Divider orientation="left" plain>
              Permissions
            </Divider>
            <HelpText>
              Grant specific permissions to define what users with this role can
              access and do.
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
                    setEditedPermissions(
                      e.target.checked ? allPermissionIds : []
                    )
                  }
                >
                  Select All
                </Checkbox>
              </div>
              {renderPermissionGroups()}
            </PermissionsContainer>
          </Form>
        </Modal>

        <Modal
          title="Confirm Deletion"
          open={deleteConfirmVisible}
          onCancel={() => setDeleteConfirmVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setDeleteConfirmVisible(false)}>
              Cancel
            </Button>,
            <Button
              key="delete"
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
            {" "}
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
                />
              )}
              {selectedRole?.user_count > 0 && (
                <Alert
                  message={`This role is assigned to ${selectedRole.user_count} user(s). Reassign them first.`}
                  type="warning"
                  showIcon
                />
              )}
              {user?.role?.hierarchy_level <= selectedRole?.hierarchy_level &&
                !selectedRole?.is_system && (
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
