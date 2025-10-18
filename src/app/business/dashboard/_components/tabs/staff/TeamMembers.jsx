"use client";
import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Drawer } from "vaul";
import {
  Table,
  Button,
  Typography,
  Tag,
  Space,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Empty,
  Card,
  Row,
  Col,
  Avatar,
} from "antd";
import {
  Plus,
  Edit,
  Trash2,
  Mail,
  User,
  CheckCircle,
  UserCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { useAuth } from "@/lib/auth-client";
import {
  businessStaffService,
  businessRoleService,
} from "@/services/apiService";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

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

const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: auto;
  max-height: 85vh;
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
  flex-shrink: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
`;

const DrawerTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

const DrawerFooter = styled.div`
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 12px;
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

const LoaderContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 10;
`;

const StyledTable = styled(Table)`
  .ant-table {
    border: none;
  }

  .ant-table-thead > tr > th {
    background: #fafbfc;
    border-bottom: 1px solid ${colors.border};
    font-weight: 600;
    color: ${colors.textPrimary};
    font-size: 13px;
    padding: 16px 24px;

    &:first-child {
      border-top-left-radius: 0;
    }
    &:last-child {
      border-top-right-radius: 0;
    }

    @media (max-width: 768px) {
      padding: 12px 16px;
      font-size: 12px;
    }

    @media (max-width: 480px) {
      padding: 8px 12px;
      font-size: 11px;
    }
  }

  .ant-table-tbody > tr > td {
    padding: 16px 24px;
    border-bottom: 1px solid ${colors.border};
    font-size: 14px;
    vertical-align: middle;

    @media (max-width: 768px) {
      padding: 12px 16px;
      font-size: 13px;
    }

    @media (max-width: 480px) {
      padding: 8px 12px;
      font-size: 12px;
    }
  }

  .ant-table-tbody > tr:hover > td {
    background: ${colors.lightBg};
  }

  @media (max-width: 768px) {
    .ant-table-thead {
      display: none;
    }

    .ant-table-tbody {
      display: block;
    }

    .ant-table-tbody > tr {
      display: block;
      border: 1px solid ${colors.border};
      border-radius: 8px;
      margin-bottom: 12px;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .ant-table-tbody > tr > td {
      display: block;
      border-bottom: none;
      padding: 0;
      position: relative;
    }
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
`;

// Mobile Card Component
const MobileStaffCard = styled(Card)`
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
  align-items: center;
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

const MemberNameCell = styled.div`
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

const MemberIcon = styled.div`
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

const StatusTag = styled(Tag)`
  border-radius: 6px;
  padding: 6px 8px;
  font-weight: 600;
  font-size: 12px;
  line-height: 1;
  height: auto;
  text-transform: uppercase;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 768px) {
    padding: 4px 6px;
    font-size: 11px;
    gap: 4px;
  }

  @media (max-width: 480px) {
    padding: 3px 5px;
    font-size: 10px;
    gap: 3px;
  }
`;

const MobileStaffItem = ({
  record,
  onEdit,
  onRemove,
  currentUserEmail,
  windowWidth,
}) => {
  const isSelf = record.user_email === currentUserEmail;

  const statusMap = {
    pending: {
      color: "#f59e0b",
      background: "#fef3c7",
      text: "Pending",
      icon: <Mail size={12} />,
    },
    accepted: {
      color: "#10b981",
      background: "#d1fae5",
      text: "Accepted",
      icon: <CheckCircle size={12} />,
    },
  };

  const status = statusMap[record.status] || {
    color: "#64748b",
    background: "#f1f5f9",
    text: record.status,
    icon: null,
  };

  return (
    <MobileStaffCard>
      <MobileCardHeader>
        <MemberNameCell>
          <MemberIcon>
            <User
              size={windowWidth <= 480 ? 12 : windowWidth <= 768 ? 14 : 16}
              color={colors.primary}
            />
          </MemberIcon>
          <div>
            <Text
              strong
              style={{
                fontSize: windowWidth <= 480 ? "13px" : "14px",
                display: "block",
              }}
            >
              {record.user_name || "Invitation Pending"}
            </Text>
            <Text
              type="secondary"
              style={{ fontSize: windowWidth <= 480 ? "11px" : "12px" }}
            >
              {record.invited_email}
            </Text>
          </div>
        </MemberNameCell>

        <Space size="small">
          <Tooltip
            title={isSelf ? "You cannot edit your own role" : "Edit Role"}
          >
            <ActionButtonSmall
              icon={<Edit size={windowWidth <= 480 ? 10 : 12} />}
              onClick={() => onEdit(record)}
              disabled={isSelf}
            />
          </Tooltip>
          <Tooltip title={isSelf ? "You cannot remove yourself" : "Remove"}>
            <Popconfirm
              title="Remove this team member?"
              description="This will revoke their access to your business dashboard."
              onConfirm={() => onRemove(record.id)}
              okText="Yes, Remove"
              cancelText="Cancel"
              disabled={isSelf}
            >
              <ActionButtonSmall
                className="danger"
                icon={<Trash2 size={windowWidth <= 480 ? 10 : 12} />}
                disabled={isSelf}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      </MobileCardHeader>

      <MobileCardContent>
        <MobileCardRow>
          <MobileCardLabel>Role</MobileCardLabel>
          <Tag
            style={{
              borderRadius: "6px",
              padding: windowWidth <= 480 ? "3px 6px" : "4px 8px",
              fontWeight: 600,
              fontSize: windowWidth <= 480 ? "10px" : "11px",
              lineHeight: 1,
              height: "auto",
              textTransform: "uppercase",
              border: "none",
              background: "#f0f9ff",
              color: "#0369a1",
            }}
          >
            {record.role_name}
          </Tag>
        </MobileCardRow>

        <MobileCardRow>
          <MobileCardLabel>Status</MobileCardLabel>
          <StatusTag
            style={{
              color: status.color,
              background: status.background,
            }}
          >
            {status.icon}
            {status.text}
          </StatusTag>
        </MobileCardRow>

        <MobileCardRow>
          <MobileCardLabel>Date Added</MobileCardLabel>
          <Text style={{ fontSize: windowWidth <= 480 ? "11px" : "12px" }}>
            {dayjs(record.created_at).format("MMM D, YYYY")}
          </Text>
        </MobileCardRow>
      </MobileCardContent>
    </MobileStaffCard>
  );
};

const TeamMembers = () => {
  const { user: currentUser } = useAuth();
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [form] = Form.useForm();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setWindowWidth(window.innerWidth);
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile(); // Initial check
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchStaffAndRoles = useCallback(async () => {
    setLoading(true);
    try {
      const [staffResult, rolesResult] = await Promise.all([
        businessStaffService.getStaff(),
        businessRoleService.getRoles(),
      ]);

      if (staffResult.success) setStaff(staffResult.data);
      else message.error(staffResult.error || "Failed to load team members.");

      if (rolesResult.success) setRoles(rolesResult.data);
      else message.error(rolesResult.error || "Failed to load roles.");
    } catch (error) {
      message.error("An unexpected error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffAndRoles();
  }, [fetchStaffAndRoles]);

  const showModal = (staffMember = null) => {
    setEditingStaff(staffMember);
    if (staffMember) {
      form.setFieldsValue({ role: staffMember.role });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const onModalClose = () => {
    setIsModalVisible(false);
    setEditingStaff(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values) => {
    message.loading({ content: "Saving...", key: "staffSave" });
    try {
      let result;
      if (editingStaff) {
        result = await businessStaffService.updateStaffRole(
          editingStaff.id,
          values.role
        );
      } else {
        result = await businessStaffService.inviteStaff({
          invited_email: values.email,
          role: values.role,
        });
      }

      if (result.success) {
        message.success({
          content: `Successfully ${
            editingStaff ? "updated" : "invited"
          } staff member.`,
          key: "staffSave",
        });
        onModalClose();
        fetchStaffAndRoles();
      } else {
        const errorMsg =
          result.error?.invited_email?.[0] ||
          result.error ||
          "An error occurred.";
        message.error({ content: errorMsg, key: "staffSave", duration: 4 });
      }
    } catch (error) {
      message.error({
        content: "A submission error occurred.",
        key: "staffSave",
      });
    }
  };

  const handleRemoveStaff = async (staffId) => {
    message.loading({ content: "Removing...", key: "staffRemove" });
    const result = await businessStaffService.removeStaff(staffId);
    if (result.success) {
      message.success({ content: "Staff member removed.", key: "staffRemove" });
      fetchStaffAndRoles();
    } else {
      message.error({
        content: result.error || "Failed to remove staff.",
        key: "staffRemove",
      });
    }
  };

  const columns = [
    {
      title: "Team Member",
      key: "member",
      render: (_, record) => (
        <MemberNameCell>
          <MemberIcon>
            <User size={16} color={colors.primary} />
          </MemberIcon>
          <Text strong style={{ fontSize: "14px" }}>
            {record.user_name || "Invitation Pending"}
          </Text>
        </MemberNameCell>
      ),
    },
    {
      title: "Email",
      dataIndex: "invited_email",
      key: "email",
      render: (email) => (
        <Text type="secondary" style={{ fontSize: "14px" }}>
          {email}
        </Text>
      ),
    },
    {
      title: "Role",
      dataIndex: "role_name",
      key: "role",
      render: (role) => (
        <Tag
          style={{
            borderRadius: "6px",
            padding: "6px 8px",
            fontWeight: 600,
            fontSize: "12px",
            lineHeight: 1,
            height: "auto",
            textTransform: "uppercase",
            border: "none",
            background: "#f0f9ff",
            color: "#0369a1",
          }}
        >
          {role}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusMap = {
          pending: {
            color: "#f59e0b",
            background: "#fef3c7",
            text: "Pending",
            icon: <Mail size={12} />,
          },
          accepted: {
            color: "#10b981",
            background: "#d1fae5",
            text: "Accepted",
            icon: <CheckCircle size={12} />,
          },
        };
        const { color, background, text, icon } = statusMap[status] || {
          color: "#64748b",
          background: "#f1f5f9",
          text: status,
          icon: null,
        };
        return (
          <StatusTag
            style={{
              color: color,
              background: background,
            }}
          >
            {icon}
            {text}
          </StatusTag>
        );
      },
    },
    {
      title: "Date Added",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => (
        <Text style={{ fontSize: "14px" }}>
          {dayjs(date).format("MMM D, YYYY")}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => {
        const isSelf = record.user_email === currentUser?.email;
        return (
          <Space size="small">
            <Tooltip
              title={isSelf ? "You cannot edit your own role" : "Edit Role"}
            >
              <span>
                <ActionButtonSmall
                  icon={<Edit size={14} />}
                  onClick={() => showModal(record)}
                  disabled={isSelf}
                />
              </span>
            </Tooltip>
            <Tooltip title={isSelf ? "You cannot remove yourself" : "Remove"}>
              <span>
                <Popconfirm
                  title="Remove this team member?"
                  description="This will revoke their access to your business dashboard."
                  onConfirm={() => handleRemoveStaff(record.id)}
                  okText="Yes, Remove"
                  cancelText="Cancel"
                  disabled={isSelf}
                >
                  <ActionButtonSmall
                    className="danger"
                    icon={<Trash2 size={14} />}
                    disabled={isSelf}
                  />
                </Popconfirm>
              </span>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const modalTitle = editingStaff
    ? "Edit Staff Member Role"
    : "Invite a New Staff Member";

  return (
    <TableSection initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {loading && (
        <LoaderContainer>
          <GlobalLoaderWithoutInlineStyles />
        </LoaderContainer>
      )}

      <TableHeader>
        <HeaderContent>
          <TableTitle>Team Members</TableTitle>
          <HeaderParagraph type="secondary">
            Invite and manage who has access to your business dashboard.
          </HeaderParagraph>
        </HeaderContent>
        <ActionButton
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => showModal()}
        >
          Invite Staff
        </ActionButton>
      </TableHeader>

      {/* Mobile View */}
      {isMobile ? (
        <div style={{ padding: "16px" }}>
          {staff.length === 0 ? (
            <Empty
              description="No team members yet. Invite your first staff member!"
              style={{ padding: "40px 20px" }}
            />
          ) : (
            staff.map((member) => (
              <MobileStaffItem
                key={member.id}
                record={member}
                onEdit={showModal}
                onRemove={handleRemoveStaff}
                currentUserEmail={currentUser?.email}
                windowWidth={windowWidth}
              />
            ))
          )}
        </div>
      ) : (
        /* Desktop View */
        <StyledTable
          columns={columns}
          dataSource={staff}
          rowKey="id"
          pagination={false}
          loading={false}
          locale={{
            emptyText: (
              <Empty description="No team members yet. Invite your first staff member!" />
            ),
          }}
        />
      )}

      {isMobile ? (
        <Drawer.Root
          open={isModalVisible}
          onOpenChange={(open) => !open && onModalClose()}
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />
              <DrawerHeader>
                <DrawerTitle>
                  {editingStaff
                    ? "Edit Staff Member Role"
                    : "Invite a New Staff Member"}
                </DrawerTitle>
              </DrawerHeader>
              <DrawerBody>
                <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
                  {!editingStaff && (
                    <Form.Item
                      name="email"
                      label="Email Address"
                      rules={[
                        { required: true, message: "Please enter an email" },
                        {
                          type: "email",
                          message: "Please enter a valid email",
                        },
                      ]}
                    >
                      <Input
                        prefix={<Mail size={16} color={colors.textSecondary} />}
                        placeholder="teammate@example.com"
                        size="large"
                      />
                    </Form.Item>
                  )}
                  <Form.Item
                    name="role"
                    label="Assign Role"
                    rules={[
                      { required: true, message: "Please assign a role" },
                    ]}
                  >
                    <Select
                      placeholder="Select a role"
                      loading={!roles.length}
                      size="large"
                    >
                      {roles.map((role) => (
                        <Option key={role.id} value={role.id}>
                          {role.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Form>
                {editingStaff && (
                  <Paragraph
                    type="secondary"
                    style={{ marginTop: 20, fontSize: "13px" }}
                  >
                    You can only change the role of an existing staff member. To
                    change their email, please remove and re-invite them.
                  </Paragraph>
                )}
              </DrawerBody>
              <DrawerFooter>
                <Button
                  type="primary"
                  onClick={() => form.submit()}
                  loading={loading}
                  block
                >
                  {editingStaff ? "Save Changes" : "Send Invitation"}
                </Button>
                <Button onClick={onModalClose} block>
                  Cancel
                </Button>
              </DrawerFooter>
            </StyledDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <Modal
          title={modalTitle}
          open={isModalVisible}
          onCancel={onModalClose}
          destroyOnClose
          width={520}
          footer={[
            <Button key="back" onClick={onModalClose}>
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={() => form.submit()}
              loading={loading}
            >
              {editingStaff ? "Save Changes" : "Send Invitation"}
            </Button>,
          ]}
        >
          <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
            {!editingStaff && (
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: "Please enter an email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input
                  prefix={<Mail size={16} color={colors.textSecondary} />}
                  placeholder="teammate@example.com"
                />
              </Form.Item>
            )}
            <Form.Item
              name="role"
              label="Assign Role"
              rules={[{ required: true, message: "Please assign a role" }]}
            >
              <Select placeholder="Select a role" loading={!roles.length}>
                {roles.map((role) => (
                  <Option key={role.id} value={role.id}>
                    {role.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
          {editingStaff && (
            <Paragraph
              type="secondary"
              style={{ marginTop: 20, fontSize: "14px" }}
            >
              You can only change the role of an existing staff member. To
              change their email, please remove and re-invite them.
            </Paragraph>
          )}
        </Modal>
      )}
    </TableSection>
  );
};

export default TeamMembers;
