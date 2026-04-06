"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import {
  Skeleton,
  Empty,
  Avatar,
  Space,
  Typography,
  Form,
  Input,
  Button,
  Modal,
  Select,
  Timeline,
  Alert,
  Tooltip,
  ConfigProvider,
  Tag,
  Grid,
  Collapse,
  Tabs,
} from "antd";
import message from "@/lib/message";
import {
  Hash,
  User,
  MessageSquare,
  Send,
  CheckCircle,
  Edit,
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

function conversationWithDaySeparators(messages) {
  if (!messages?.length) return [];
  const out = [];
  let lastDay = null;
  for (const msg of messages) {
    const d = dayjs(msg.timestamp).format("YYYY-MM-DD");
    if (d !== lastDay) {
      lastDay = d;
      out.push({
        __day: true,
        key: `day-${d}`,
        label: dayjs(msg.timestamp).format("dddd, MMM D, YYYY"),
      });
    }
    out.push({ __day: false, ...msg });
  }
  return out;
}

const DrawerTopBar = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 20px;
  border-bottom: 1px solid ${colors.border};
  flex-shrink: 0;
  background: #fff;

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const DrawerTitleArea = styled.div`
  flex: 1;
  min-width: 0;
`;

const DrawerScrollBody = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: ${colors.lightBg};
`;

const TwoColumnLayout = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const ConversationColumn = styled.div`
  flex: 3;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${colors.border};
  background: ${colors.lightBg};
`;

const SidebarColumn = styled.div`
  flex: 2;
  min-width: 240px;
  max-width: 380px;
  overflow-y: auto;
  background: #fff;
  padding: 12px 14px 20px;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 16px 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
`;

const DaySeparator = styled.div`
  align-self: center;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  padding: 6px 14px;
  background: #e2e8f0;
  border-radius: 20px;
  color: ${colors.textSecondary};
  margin: 8px 0;
`;

const MessageWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 88%;
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

const FooterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
  width: 100%;
`;

const InfoCard = styled.div`
  background: ${colors.lightBg};
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 10px;
`;

const InfoCardTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${colors.textSecondary};
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
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
  padding: 10px 12px;
  background: #fff;
  border-radius: 8px;
  font-size: 13px;
  color: ${colors.textPrimary};
  line-height: 1.6;
  margin-top: 8px;
  border: 1px solid ${colors.border};
`;

const formatDateTime = (dateString) =>
  dateString ? dayjs(dateString).format("MMM D, YYYY h:mm A") : "N/A";

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

const TicketDetailDrawer = ({ ticketId, open, onClose, onUpdate }) => {
  const [ticket, setTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [replyForm] = Form.useForm();
  const [assignableAgents, setAssignableAgents] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState("conversation");

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
      setMobileTab("conversation");
      fetchTicketDetails();
      fetchHistory();
    }
  }, [open, ticketId, fetchTicketDetails, fetchHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.conversation, mobileTab, open]);

  const handleAction = async (actionFn, payload, successMessage) => {
    if (!ticket) return false;
    setActionLoading(true);
    try {
      const response = await actionFn(ticket.ticket_id, payload);
      if (response.success) {
        message.success(successMessage);
        const updatedTicket = response.data;
        setTicket(updatedTicket);
        if (onUpdate) onUpdate(updatedTicket);
        fetchHistory();
        return true;
      }
      message.error(response.error || "Action failed");
      return false;
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

  const handlePriorityChange = async (value) => {
    if (!ticket || !value || value === ticket.priority) return;
    await handleAction(
      supportTicketService.setTicketPriority,
      { priority: value },
      "Priority updated"
    );
  };

  const openAssignModal = async () => {
    if (!ticket) return;
    setAssignModalOpen(true);
    setSelectedAgent(ticket.assigned_to);
    if (assignableAgents.length === 0) {
      setActionLoading(true);
      try {
        const res = await supportTicketService.getAssignableAgents();
        if (res.success) {
          const d = res.data;
          setAssignableAgents(Array.isArray(d) ? d : d?.results || []);
        }
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
            style={{
              backgroundColor: isUser ? colors.info : colors.success,
              color: "#fff",
              flexShrink: 0,
            }}
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

  const sidebarCollapseItems = ticket
    ? [
        {
          key: "ticket",
          label: (
            <Space size={6}>
              <Hash size={14} />
              <span>Ticket info</span>
            </Space>
          ),
          children: (
            <div>
              <InfoGrid style={{ marginBottom: 12 }}>
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
                  <InfoLabel>Updated</InfoLabel>
                  <InfoValue>{formatDateTime(ticket.updated_at)}</InfoValue>
                </InfoItem>
                {slaStatus && (
                  <InfoItem>
                    <InfoLabel>SLA</InfoLabel>
                    <InfoValue>
                      <Tag
                        color={slaStatus === "breached" ? "red" : slaStatus === "at_risk" ? "orange" : "green"}
                        icon={
                          slaStatus === "breached" ? (
                            <AlertTriangle size={11} style={{ marginRight: 4 }} />
                          ) : (
                            <Clock size={11} style={{ marginRight: 4 }} />
                          )
                        }
                      >
                        {slaStatus === "breached" ? "Breached" : slaStatus === "at_risk" ? "At risk" : "On track"}
                      </Tag>
                    </InfoValue>
                  </InfoItem>
                )}
              </InfoGrid>
              <InfoLabel style={{ marginBottom: 4 }}>Subject</InfoLabel>
              <InfoValue style={{ fontWeight: 600 }}>{ticket.subject}</InfoValue>
              <InfoLabel style={{ marginTop: 12, marginBottom: 4 }}>Description</InfoLabel>
              <DescriptionBox>{ticket.description}</DescriptionBox>
            </div>
          ),
        },
        {
          key: "user",
          label: (
            <Space size={6}>
              <Briefcase size={14} />
              <span>User context</span>
            </Space>
          ),
          children: ticket.user_context ? (
            <InfoGrid>
              <InfoItem>
                <InfoLabel>Member since</InfoLabel>
                <InfoValue>{ticket.user_context.member_since}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Total bookings</InfoLabel>
                <InfoValue>{ticket.user_context.total_bookings}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Account</InfoLabel>
                <InfoValue>
                  {ticket.user_context.is_business_owner ? (
                    <Tag color="success">Business owner</Tag>
                  ) : (
                    <Tag>Standard user</Tag>
                  )}
                </InfoValue>
              </InfoItem>
            </InfoGrid>
          ) : (
            <Text type="secondary">No extended context</Text>
          ),
        },
        {
          key: "assign",
          label: (
            <Space size={6}>
              <UserCheck size={14} />
              <span>Assignment</span>
            </Space>
          ),
          children: (
            <div>
              <InfoLabel>Current agent</InfoLabel>
              <InfoValue style={{ marginTop: 4 }}>
                {ticket.assigned_to_details ? (
                  <Space>
                    <Avatar size="small" src={ticket.assigned_to_details?.avatar_thumb_url}>
                      {ticket.assigned_to_details.full_name?.[0]}
                    </Avatar>
                    {ticket.assigned_to_details.full_name}
                  </Space>
                ) : (
                  <Text type="secondary">Unassigned</Text>
                )}
              </InfoValue>
              <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
                Use <strong>Assign</strong> in the footer to change assignment.
              </Paragraph>
            </div>
          ),
        },
        {
          key: "actions",
          label: (
            <Space size={6}>
              <Edit size={14} />
              <span>Priority</span>
            </Space>
          ),
          children: (
            <div>
              <InfoLabel style={{ marginBottom: 6 }}>Change priority</InfoLabel>
              <Select
                value={ticket.priority}
                style={{ width: "100%", maxWidth: 280 }}
                onChange={handlePriorityChange}
                disabled={actionLoading || ticket.status === "closed"}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "urgent", label: "Urgent" },
                ]}
              />
            </div>
          ),
        },
        {
          key: "history",
          label: (
            <Space size={6}>
              <Activity size={14} />
              <span>History</span>
            </Space>
          ),
          children: historyLoading ? (
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
                        {log.user_email} · {formatDateTime(log.timestamp)}
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
          ),
        },
      ]
    : [];

  const conversationStream = (
    <ChatMessages>
      {ticket?.conversation?.length ? (
        conversationWithDaySeparators(ticket.conversation).map((item) =>
          item.__day ? (
            <DaySeparator key={item.key}>{item.label}</DaySeparator>
          ) : (
            renderChatMessage(item)
          )
        )
      ) : (
        <Empty description="No messages yet" style={{ marginTop: 48 }} />
      )}
      <div ref={messagesEndRef} />
    </ChatMessages>
  );

  const sidebarContent = (
    <Collapse bordered={false} defaultActiveKey={["ticket", "user", "assign", "actions"]} items={sidebarCollapseItems} />
  );

  const mobileSummaryCard =
    ticket && !loading ? (
      <div
        style={{
          padding: "12px 16px",
          background: "#fff",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <Text strong style={{ display: "block", fontSize: 14, lineHeight: 1.35 }}>
          {ticket.subject}
        </Text>
        <Space size={6} wrap style={{ marginTop: 8 }}>
            <Tag color={statusTagColor[ticket.status] || "default"}>{ticket.status_display}</Tag>
            <Tag color={priorityTagColor[ticket.priority] || "default"}>{ticket.priority_display}</Tag>
            {slaStatus && slaStatus !== "ok" && (
              <Tag color={slaStatus === "breached" ? "red" : "orange"} icon={<AlertTriangle size={11} style={{ marginRight: 3 }} />}>
                SLA
              </Tag>
            )}
        </Space>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
          {ticket.user_details?.full_name} · {ticket.user_details?.email}
        </Text>
      </div>
    ) : null;

  const drawerBody = (
    <DrawerScrollBody>
      {loading ? (
        <div style={{ padding: 24 }}>
          <Skeleton active avatar paragraph={{ rows: 12 }} />
        </div>
      ) : !ticket ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <Empty description="Ticket not found" />
        </div>
      ) : isMobile ? (
        <>
          {mobileSummaryCard}
          <Tabs
            activeKey={mobileTab}
            onChange={setMobileTab}
            style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
            tabBarStyle={{ margin: 0, padding: "0 12px", background: "#fff" }}
            items={[
              {
                key: "conversation",
                label: (
                  <Space size={6}>
                    <MessageSquare size={14} />
                    Thread
                  </Space>
                ),
                children: (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 280 }}>
                    {conversationStream}
                  </div>
                ),
              },
              {
                key: "details",
                label: (
                  <Space size={6}>
                    <User size={14} />
                    Details
                  </Space>
                ),
                children: <div style={{ padding: 12, overflowY: "auto", maxHeight: "55vh" }}>{sidebarContent}</div>,
              },
            ]}
          />
        </>
      ) : (
        <TwoColumnLayout>
          <ConversationColumn>{conversationStream}</ConversationColumn>
          <SidebarColumn>{sidebarContent}</SidebarColumn>
        </TwoColumnLayout>
      )}
    </DrawerScrollBody>
  );

  const drawerFooter =
    ticket && !loading && ticket.status !== "closed" ? (
      <FooterBar>
        {ticket.status === "resolved" && (
          <Alert
            message="Replying will re-open this ticket."
            type="warning"
            showIcon
            style={{ flex: "1 1 100%", margin: 0, borderRadius: 8 }}
          />
        )}
        <Form
          form={replyForm}
          onFinish={handleReply}
          style={{
            flex: "1 1 240px",
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            margin: 0,
            minWidth: 0,
          }}
        >
          <Form.Item name="message" style={{ flex: 1, margin: 0, minWidth: 0 }} rules={[{ required: true, message: "Enter a message" }]}>
            <Input.TextArea
              autoSize={{ minRows: 1, maxRows: 4 }}
              placeholder="Reply to customer…"
              disabled={actionLoading}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          <Form.Item style={{ margin: 0 }}>
            <Button type="primary" htmlType="submit" icon={<Send size={14} />} loading={actionLoading} style={{ borderRadius: 8 }}>
              Send
            </Button>
          </Form.Item>
        </Form>
        <Space wrap>
          <Button icon={<Edit size={14} />} onClick={openAssignModal} style={{ borderRadius: 8 }}>
            Assign
          </Button>
          <Button
            type="primary"
            icon={<CheckCircle size={14} />}
            onClick={() => setResolveModalOpen(true)}
            disabled={ticket.status === "resolved" || ticket.status === "closed"}
            style={{ borderRadius: 8 }}
          >
            Resolve
          </Button>
        </Space>
      </FooterBar>
    ) : ticket && !loading && ticket.status === "closed" ? (
      <FooterBar>
        <Alert message="This ticket is closed (read-only)." type="info" showIcon style={{ flex: 1, margin: 0, borderRadius: 8 }} />
      </FooterBar>
    ) : null;

  const topBar =
    ticket && !loading ? (
      <DrawerTopBar>
        <Avatar
          src={ticket.user_details?.avatar_thumb_url}
          size={40}
          style={{ backgroundColor: colors.primary, color: "#fff", flexShrink: 0 }}
        >
          {ticket.user_details?.full_name?.[0]}
        </Avatar>
        <DrawerTitleArea>
          <Title level={5} style={{ margin: 0, fontSize: 15, lineHeight: 1.35, fontWeight: 700 }}>
            {ticket.subject}
          </Title>
          <Space size={6} wrap style={{ marginTop: 8 }}>
            <Tag color={statusTagColor[ticket.status]}>{ticket.status_display}</Tag>
            <Tag color={priorityTagColor[ticket.priority]}>{ticket.priority_display}</Tag>
            {slaStatus && slaStatus !== "ok" && (
              <Tag
                color={slaStatus === "breached" ? "red" : "orange"}
                icon={<AlertTriangle size={11} style={{ marginRight: 3 }} />}
              >
                {slaStatus === "breached" ? "SLA breached" : "SLA at risk"}
              </Tag>
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
            {ticket.user_details?.full_name} · {ticket.user_details?.email} · #{ticket.user_facing_id || ticket.ticket_id}
          </Text>
        </DrawerTitleArea>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: colors.textSecondary,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </DrawerTopBar>
    ) : (
      <DrawerTopBar>
        <div style={{ fontWeight: 700, fontSize: 15, color: colors.textPrimary }}>Ticket details</div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: colors.textSecondary,
            marginLeft: "auto",
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </DrawerTopBar>
    );

  return (
    <ConfigProvider theme={theme}>
      <AdminResponsiveDrawer
        open={open}
        onClose={onClose}
        title="Support ticket"
        titleIcon={<MessageSquare size={16} color={colors.primary} />}
        isMobile={isMobile}
        width="min(960px, 96vw)"
        hideHeader
        footer={drawerFooter}
      >
        {topBar}
        {drawerBody}
      </AdminResponsiveDrawer>

      <Modal
        title="Assign ticket"
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
          filterOption={(input, option) =>
            (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
          }
          options={assignableAgents.map((agent) => ({
            value: agent.userId,
            label: agent.full_name || agent.email,
          }))}
        />
      </Modal>

      <Modal
        title="Resolve ticket"
        open={resolveModalOpen}
        onCancel={() => setResolveModalOpen(false)}
        footer={null}
        destroyOnClose
        width={420}
      >
        <Form onFinish={handleResolve} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="resolution_notes"
            label="Resolution notes"
            rules={[{ required: true, message: "Resolution notes are required." }]}
          >
            <Input.TextArea rows={4} placeholder="Describe how the issue was resolved." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={actionLoading} style={{ borderRadius: 8 }}>
              Confirm resolution
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default TicketDetailDrawer;
