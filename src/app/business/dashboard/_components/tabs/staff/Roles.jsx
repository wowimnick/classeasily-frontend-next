"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import { Drawer as VaulDrawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import {
  Table,
  Button,
  Typography,
  Tag,
  Space,
  Tooltip,
  Drawer,
  Form,
  Input,
  Checkbox,
  Popconfirm,
  Empty,
  Row,
  Col,
  Collapse,
  Spin,
  Card,
} from "antd";
import message from "@/lib/message";
import { Plus, Edit, Trash2, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";
import { businessRoleService } from "@/services/apiService";
import { useAuth } from "@/lib/auth-client";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// Styled Components
const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  border: "#f1f5f9",
  textPrimary: "#334155",
  textSecondary: "#64748b",
  lightBg: "#f8fafc",
};

const TableSection = styled(motion.div)`
  background: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  overflow: hidden;
  position: relative;

  @media (max-width: 768px) {
    border-radius: 12px;
    margin: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  @media (max-width: 480px) {
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  }
`;

const TableHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  @media (max-width: 768px) {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  @media (max-width: 480px) {
    padding: 12px;
    gap: 12px;
  }
`;

const HeaderContent = styled.div`
  flex: 1;

  @media (max-width: 768px) {
    margin-bottom: 0;
  }
`;

const TableTitle = styled(Title).attrs({ level: 4 })`
  margin: 0 0 4px 0 !important;
  color: ${colors.textPrimary};
  font-weight: 600;
  font-size: 18px !important;

  @media (max-width: 768px) {
    font-size: 16px !important;
    margin: 0 0 6px 0 !important;
  }

  @media (max-width: 480px) {
    font-size: 15px !important;
    margin: 0 0 4px 0 !important;
  }
`;

const HeaderParagraph = styled(Paragraph)`
  margin: 0 !important;

  .ant-typography {
    font-size: 14px;
    line-height: 1.4;

    @media (max-width: 768px) {
      font-size: 13px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
    }
  }
`;

const StyledVaulDrawerOverlay = styled(VaulDrawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const StyledVaulDrawerContent = styled(VaulDrawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 85vh;
  max-height: 85vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;

const VaulDrawerHandle = styled(VaulDrawer.Handle)`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const VaulDrawerHeader = styled.div`
  flex-shrink: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
`;

const VaulDrawerTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
`;

const VaulDrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

const VaulDrawerFooter = styled.div`
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StyledTable = styled(Table)`
  .ant-table {
    border: none;
  }

  .ant-table-thead > tr > th {
    background: #fafbfc;
    border-bottom: 1px solid ${colors.border};
    font-weight: 600;
    color: #64748b;
    font-size: 11px;
    padding: 10px 14px;
    letter-spacing: 0.05em;
    text-transform: uppercase;

    &:first-child {
      border-top-left-radius: 0;
    }
    &:last-child {
      border-top-right-radius: 0;
    }
  }

  .ant-table-tbody > tr > td {
    padding: 12px 14px;
    border-bottom: 1px solid ${colors.border};
    font-size: 13px;
    vertical-align: middle;
  }

  .ant-table-tbody > tr.ant-table-placeholder:hover > td {
    background: white;
  }

  .ant-table-tbody > tr:hover > td {
    background: ${colors.lightBg};
  }
`;

const ActionButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  gap: 8px;
  font-weight: 500;

  @media (max-width: 768px) {
    height: 40px;
    border-radius: 10px;
    width: 100%;
    justify-content: center;
  }

  @media (max-width: 480px) {
    height: 36px;
    border-radius: 8px;
    font-size: 13px;
  }
`;

const ActionButtonSmall = styled(Button)`
  height: 32px;
  border-radius: 8px;
  border: 1px solid ${colors.border};
  background: white;
  color: ${colors.textSecondary};

  &:hover:not(:disabled) {
    color: ${colors.primary};
    border-color: ${colors.primary};
    background: ${colors.lightBg};
  }

  &.danger:hover:not(:disabled) {
    color: ${colors.error};
    border-color: ${colors.error};
    background: #fef2f2;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    height: 28px;
    border-radius: 6px;
    min-width: 28px;
    padding: 0 6px;
  }

  @media (max-width: 480px) {
    height: 26px;
    border-radius: 4px;
    min-width: 26px;
    padding: 0 4px;
  }

  .lucide {
    width: 14px;
    height: 14px;
  }
`;

const DesktopDrawerContent = styled(VaulDrawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: 720px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DesktopDrawerHeader = styled.div`
  flex-shrink: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
`;

const DesktopDrawerTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
`;

const DesktopDrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: #f8fafc;
`;

const DesktopDrawerFooter = styled.div`
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: white;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const CollapsePanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const PermissionCheckbox = styled(Checkbox)`
  font-size: 14px;
  color: ${colors.textPrimary};
  line-height: 1.4;

  .ant-checkbox-wrapper {
    align-items: flex-start;
  }

  @media (max-width: 768px) {
    font-size: 13px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const RoleNameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    gap: 8px;
  }

  @media (max-width: 480px) {
    gap: 6px;
  }
`;

const RoleIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, ${colors.primary}20, ${colors.primary}10);
  border: 1px solid ${colors.primary}40;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    width: 24px;
    height: 24px;
    border-radius: 4px;
  }
`;

const MemberCountTag = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 500;

  @media (max-width: 768px) {
    gap: 4px;
    padding: 3px 8px;
    border-radius: 4px;
  }

  @media (max-width: 480px) {
    gap: 3px;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .lucide {
    width: 14px;
    height: 14px;
  }
`;

// Mobile Role Card Component
const MobileRoleCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .ant-card-body {
    padding: 16px;
  }

  @media (max-width: 480px) {
    border-radius: 8px;
    margin-bottom: 8px;

    .ant-card-body {
      padding: 12px;
    }
  }
`;

const MobileCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;

  @media (max-width: 480px) {
    margin-bottom: 8px;
  }
`;

const MobileCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 480px) {
    gap: 6px;
  }
`;

const MobileCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;

  @media (max-width: 480px) {
    padding: 2px 0;
  }
`;

const MobileCardLabel = styled(Text)`
  font-size: 12px;
  color: ${colors.textSecondary};
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

// --- SKELETON LOADER DEFINITIONS ---
const SkeletonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.gap || "8px"};
  width: 100%;
`;

const SkeletonLine = styled.div`
  height: ${(props) => props.height || "14px"};
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

const SkeletonBlock = styled(SkeletonLine)`
  border-radius: ${(props) => props.radius || "8px"};
  width: ${(props) => props.size || "32px"};
  height: ${(props) => props.size || "32px"};
`;

const SkeletonTag = styled(SkeletonLine)`
  height: 28px;
  width: 110px;
  border-radius: 6px;
`;

// Skeleton for Mobile View Card
const SkeletonMobileRoleCard = () => (
  <MobileRoleCard>
    <MobileCardHeader>
      <RoleNameCell style={{ flex: 1, minWidth: 0 }}>
        <SkeletonBlock radius="6px" size="32px" />
        <SkeletonWrapper>
          <SkeletonLine width="120px" />
          <SkeletonLine width="160px" height="12px" />
        </SkeletonWrapper>
      </RoleNameCell>
      <Space size="small" style={{ flexShrink: 0, marginLeft: "8px" }}>
        <SkeletonBlock radius="6px" size="28px" />
        <SkeletonBlock radius="6px" size="28px" />
      </Space>
    </MobileCardHeader>
    <MobileCardContent>
      <MobileCardRow>
        <SkeletonLine width="90px" height="12px" />
        <SkeletonTag width="100px" height="24px" />
      </MobileCardRow>
    </MobileCardContent>
  </MobileRoleCard>
);

// Skeleton Row for Table View
const SkeletonTableRow = () => ({
  key: Math.random(),
  name: (
    <RoleNameCell>
      <SkeletonBlock size="32px" />
      <SkeletonLine width="150px" />
    </RoleNameCell>
  ),
  description: <SkeletonLine width="250px" />,
  user_count: <SkeletonTag />,
  actions: (
    <Space size="small">
      <SkeletonBlock size="32px" />
      <SkeletonBlock size="32px" />
    </Space>
  ),
});

const generateSkeletonData = (count = 3) => {
  return Array.from({ length: count }, SkeletonTableRow);
};

const skeletonColumns = [
  { title: "ROLE NAME", dataIndex: "name", key: "name" },
  { title: "DESCRIPTION", dataIndex: "description", key: "description" },
  { title: "TEAM MEMBERS", dataIndex: "user_count", key: "user_count" },
  { title: "ACTIONS", dataIndex: "actions", key: "actions", width: 120 },
];

const RolesSkeleton = ({ isMobile, count = 3 }) => {
  if (isMobile) {
    return (
      <div style={{ padding: "16px" }}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonMobileRoleCard key={i} />
        ))}
      </div>
    );
  }
  return (
    <StyledTable
      columns={skeletonColumns}
      dataSource={generateSkeletonData(count)}
      pagination={false}
      rowKey="key"
    />
  );
};

const MobileRoleItem = ({
  record,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  windowWidth,
}) => {
  const isOwnerRole = record?.name === "Business Owner";
  const userCount =
    typeof record?.user_count === "number" ? record.user_count : 0;

  const tooltipEdit = isOwnerRole
    ? "The Owner role cannot be edited"
    : !canEdit
    ? "You don't have permission to edit roles"
    : "Edit role";

  const tooltipDelete = isOwnerRole
    ? "The Owner role cannot be deleted"
    : userCount > 0
    ? "Cannot delete role with assigned members"
    : !canDelete
    ? "You don't have permission to delete roles"
    : "Delete role";

  return (
    <MobileRoleCard>
      <MobileCardHeader>
        <RoleNameCell style={{ flex: 1, minWidth: 0 }}>
          <RoleIcon>
            <Shield
              size={windowWidth <= 480 ? 12 : windowWidth <= 768 ? 14 : 16}
              color={colors.primary}
            />
          </RoleIcon>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Text
              strong
              style={{
                fontSize: windowWidth <= 480 ? "13px" : "14px",
                display: "block",
                wordBreak: "break-word",
              }}
            >
              {record?.name || "Unnamed Role"}
            </Text>
            <Text
              type="secondary"
              style={{
                fontSize: windowWidth <= 480 ? "11px" : "12px",
                display: "block",
                marginTop: "2px",
                wordBreak: "break-word",
              }}
            >
              {record?.description || "No description provided"}
            </Text>
          </div>
        </RoleNameCell>

        <Space size="small" style={{ flexShrink: 0, marginLeft: "8px" }}>
          <Tooltip title={tooltipEdit}>
            <ActionButtonSmall
              icon={<Edit size={windowWidth <= 480 ? 10 : 12} />}
              onClick={() => onEdit(record)}
              disabled={!canEdit || isOwnerRole}
            />
          </Tooltip>
          <Tooltip title={tooltipDelete}>
            <Popconfirm
              title="Delete this role?"
              description="This action cannot be undone."
              onConfirm={() => onDelete(record?.id)}
              okText="Yes, Delete"
              cancelText="Cancel"
              disabled={!canDelete || isOwnerRole || userCount > 0}
            >
              <ActionButtonSmall
                className="danger"
                icon={<Trash2 size={windowWidth <= 480 ? 10 : 12} />}
                disabled={!canDelete || isOwnerRole || userCount > 0}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      </MobileCardHeader>

      <MobileCardContent>
        <MobileCardRow>
          <MobileCardLabel>Team Members</MobileCardLabel>
          <MemberCountTag>
            <Users size={windowWidth <= 480 ? 10 : 12} />
            <Text
              strong
              style={{ fontSize: windowWidth <= 480 ? "11px" : "12px" }}
            >
              {userCount} members
            </Text>
          </MemberCountTag>
        </MobileCardRow>
      </MobileCardContent>
    </MobileRoleCard>
  );
};

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1024);
  const [form] = Form.useForm();

  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const canManageRoles =
    permissions?.some((p) => p?.endsWith?.(".manage_business_roles")) || false;

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    setIsMobile(window.innerWidth <= 768);

    const checkMobile = () => {
      setWindowWidth(window.innerWidth);
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchRolesAndPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesResult, permsResult] = await Promise.all([
        businessRoleService.getRoles(),
        businessRoleService.getAvailablePermissions(),
      ]);

      if (rolesResult?.success) {
        setRoles(Array.isArray(rolesResult.data) ? rolesResult.data : []);
      } else {
        message.error(rolesResult?.error || "Failed to load roles.");
        setRoles([]);
      }

      if (permsResult?.success) {
        setPermissionGroups(
          Array.isArray(permsResult.data) ? permsResult.data : []
        );
      } else {
        message.error(permsResult?.error || "Failed to load permissions.");
        setPermissionGroups([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("An error occurred while fetching data.");
      setRoles([]);
      setPermissionGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, [fetchRolesAndPermissions]);

  const showDrawer = async (role = null) => {
    setIsDrawerVisible(true);
    setEditingRole(role);

    if (role?.id) {
      setDrawerLoading(true);
      try {
        const result = await businessRoleService.getRole(role.id);
        if (result?.success) {
          form.setFieldsValue({
            name: result.data?.name || "",
            description: result.data?.description || "",
          });
          setSelectedPermissions(
            Array.isArray(result.data?.permissions)
              ? result.data.permissions
              : []
          );
        } else {
          message.error("Failed to load role details.");
          onDrawerClose();
        }
      } catch (error) {
        console.error("Error loading role:", error);
        message.error("Failed to load role details.");
        onDrawerClose();
      } finally {
        setDrawerLoading(false);
      }
    } else {
      form.resetFields();
      setSelectedPermissions([]);
    }
  };

  const onDrawerClose = () => {
    setIsDrawerVisible(false);
    setEditingRole(null);
    form.resetFields();
    setSelectedPermissions([]);
  };

  const getApiErrorMessage = (error) => {
    if (typeof error === "string") return error;
    if (error?.detail) return error.detail;
    if (error?.name && Array.isArray(error.name)) return error.name.join(" ");
    return "An unknown error occurred. Please try again.";
  };

  const handleFormSubmit = async (values) => {
    if (!values?.name?.trim()) {
      message.error("Role name is required.");
      return;
    }

    message.loading({ content: "Saving role...", key: "roleSave" });
    const payload = {
      ...values,
      permissions: Array.isArray(selectedPermissions)
        ? selectedPermissions
        : [],
    };

    try {
      let result;
      if (editingRole?.id) {
        result = await businessRoleService.updateRole(editingRole.id, payload);
      } else {
        result = await businessRoleService.createRole(payload);
      }

      if (result?.success) {
        message.success({
          content: `Role ${editingRole ? "updated" : "created"} successfully.`,
          key: "roleSave",
        });
        onDrawerClose();
        await fetchRolesAndPermissions();
      } else {
        const errorMsg = getApiErrorMessage(result?.error);
        message.error({ content: errorMsg, key: "roleSave", duration: 5 });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMsg = getApiErrorMessage(error);
      message.error({
        content: errorMsg,
        key: "roleSave",
        duration: 5,
      });
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!roleId) {
      message.error("Invalid role ID.");
      return;
    }

    message.loading({ content: "Deleting role...", key: "roleDelete" });
    try {
      const result = await businessRoleService.deleteRole(roleId);
      if (result?.success) {
        message.success({ content: "Role deleted.", key: "roleDelete" });
        await fetchRolesAndPermissions();
      } else {
        message.error({
          content: getApiErrorMessage(result?.error),
          key: "roleDelete",
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      message.error({
        content: getApiErrorMessage(error),
        key: "roleDelete",
        duration: 5,
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "ROLE NAME",
        dataIndex: "name",
        key: "name",
        render: (name) => (
          <RoleNameCell>
            <RoleIcon>
              <Shield size={16} color={colors.primary} />
            </RoleIcon>
            <Text strong style={{ fontSize: "14px" }}>
              {name || "Unnamed Role"}
            </Text>
          </RoleNameCell>
        ),
      },
      {
        title: "DESCRIPTION",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        render: (description) => (
          <Text type="secondary" style={{ fontSize: "14px" }}>
            {description || "No description provided"}
          </Text>
        ),
      },
      {
        title: "TEAM MEMBERS",
        dataIndex: "user_count",
        key: "user_count",
        render: (count) => (
          <MemberCountTag>
            <Users size={14} />
            <Text strong style={{ fontSize: "13px" }}>
              {typeof count === "number" ? count : 0} members
            </Text>
          </MemberCountTag>
        ),
      },
      {
        title: "ACTIONS",
        key: "actions",
        width: 120,
        render: (_, record) => {
          const isOwnerRole = record?.name === "Business Owner";
          const canEdit = !isOwnerRole && canManageRoles;
          const userCount =
            typeof record?.user_count === "number" ? record.user_count : 0;
          const canDelete = !isOwnerRole && userCount === 0 && canManageRoles;

          const tooltipEdit = isOwnerRole
            ? "The Owner role cannot be edited"
            : !canManageRoles
            ? "You don't have permission to edit roles"
            : "Edit role";

          const tooltipDelete = isOwnerRole
            ? "The Owner role cannot be deleted"
            : userCount > 0
            ? "Cannot delete role with assigned members"
            : !canManageRoles
            ? "You don't have permission to delete roles"
            : "Delete role";

          return (
            <Space size="small">
              <Tooltip title={tooltipEdit}>
                <span>
                  <ActionButtonSmall
                    icon={<Edit size={14} />}
                    onClick={() => showDrawer(record)}
                    disabled={!canEdit}
                  />
                </span>
              </Tooltip>
              <Tooltip title={tooltipDelete}>
                <span>
                  <Popconfirm
                    title="Delete this role?"
                    description="This action cannot be undone."
                    onConfirm={() => handleDeleteRole(record?.id)}
                    okText="Yes, Delete"
                    cancelText="No"
                    disabled={!canDelete}
                  >
                    <ActionButtonSmall
                      className="danger"
                      icon={<Trash2 size={14} />}
                      disabled={!canDelete}
                    />
                  </Popconfirm>
                </span>
              </Tooltip>
            </Space>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManageRoles]
  );

  const handlePermissionChange = (permissionId, isChecked) => {
    if (!permissionId) return;

    setSelectedPermissions((prev) => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return isChecked
        ? [...prevArray, permissionId]
        : prevArray.filter((id) => id !== permissionId);
    });
  };

  const handleDrawerOpenChange = (open) => {
    if (!open) {
      setTimeout(() => {
        onDrawerClose();
      }, 300);
    }
  };

  const renderContent = () => {
    if (loading && roles.length === 0) {
      return <RolesSkeleton isMobile={isMobile} />;
    }

    if (isMobile) {
      return (
        <div style={{ padding: "16px" }}>
          {roles.length === 0 ? (
            <Empty
              description="No custom roles created yet."
              style={{ padding: "40px 20px" }}
            />
          ) : (
            roles.map((role) => (
              <MobileRoleItem
                key={role.id}
                record={role}
                onEdit={showDrawer}
                onDelete={handleDeleteRole}
                canEdit={role.name !== "Business Owner" && canManageRoles}
                canDelete={
                  role.name !== "Business Owner" &&
                  role.user_count === 0 &&
                  canManageRoles
                }
                windowWidth={windowWidth}
              />
            ))
          )}
        </div>
      );
    }

    return (
      <StyledTable
        columns={columns}
        dataSource={Array.isArray(roles) ? roles : []}
        rowKey="id"
        pagination={false}
        loading={loading && roles.length > 0}
        locale={{
          emptyText: <Empty description="No custom roles created yet." />,
        }}
      />
    );
  };

  return (
    <TableSection initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <TableHeader>
        <HeaderContent>
          <TableTitle>Roles & Permissions</TableTitle>
          <HeaderParagraph type="secondary">
            Create custom roles to assign specific permissions to your team
            members.
          </HeaderParagraph>
        </HeaderContent>
        {canManageRoles ? (
          <ActionButton
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => showDrawer()}
          >
            Create Role
          </ActionButton>
        ) : (
          <Tooltip title="You do not have permission to create new roles.">
            <span>
              <ActionButton type="primary" icon={<Plus size={16} />} disabled>
                Create Role
              </ActionButton>
            </span>
          </Tooltip>
        )}
      </TableHeader>
      {renderContent()}
      {/* Single Vaul Drawer for both mobile and desktop */}
      <VaulDrawer.Root
        open={isDrawerVisible}
        onOpenChange={handleDrawerOpenChange}
        direction={isMobile ? "bottom" : "right"}
        dismissible
        handleOnly={!isMobile}
      >
        <VaulDrawer.Portal>
          <StyledVaulDrawerOverlay />
          {isMobile ? (
            <StyledVaulDrawerContent>
              <VaulDrawerHandle />
              <VaulDrawerHeader>
                <VaulDrawerTitle>
                  {editingRole ? "Edit Role" : "Create New Role"}
                </VaulDrawerTitle>
              </VaulDrawerHeader>
              <VaulDrawerBody>
                {drawerLoading ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: "48px",
                    }}
                  >
                    <Spin tip="Loading Role Details..." />
                  </div>
                ) : (
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFormSubmit}
                  >
                    <Form.Item
                      name="name"
                      label="Role Name"
                      rules={[
                        {
                          required: true,
                          message: "Please enter a role name.",
                        },
                        {
                          min: 2,
                          message: "Role name must be at least 2 characters.",
                        },
                        {
                          max: 50,
                          message: "Role name cannot exceed 50 characters.",
                        },
                      ]}
                    >
                      <Input
                        prefix={
                          <Shield size={16} color={colors.textSecondary} />
                        }
                        placeholder="e.g., Host, Front Desk"
                        maxLength={50}
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="description"
                      label="Description"
                      rules={[
                        {
                          max: 200,
                          message: "Description cannot exceed 200 characters.",
                        },
                      ]}
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="Briefly describe what this role is for."
                        maxLength={200}
                        showCount
                        size="large"
                      />
                    </Form.Item>

                    <Title
                      level={5}
                      style={{
                        marginTop: 24,
                        marginBottom: 16,
                        fontSize: "14px",
                      }}
                    >
                      Assign Permissions
                    </Title>

                    <Collapse
                      accordion
                      size="small"
                      style={{
                        background: "white",
                        border: `1px solid ${colors.border}`,
                        borderRadius: "8px",
                      }}
                    >
                      {Array.isArray(permissionGroups) &&
                        permissionGroups.map((group) => {
                          if (
                            !group?.permissions ||
                            !Array.isArray(group.permissions)
                          ) {
                            return null;
                          }

                          const totalInGroup = group.permissions.length;
                          const selectedPermissionsArray = Array.isArray(
                            selectedPermissions
                          )
                            ? selectedPermissions
                            : [];
                          const selectedInGroup = group.permissions.filter(
                            (p) =>
                              p?.id && selectedPermissionsArray.includes(p.id)
                          ).length;

                          return (
                            <Panel
                              header={
                                <CollapsePanelHeader>
                                  <Text
                                    strong
                                    style={{
                                      fontSize: "13px",
                                      flex: 1,
                                      minWidth: 0,
                                    }}
                                  >
                                    {group.name || "Unnamed Group"}
                                  </Text>
                                  <Tag
                                    color={
                                      selectedInGroup === totalInGroup
                                        ? "green"
                                        : selectedInGroup > 0
                                        ? "blue"
                                        : "default"
                                    }
                                    style={{
                                      fontSize: "10px",
                                      padding: "2px 6px",
                                      marginLeft: "8px",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {selectedInGroup} / {totalInGroup}
                                  </Tag>
                                </CollapsePanelHeader>
                              }
                              key={group.id || `group-${Math.random()}`}
                            >
                              <Row gutter={[8, 12]}>
                                {group.permissions.map((perm) => {
                                  if (!perm?.id || !perm?.name) return null;

                                  return (
                                    <Col span={24} key={perm.id}>
                                      <PermissionCheckbox
                                        checked={selectedPermissionsArray.includes(
                                          perm.id
                                        )}
                                        onChange={(e) =>
                                          handlePermissionChange(
                                            perm.id,
                                            e.target.checked
                                          )
                                        }
                                      >
                                        {perm.name}
                                      </PermissionCheckbox>
                                    </Col>
                                  );
                                })}
                              </Row>
                            </Panel>
                          );
                        })}
                    </Collapse>
                  </Form>
                )}
              </VaulDrawerBody>
              <VaulDrawerFooter>
                <Button
                  onClick={() => form.submit()}
                  type="primary"
                  loading={drawerLoading}
                  block
                  key={`btn-${drawerLoading}`}
                >
                  {editingRole ? "Save Changes" : "Create Role"}
                </Button>
                <Button onClick={onDrawerClose} block>
                  Cancel
                </Button>
              </VaulDrawerFooter>
            </StyledVaulDrawerContent>
          ) : (
            <DesktopDrawerContent>
              <VaulDrawerHandle />
              <DesktopDrawerHeader>
                <DesktopDrawerTitle>
                  {editingRole ? "Edit Role" : "Create New Role"}
                </DesktopDrawerTitle>
              </DesktopDrawerHeader>
              <DesktopDrawerBody>
                <Spin spinning={drawerLoading} tip="Loading Role Details...">
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFormSubmit}
                  >
                    <Form.Item
                      name="name"
                      label="Role Name"
                      rules={[
                        {
                          required: true,
                          message: "Please enter a role name.",
                        },
                        {
                          min: 2,
                          message: "Role name must be at least 2 characters.",
                        },
                        {
                          max: 50,
                          message: "Role name cannot exceed 50 characters.",
                        },
                      ]}
                    >
                      <Input
                        prefix={
                          <Shield size={16} color={colors.textSecondary} />
                        }
                        placeholder="e.g., Host, Front Desk"
                        maxLength={50}
                      />
                    </Form.Item>

                    <Form.Item
                      name="description"
                      label="Description"
                      rules={[
                        {
                          max: 200,
                          message: "Description cannot exceed 200 characters.",
                        },
                      ]}
                    >
                      <Input.TextArea
                        rows={2}
                        placeholder="Briefly describe what this role is for."
                        maxLength={200}
                        showCount
                      />
                    </Form.Item>

                    <Title
                      level={5}
                      style={{
                        marginTop: 24,
                        marginBottom: 16,
                        fontSize: "16px",
                      }}
                    >
                      Assign Permissions
                    </Title>

                    <Collapse
                      accordion
                      style={{
                        background: "white",
                        border: `1px solid ${colors.border}`,
                        borderRadius: "12px",
                      }}
                    >
                      {Array.isArray(permissionGroups) &&
                        permissionGroups.map((group) => {
                          if (
                            !group?.permissions ||
                            !Array.isArray(group.permissions)
                          ) {
                            return null;
                          }

                          const totalInGroup = group.permissions.length;
                          const selectedPermissionsArray = Array.isArray(
                            selectedPermissions
                          )
                            ? selectedPermissions
                            : [];
                          const selectedInGroup = group.permissions.filter(
                            (p) =>
                              p?.id && selectedPermissionsArray.includes(p.id)
                          ).length;

                          return (
                            <Panel
                              header={
                                <CollapsePanelHeader>
                                  <Text
                                    strong
                                    style={{
                                      fontSize: "14px",
                                      flex: 1,
                                      minWidth: 0,
                                    }}
                                  >
                                    {group.name || "Unnamed Group"}
                                  </Text>
                                  <Tag
                                    color={
                                      selectedInGroup === totalInGroup
                                        ? "green"
                                        : selectedInGroup > 0
                                        ? "blue"
                                        : "default"
                                    }
                                    style={{
                                      fontSize: "11px",
                                      padding: "4px 8px",
                                      marginLeft: "8px",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {selectedInGroup} / {totalInGroup}
                                  </Tag>
                                </CollapsePanelHeader>
                              }
                              key={group.id || `group-${Math.random()}`}
                            >
                              <Row gutter={[8, 16]}>
                                {group.permissions.map((perm) => {
                                  if (!perm?.id || !perm?.name) return null;

                                  return (
                                    <Col span={24} sm={12} key={perm.id}>
                                      <PermissionCheckbox
                                        checked={selectedPermissionsArray.includes(
                                          perm.id
                                        )}
                                        onChange={(e) =>
                                          handlePermissionChange(
                                            perm.id,
                                            e.target.checked
                                          )
                                        }
                                      >
                                        {perm.name}
                                      </PermissionCheckbox>
                                    </Col>
                                  );
                                })}
                              </Row>
                            </Panel>
                          );
                        })}
                    </Collapse>
                  </Form>
                </Spin>
              </DesktopDrawerBody>
              <DesktopDrawerFooter>
                <Button onClick={onDrawerClose}>Cancel</Button>
                <Button
                  onClick={() => form.submit()}
                  type="primary"
                  loading={drawerLoading}
                  key={`btn-${drawerLoading}`}
                >
                  {editingRole ? "Save Changes" : "Create Role"}
                </Button>
              </DesktopDrawerFooter>
            </DesktopDrawerContent>
          )}
        </VaulDrawer.Portal>
      </VaulDrawer.Root>
    </TableSection>
  );
};

export default Roles;
