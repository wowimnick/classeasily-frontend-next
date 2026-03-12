"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import { Skeleton, Empty, Avatar, Space, Typography, Badge, Tabs, Form, Input, Button, Modal, Select, Timeline, Alert, Tooltip, ConfigProvider, Tag, Grid } from "antd";
import message from "@/lib/message";
import {
  Hash,
  User,
  MessageSquare,
  Send,
  CheckCircle,
  Edit,
  Calendar,
  UserCheck,
  ShieldQuestion,
  Briefcase,
  Activity,
  AlertTriangle,
  Clock,
  X,
} from "lucide-react";
import { supportTicketService } from "@/services/adminDash";
import { theme } from "@/components/theme";
import dayjs from "dayjs";
import AdminResponsiveDrawer from "../shared/AdminResponsiveDrawer";

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

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

const SLA_HOURS = 24;

function getSLAStatus(ticket) {
  if (!ticket || ticket.status === "resolved" || ticket.status === "closed") return null;
  const created = dayjs(ticket.created_at);
  const hoursOpen = dayjs().diff(created, "hour");
  if (hoursOpen >= SLA_HOURS) return "breached";
  if (hoursOpen >= SLA_HOURS * 0.75) return "at_risk";
  return "ok";
}

// --- Drawer inner layout ---
const DrawerTopBar = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid ${colors.border};
  flex-shrink: 0;
  background: #fff;

  @media (max-width: 768px) {
    padding: 12px 16px;
    gap: 12px;
  }
`;

const DrawerTitleArea = styled.div`
  flex: 1;
  min-width: 0;
`;

const DrawerScrollBody = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: ${colors.lightBg};
`;

const DrawerTabs = styled(Tabs)`
  flex: 1;
  display: flex;
  flex-direction: column;

  .ant-tabs-nav {
    background: #fff;
    margin: 0;
    padding: 0 24px;
    border-bottom: 1px solid ${colors.border};
    flex-shrink: 0;

    @media (max-width: 768px) {
      padding: 0 16px;
    }
  }

  .ant-tabs-content-holder {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .ant-tabs-content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .ant-tabs-tabpane {
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
`;

// --- Conversation ---
const ConversationContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: ${colors.lightBg};
  min-height: 0;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const MessageWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 82%;
  align-self: ${(p) => (p.$isUser ? "flex-end" : "flex-start")};
  flex-direction: ${(p) => (p.$isUser ? "row-reverse" : "row")};
`;

const MessageBubble = styled.div`
  padding: 10px 14px;
  border-radius: 16px;
  background: ${(p) => (p.$isUser ? "rgba(59, 130, 246, 0.12)" : "#fff")};
  border: 1px solid ${(p) => (p.$isUser ? "transparent" : colors.border)};
  border-bottom-left-radius: ${(p) => !p.$isUser && "4px"};
  border-bottom-right-radius: ${(p) => p.$isUser && "4px"};

  p {
    margin: 0;
    line-height: 1.55;
    white-space: pre-wrap;
    color: ${colors.textPrimary};
    font-size: 13.5px;
  }
`;

const MessageSender = styled.div`
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 5px;
  color: ${(p) => (p.$isUser ? colors.info : colors.success)};
`;

const MessageMeta = styled.div`
  font-size: 11px;
  margin-top: 6px;
  color: ${colors.textSecondary};
  text-align: ${(p) => (p.$isUser ? "right" : "left")};
`;

const SystemMessage = styled.div`
  align-self: center;
  text-align: center;
  font-size: 11px;
  padding: 4px 12px;
  background: ${colors.border};
  border-radius: 12px;
  color: ${colors.textSecondary};
  margin: 4px 0;
`;

const ReplyFormWrapper = styled.div`
  padding: 14px 20px;
  border-top: 1px solid ${colors.border};
  background: #fff;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

// --- Details Tab ---
const TabScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const InfoCard = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  padding: 16px 20px;
  margin-bottom: 16px;
`;

const InfoCardTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${colors.textSecondary};
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const InfoLabel = styled.div`
  font-size: 11px;
  color: ${colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
`;

const InfoValue = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${colors.textPrimary};
`;

const DescriptionBox = styled.div`
  white-space: pre-wrap;
  padding: 12px;
  background: ${colors.lightBg};
  border-radius: 8px;
  font-size: 13px;
  color: ${colors.textPrimary};
  line-height: 1.6;
  margin-top: 10px;
`;

// ---
const formatDateTime = (dateString) =>
  dateString
    ? dayjs(dateString).format("MMM D, YYYY h:mm A")
    : "N/A";

const statusTagColor = {
  open: "orange",
  in_progress: "blue",
  resolved: "green",
  closed: "default",
};

const priorityTagColor = {
  low: "default",
  medium: "orange",
  high: "red",
  urgent: "red",
};

// --- COMPONENT ---
const TicketDetailDrawer = ({ ticketId, open, onClose, onUpdate }) => {
  const [ticket, setTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [replyForm] = Form.useForm();
  const [assignableAgents, setAssignableAgents] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("conversation");

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const messagesEndRef = useRef(null);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchTicketDetails = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    setTicket(null);
    try {
      const response = await supportTicketService.getTicketDetails(ticketId);
      if (response.success) setTicket(response.data);
      else message.error(response.error || "Failed to load ticket details");
    } catch {
      message.error("Error fetching details");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const fetchHistory = useCallback(async () => {
    if (!ticketId) return;
    setHistoryLoading(true);
    try {
      const response = await supportTicketService.getTicketHistory(ticketId);
      if (response.success) setHistory(response.data);
      else message.error("Failed to load ticket history.");
    } catch {
      message.error("Error fetching history.");
    } finally {
      setHistoryLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (open && ticketId) {
      setActiveTab("conversation");
      fetchTicketDetails();
      fetchHistory();
    }
  }, [open, ticketId, fetchTicketDetails, fetchHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.conversation]);

  const handleAction = async (action, payload, successMessage) => {
    if (!ticket) return false;
    setActionLoading(true);
    try {
      const response = await action(ticket.ticket_id, payload);
      if (response.success) {
        message.success(successMessage);
        const updatedTicket = response.data;
        setTicket(updatedTicket);
        if (onUpdate) onUpdate(updatedTicket);
        fetchHistory();
        return true;
      } else {
        message.error(response.error || "Action failed");
        return false;
      }
    } catch {
      message.error("An error occurred");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleReply = async ({ message: content }) => {
    const success = await handleAction(
      supportTicketService.replyToTicket,
      { message: content },
      "Reply sent"
    );
    if (success) replyForm.resetFields();
  };

  const handleAssign = async () => {
    if (!selectedAgent) {
      message.error("Please select an agent.");
      return;
    }
    const success = await handleAction(
      supportTicketService.assignTicket,
      { agent_id: selectedAgent },
      "Ticket assigned"
    );
    if (success) setAssignModalOpen(false);
  };

  const handleResolve = async (values) => {
    const success = await handleAction(
      supportTicketService.resolveTicket,
      values,
      "Ticket resolved"
    );
    if (success) setResolveModalOpen(false);
  };

  const openAssignModal = async () => {
    if (!ticket) return;
    setAssignModalOpen(true);
    setSelectedAgent(ticket.assigned_to);
    if (assignableAgents.length === 0) {
      setActionLoading(true);
      try {
        const res = await supportTicketService.getAssignableAgents();
        if (res.success) setAssignableAgents(res.data);
      } catch {
        message.error("Could not load agents list.");
      } finally {
        setActionLoading(false);
      }
    }
  };

  const renderChatMessage = (msg) => {
    if (msg.sender_type === "system") {
      return <SystemMessage key={msg.id}>{msg.text}</SystemMessage>;
    }
    const isUser = msg.sender_type === "user";
    const senderDetails = msg.sender_details;
    const senderName =
      senderDetails?.full_name ||
      (isUser ? ticket?.user_details?.full_name || "Customer" : "Support Agent");

    return (
      <MessageWrapper key={msg.id} $isUser={isUser}>
        <Tooltip title={senderName}>
          <Avatar
            src={senderDetails?.avatar_thumb_url}
            size={32}
            style={{ backgroundColor: isUser ? colors.info : colors.success, color: "#fff", flexShrink: 0 }}
          >
            {senderName ? senderName[0] : "A"}
          </Avatar>
        </Tooltip>
        <div style={{ flex: 1, minWidth: 0 }}>
          <MessageSender $isUser={isUser}>{senderName}</MessageSender>
          <MessageBubble $isUser={isUser}>
            <p>{msg.text}</p>
          </MessageBubble>
          <MessageMeta $isUser={isUser}>{formatDateTime(msg.timestamp)}</MessageMeta>
        </div>
      </MessageWrapper>
    );
  };

  const slaStatus = ticket ? getSLAStatus(ticket) : null;

  const drawerBody = (
    <DrawerScrollBody style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
      {loading ? (
        <div style={{ padding: 24 }}>
          <Skeleton active avatar paragraph={{ rows: 12 }} />
        </div>
      ) : !ticket ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <Empty description="Ticket not found" />
        </div>
      ) : (
        <DrawerTabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}
          items={[
            {
              key: "conversation",
              label: (
                <Space>
                  <MessageSquare size={14} />
                  Conversation
                </Space>
              ),
              children: (
                <ConversationContainer>
                  <ChatMessages>
                    {ticket.conversation?.map(renderChatMessage)}
                    <div ref={messagesEndRef} />
                  </ChatMessages>
                  <ReplyFormWrapper>
                    {ticket.status === "closed" ? (
                      <Alert message="This ticket is closed and read-only." type="info" showIcon style={{ borderRadius: 8 }} />
                    ) : ticket.status === "resolved" ? (
                      <Alert message="This ticket is resolved. Replying will re-open it." type="warning" showIcon style={{ borderRadius: 8 }} />
                    ) : (
                      <Form form={replyForm} onFinish={handleReply} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <Form.Item name="message" style={{ flex: 1, margin: 0 }} rules={[{ required: true, message: " " }]}>
                          <Input.TextArea
                            autoSize={{ minRows: 2, maxRows: 5 }}
                            placeholder="Type your reply..."
                            disabled={actionLoading}
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Item>
                        <Form.Item style={{ margin: 0 }}>
                          <Button
                            type="primary"
                            htmlType="submit"
                            icon={<Send size={14} />}
                            loading={actionLoading}
                            style={{ borderRadius: 8, height: 36 }}
                          >
                            Send
                          </Button>
                        </Form.Item>
                      </Form>
                    )}
                  </ReplyFormWrapper>
                </ConversationContainer>
              ),
            },
            {
              key: "details",
              label: (
                <Space>
                  <User size={14} />
                  Details
                </Space>
              ),
              children: (
                <TabScrollArea>
                  {ticket.user_context && (
                    <InfoCard>
                      <InfoCardTitle><Briefcase size={12} /> User Context</InfoCardTitle>
                      <InfoGrid>
                        <InfoItem>
                          <InfoLabel>Member Since</InfoLabel>
                          <InfoValue>{ticket.user_context.member_since}</InfoValue>
                        </InfoItem>
                        <InfoItem>
                          <InfoLabel>Total Bookings</InfoLabel>
                          <InfoValue>{ticket.user_context.total_bookings}</InfoValue>
                        </InfoItem>
                        <InfoItem>
                          <InfoLabel>Account Type</InfoLabel>
                          <InfoValue>
                            {ticket.user_context.is_business_owner ? (
                              <Tag color="success">Business Owner</Tag>
                            ) : (
                              <Tag>Standard User</Tag>
                            )}
                          </InfoValue>
                        </InfoItem>
                      </InfoGrid>
                    </InfoCard>
                  )}
                  <InfoCard>
                    <InfoCardTitle><Hash size={12} /> Ticket Details</InfoCardTitle>
                    <InfoGrid>
                      <InfoItem>
                        <InfoLabel>Status</InfoLabel>
                        <InfoValue>
                          <Tag color={statusTagColor[ticket.status] || "default"}>{ticket.status_display}</Tag>
                        </InfoValue>
                      </InfoItem>
                      <InfoItem>
                        <InfoLabel>Priority</InfoLabel>
                        <InfoValue>
                          <Tag color={priorityTagColor[ticket.priority] || "default"}>{ticket.priority_display}</Tag>
                        </InfoValue>
                      </InfoItem>
                      <InfoItem>
                        <InfoLabel>Category</InfoLabel>
                        <InfoValue>{ticket.category_display}</InfoValue>
                      </InfoItem>
                      <InfoItem>
                        <InfoLabel>Created</InfoLabel>
                        <InfoValue>{formatDateTime(ticket.created_at)}</InfoValue>
                      </InfoItem>
                      <InfoItem>
                        <InfoLabel>Last Updated</InfoLabel>
                        <InfoValue>{formatDateTime(ticket.updated_at)}</InfoValue>
                      </InfoItem>
                      {slaStatus && (
                        <InfoItem>
                          <InfoLabel>SLA Status</InfoLabel>
                          <InfoValue>
                            <Tag
                              color={slaStatus === "breached" ? "red" : slaStatus === "at_risk" ? "orange" : "green"}
                              icon={slaStatus === "breached" ? <AlertTriangle size={11} style={{ marginRight: 4 }} /> : <Clock size={11} style={{ marginRight: 4 }} />}
                            >
                              {slaStatus === "breached" ? "SLA Breached" : slaStatus === "at_risk" ? "At Risk" : "On Track"}
                            </Tag>
                          </InfoValue>
                        </InfoItem>
                      )}
                    </InfoGrid>
                    <div style={{ marginTop: 14 }}>
                      <InfoLabel style={{ marginBottom: 6 }}>Subject</InfoLabel>
                      <InfoValue style={{ fontSize: 14, fontWeight: 600 }}>{ticket.subject}</InfoValue>
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <InfoLabel style={{ marginBottom: 6 }}>Description</InfoLabel>
                      <DescriptionBox>{ticket.description}</DescriptionBox>
                    </div>
                  </InfoCard>
                  <InfoCard>
                    <InfoCardTitle><UserCheck size={12} /> Assignment &amp; Actions</InfoCardTitle>
                    <InfoItem style={{ marginBottom: 14 }}>
                      <InfoLabel>Assigned Agent</InfoLabel>
                      <InfoValue>
                        {ticket.assigned_to_details ? (
                          <Space>
                            <Avatar size="small" src={ticket.assigned_to_details?.avatar_thumb_url}>
                              {ticket.assigned_to_details.full_name?.[0]}
                            </Avatar>
                            {ticket.assigned_to_details.full_name}
                          </Space>
                        ) : (
                          <Text style={{ fontSize: 13, color: colors.textSecondary }}>Unassigned</Text>
                        )}
                      </InfoValue>
                    </InfoItem>
                    <Space wrap>
                      <Button icon={<Edit size={14} />} onClick={openAssignModal} style={{ borderRadius: 8 }}>
                        Assign / Re-assign
                      </Button>
                      <Button
                        type="primary"
                        icon={<CheckCircle size={14} />}
                        onClick={() => setResolveModalOpen(true)}
                        disabled={ticket.status === "resolved" || ticket.status === "closed"}
                        style={{ borderRadius: 8 }}
                      >
                        Resolve Ticket
                      </Button>
                    </Space>
                  </InfoCard>
                </TabScrollArea>
              ),
            },
            {
              key: "history",
              label: (
                <Space>
                  <Activity size={14} />
                  History
                </Space>
              ),
              children: (
                <TabScrollArea>
                  <InfoCard>
                    <InfoCardTitle><Activity size={12} /> Ticket History</InfoCardTitle>
                    {historyLoading ? (
                      <Skeleton active />
                    ) : (
                      <Timeline
                        items={[
                          ...history.map((log) => ({
                            key: log.id,
                            children: (
                              <>
                                <Text strong style={{ fontSize: 13 }}>{log.details}</Text>
                                <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                  by {log.user_email} at {formatDateTime(log.timestamp)}
                                </div>
                              </>
                            ),
                          })),
                          {
                            key: "created",
                            color: "gray",
                            dot: <ShieldQuestion size={14} />,
                            children: (
                              <>
                                <Text style={{ fontSize: 13 }}>Ticket created by {ticket.user_details?.full_name}</Text>
                                <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                  {formatDateTime(ticket.created_at)}
                                </div>
                              </>
                            ),
                          },
                        ]}
                      />
                    )}
                  </InfoCard>
                </TabScrollArea>
              ),
            },
          ]}
        />
      )}
    </DrawerScrollBody>
  );

  const topBar = ticket && (
    <DrawerTopBar>
      <Avatar
        src={ticket.user_details?.avatar_thumb_url}
        size={44}
        style={{ backgroundColor: colors.primary, color: "#fff", flexShrink: 0, fontSize: 20 }}
      >
        {ticket.user_details?.full_name?.[0]}
      </Avatar>
      <DrawerTitleArea>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: colors.textPrimary }}>
            {ticket.user_details?.full_name}
          </div>
          <Tag color={statusTagColor[ticket.status] || "default"} style={{ fontSize: 11 }}>
            {ticket.status_display}
          </Tag>
          <Tag color={priorityTagColor[ticket.priority] || "default"} style={{ fontSize: 11 }}>
            {ticket.priority_display}
          </Tag>
          {slaStatus && slaStatus !== "ok" && (
            <Tag
              color={slaStatus === "breached" ? "red" : "orange"}
              icon={<AlertTriangle size={11} style={{ marginRight: 3 }} />}
              style={{ fontSize: 11 }}
            >
              {slaStatus === "breached" ? "SLA Breached" : "SLA At Risk"}
            </Tag>
          )}
        </div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 3 }}>
          {ticket.user_details?.email} · #{ticket.user_facing_id || ticket.ticket_id}
        </div>
      </DrawerTitleArea>
      <button
        type="button"
        onClick={onClose}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: colors.textSecondary, borderRadius: 6, display: "flex", alignItems: "center" }}
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </DrawerTopBar>
  );

  const mainContent = (
    <>
      {topBar || (
        <DrawerTopBar>
          <div style={{ fontWeight: 700, fontSize: 15, color: colors.textPrimary }}>
            Ticket Details
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: colors.textSecondary, marginLeft: "auto" }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </DrawerTopBar>
      )}
      {drawerBody}
    </>
  );

  return (
    <ConfigProvider theme={theme}>
      <AdminResponsiveDrawer
        open={open}
        onClose={onClose}
        title="Ticket Details"
        titleIcon={<MessageSquare size={16} color={colors.primary} />}
        isMobile={isMobile}
        width="860px"
      >
        {mainContent}
      </AdminResponsiveDrawer>

      <Modal
        title="Assign Ticket"
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        confirmLoading={actionLoading}
        onOk={handleAssign}
        okText="Assign"
        width={420}
      >
        <Select
          loading={actionLoading && assignableAgents.length === 0}
          showSearch
          placeholder="Select an agent"
          style={{ width: "100%", marginTop: 16 }}
          value={selectedAgent}
          onChange={setSelectedAgent}
          options={assignableAgents.map((agent) => ({
            value: agent.userId,
            label: (
              <Space>
                <Avatar size="small" src={agent.avatar_thumb_url}>
                  {agent.full_name ? agent.full_name[0] : "U"}
                </Avatar>
                {agent.full_name || agent.email}
              </Space>
            ),
          }))}
        />
      </Modal>

      <Modal
        title="Resolve Ticket"
        open={resolveModalOpen}
        onCancel={() => setResolveModalOpen(false)}
        footer={null}
        destroyOnClose
        width={420}
      >
        <Form onFinish={handleResolve} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="resolution_notes"
            label="Resolution Notes"
            rules={[{ required: true, message: "Resolution notes are required." }]}
          >
            <Input.TextArea rows={4} placeholder="Describe how the issue was resolved." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={actionLoading} style={{ borderRadius: 8 }}>
              Confirm Resolution
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default TicketDetailDrawer;
