"use client"

import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import { Drawer, Skeleton, Empty, Avatar, Space, Typography, Badge, Divider, Tabs, Form, Input, Button, Modal, Select, Timeline, Alert, Tooltip, ConfigProvider, Tag, Grid,  } from 'antd';
import message from '@/lib/message';
import {
  Hash,
  User,
  MessageSquare,
  Send,
  CheckCircle,
  Edit,
  Bot,
  Calendar,
  UserCheck,
  ShieldQuestion,
  Briefcase,
  Activity,
} from "lucide-react";
import { supportTicketService } from "@/services/adminDash";
import { theme } from "@/components/theme";

const { Text, Title, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { useBreakpoint } = Grid;

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
  userMessageBg: hexToRgba("#3b82f6", 0.1),
  agentMessageBg: hexToRgba("#10b981", 0.1),
  systemMessageBg: "#f1f5f9",
};

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// --- STYLED COMPONENTS (FROM BOOKINGSLIST) ---
const DetailDrawer = styled(Drawer)`
  .ant-drawer-header {
    background: white;
    border-bottom: 1px solid ${colors.border};
    padding: 20px 24px;
  }
  .ant-drawer-title {
    font-weight: 700;
    font-size: 18px;
    color: #222;
    display: flex;
    align-items: center;
    gap: 12px;
    svg {
      color: ${colors.primary};
    }
  }
  .ant-drawer-body {
    padding: 0;
    background-color: ${colors.lightBg};
  }
`;

const DrawerHeader = styled.div`
  background-color: white;
  padding: 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: center;
  gap: 16px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const UserAvatar = styled(Avatar)`
  width: 60px;
  height: 60px;
  font-size: 28px;
  background: ${colors.primary};
  color: white;
`;

const InfoGroup = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  margin-bottom: 20px;
  @media (max-width: 768px) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    padding: 16px;
    margin-bottom: 12px;
  }
`;

const InfoGroupTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  svg {
    width: 18px;
    height: 18px;
    color: ${colors.primary};
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;
const InfoIcon = styled.div`
  color: ${colors.textSecondary};
  margin-top: 2px;
  svg {
    width: 16px;
    height: 16px;
  }
`;
const InfoContent = styled.div``;

const InfoLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  margin-bottom: 2px;
`;

const InfoValue = styled(Paragraph)`
  &.ant-typography {
    font-weight: 500;
    color: ${colors.textPrimary};
    margin-bottom: 0 !important;
  }
`;

const ConversationContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const MessageWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 85%;
  align-self: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
  flex-direction: ${(props) => (props.$isUser ? "row-reverse" : "row")};
`;

const MessageBubble = styled.div`
  padding: 10px 16px;
  border-radius: 18px;
  background: ${(props) =>
    props.$isUser ? colors.userMessageBg : colors.agentMessageBg};
  border-bottom-left-radius: ${(props) => !props.$isUser && "4px"};
  border-bottom-right-radius: ${(props) => props.$isUser && "4px"};
  p {
    margin: 0;
    line-height: 1.6;
    white-space: pre-wrap;
    color: ${colors.textPrimary};
  }
`;
const MessageSender = styled.div`
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 6px;
  color: ${(props) => (props.$isUser ? colors.info : colors.success)};
`;
const MessageMeta = styled.div`
  font-size: 11px;
  margin-top: 8px;
  color: ${colors.textSecondary};
  text-align: ${(props) => (props.$isUser ? "right" : "left")};
`;
const SystemMessage = styled.div`
  align-self: center;
  text-align: center;
  font-size: 12px;
  padding: 4px 12px;
  background: ${colors.systemMessageBg};
  border-radius: 12px;
  color: ${colors.textSecondary};
  margin: 8px 0;
`;
const ReplyFormWrapper = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${colors.border};
  background: white;
`;
const ReplyForm = styled(Form)`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;
const TabPaneContent = styled.div`
  padding: 24px;
  overflow-y: auto;
  height: 100%;
  @media (max-width: 768px) {
    padding: 0;
  }
`;
const TimelineText = styled(Text)`
  display: block;
`;
const TimelineDetails = styled(Text)`
  display: block;
  font-size: 12px;
  color: ${colors.textSecondary};
`;

// --- HELPER FUNCTIONS ---
const formatDateTime = (dateString) =>
  dateString
    ? new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "N/A";

// --- DRAWER COMPONENT ---
const TicketDetailDrawer = ({ ticketId, open, onClose, onUpdate }) => {
  const [ticket, setTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [replyForm] = Form.useForm();
  const [assignableAgents, setAssignableAgents] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [isResolveModalVisible, setIsResolveModalVisible] = useState(false);
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
    } catch (error) {
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
    } catch (error) {
      message.error("Error fetching history.");
    } finally {
      setHistoryLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (open && ticketId) {
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
    } catch (error) {
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
    const payload = { agent_id: selectedAgent };
    const success = await handleAction(
      supportTicketService.assignTicket,
      payload,
      "Ticket assigned"
    );
    if (success) setIsAssignModalVisible(false);
  };

  const handleResolve = async (values) => {
    const success = await handleAction(
      supportTicketService.resolveTicket,
      values,
      "Ticket resolved"
    );
    if (success) setIsResolveModalVisible(false);
  };

  const openAssignModal = async () => {
    if (!ticket) return;
    setIsAssignModalVisible(true);
    setSelectedAgent(ticket.assigned_to);
    if (assignableAgents.length === 0) {
      setActionLoading(true);
      try {
        const res = await supportTicketService.getAssignableAgents();
        if (res.success) setAssignableAgents(res.data);
      } catch (e) {
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
      (isUser ? ticket.user_details?.full_name || "Customer" : "Support Agent");

    const senderIcon = (
      <Tooltip title={senderName}>
        <Avatar
          src={senderDetails?.avatar_thumb_url}
          size={36}
          style={{
            backgroundColor: isUser ? colors.info : colors.success,
            color: "white",
          }}
        >
          {senderName ? senderName[0] : "A"}
        </Avatar>
      </Tooltip>
    );

    return (
      <MessageWrapper key={msg.id} $isUser={isUser}>
        {senderIcon}
        <div style={{ width: "100%" }}>
          <MessageSender $isUser={isUser}>{senderName}</MessageSender>
          <MessageBubble $isUser={isUser}>
            <p>{msg.text}</p>
          </MessageBubble>
          <MessageMeta $isUser={isUser}>
            {formatDateTime(msg.timestamp)}
          </MessageMeta>
        </div>
      </MessageWrapper>
    );
  };

  const renderContent = () => {
    if (loading)
      return (
        <div style={{ padding: 24 }}>
          <Skeleton active avatar paragraph={{ rows: 15 }} />
        </div>
      );
    if (!ticket)
      return (
        <div style={{ padding: 24, textAlign: "center", marginTop: 40 }}>
          <Empty description="Select a ticket to view details" />
        </div>
      );

    return (
      <>
        <DrawerHeader>
          <UserAvatar src={ticket.user_details?.avatar_thumb_url}>
            {ticket.user_details?.full_name[0]}
          </UserAvatar>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {ticket.user_details?.full_name}
            </Title>
            <Text type="secondary">{ticket.user_details?.email}</Text>
          </div>
        </DrawerHeader>
        <Tabs
          defaultActiveKey="1"
          centered
          style={{ background: "white", height: "calc(100% - 109px)" }}
        >
          <TabPane
            tab={
              <Space>
                <MessageSquare size={16} />
                Conversation
              </Space>
            }
            key="1"
            style={{ height: "100%" }}
          >
            <ConversationContainer>
              <ChatMessages>
                {ticket.conversation?.map(renderChatMessage)}
                <div ref={messagesEndRef} />
              </ChatMessages>
              <ReplyFormWrapper>
                {ticket.status === "closed" ? (
                  <Alert
                    message="This ticket is closed and read-only."
                    type="info"
                    showIcon
                  />
                ) : ticket.status === "resolved" ? (
                  <Alert
                    message="This ticket is resolved. Replying will re-open it."
                    type="warning"
                    showIcon
                  />
                ) : (
                  <ReplyForm form={replyForm} onFinish={handleReply}>
                    <Form.Item
                      name="message"
                      style={{ flex: 1 }}
                      rules={[{ required: true, message: " " }]}
                    >
                      <Input.TextArea
                        autoSize={{ minRows: 2, maxRows: 5 }}
                        placeholder="Type your reply..."
                        disabled={actionLoading}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<Send size={16} />}
                        loading={actionLoading}
                        key={`btn-${actionLoading}`}>
                        Send
                      </Button>
                    </Form.Item>
                  </ReplyForm>
                )}
              </ReplyFormWrapper>
            </ConversationContainer>
          </TabPane>
          <TabPane
            tab={
              <Space>
                <User size={16} />
                Details
              </Space>
            }
            key="2"
          >
            <TabPaneContent>
              {ticket.user_context && (
                <InfoGroup>
                  <InfoGroupTitle>
                    <Briefcase /> User Context
                  </InfoGroupTitle>
                  <InfoGrid>
                    <InfoItem>
                      <InfoIcon>
                        <Calendar />
                      </InfoIcon>
                      <InfoContent>
                        <InfoLabel>Member Since</InfoLabel>
                        <InfoValue>
                          {ticket.user_context.member_since}
                        </InfoValue>
                      </InfoContent>
                    </InfoItem>
                    <InfoItem>
                      <InfoIcon>
                        <Hash />
                      </InfoIcon>
                      <InfoContent>
                        <InfoLabel>Total Bookings</InfoLabel>
                        <InfoValue>
                          {ticket.user_context.total_bookings}
                        </InfoValue>
                      </InfoContent>
                    </InfoItem>
                    <InfoItem>
                      <InfoIcon>
                        <User />
                      </InfoIcon>
                      <InfoContent>
                        <InfoLabel>Account Type</InfoLabel>
                        <InfoValue>
                          {ticket.user_context.is_business_owner ? (
                            <Tag color="success">Business Owner</Tag>
                          ) : (
                            <Tag>Standard User</Tag>
                          )}
                        </InfoValue>
                      </InfoContent>
                    </InfoItem>
                  </InfoGrid>
                </InfoGroup>
              )}
              <InfoGroup>
                <InfoGroupTitle>
                  <Hash />
                  Ticket Details
                </InfoGroupTitle>
                <InfoGrid>
                  <InfoItem>
                    <InfoIcon>
                      <MessageSquare />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Subject</InfoLabel>
                      <InfoValue>{ticket.subject}</InfoValue>
                    </InfoContent>
                  </InfoItem>
                  <InfoItem>
                    <InfoIcon>
                      <Activity />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Status</InfoLabel>
                      <InfoValue>
                        <Badge
                          status={
                            {
                              open: "warning",
                              in_progress: "processing",
                              resolved: "success",
                              closed: "default",
                            }[ticket.status]
                          }
                          text={ticket.status_display}
                        />
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>
                  <InfoItem>
                    <InfoIcon>
                      <Briefcase />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Category</InfoLabel>
                      <InfoValue>{ticket.category_display}</InfoValue>
                    </InfoContent>
                  </InfoItem>
                  <InfoItem>
                    <InfoIcon>
                      <ShieldQuestion />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Priority</InfoLabel>
                      <InfoValue>{ticket.priority_display}</InfoValue>
                    </InfoContent>
                  </InfoItem>
                  <InfoItem>
                    <InfoIcon>
                      <Calendar />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Created</InfoLabel>
                      <InfoValue>{formatDateTime(ticket.created_at)}</InfoValue>
                    </InfoContent>
                  </InfoItem>
                  <InfoItem>
                    <InfoIcon>
                      <Calendar />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Last Updated</InfoLabel>
                      <InfoValue>{formatDateTime(ticket.updated_at)}</InfoValue>
                    </InfoContent>
                  </InfoItem>
                </InfoGrid>
                <Divider />
                <InfoLabel>Description</InfoLabel>
                <InfoValue
                  style={{
                    whiteSpace: "pre-wrap",
                    padding: 12,
                    background: colors.lightBg,
                    borderRadius: 8,
                  }}
                >
                  {ticket.description}
                </InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoGroupTitle>
                  <UserCheck />
                  Assignment & Actions
                </InfoGroupTitle>
                <InfoItem>
                  <InfoIcon>
                    <User />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Assigned Agent</InfoLabel>
                    {ticket.assigned_to_details ? (
                      <InfoValue>
                        <Space>
                          <Avatar
                            size="small"
                            src={ticket.assigned_to_details?.avatar_thumb_url}
                          >
                            {ticket.assigned_to_details.full_name[0]}
                          </Avatar>{" "}
                          {ticket.assigned_to_details.full_name}
                        </Space>
                      </InfoValue>
                    ) : (
                      <InfoValue type="secondary">Unassigned</InfoValue>
                    )}
                  </InfoContent>
                </InfoItem>
                <Space wrap style={{ marginTop: 16 }}>
                  <Button icon={<Edit size={16} />} onClick={openAssignModal}>
                    Assign / Re-assign
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckCircle size={16} />}
                    onClick={() => setIsResolveModalVisible(true)}
                    disabled={
                      ticket.status === "resolved" || ticket.status === "closed"
                    }
                  >
                    Resolve Ticket
                  </Button>
                </Space>
              </InfoGroup>
            </TabPaneContent>
          </TabPane>
          <TabPane
            tab={
              <Space>
                <Activity size={16} />
                History
              </Space>
            }
            key="3"
          >
            <TabPaneContent>
              <InfoGroup>
                <InfoGroupTitle>
                  <Activity />
                  Ticket History
                </InfoGroupTitle>
                {historyLoading ? (
                  <Skeleton active />
                ) : (
                  <Timeline>
                    {history.map((log) => (
                      <Timeline.Item key={log.id}>
                        <TimelineText strong>{log.details}</TimelineText>
                        <TimelineDetails>
                          by {log.user_email} at {formatDateTime(log.timestamp)}
                        </TimelineDetails>
                      </Timeline.Item>
                    ))}
                    <Timeline.Item
                      color="gray"
                      dot={<ShieldQuestion size={14} />}
                    >
                      <TimelineText>
                        Ticket created by {ticket.user_details?.full_name}
                      </TimelineText>
                      <TimelineDetails>
                        {formatDateTime(ticket.created_at)}
                      </TimelineDetails>
                    </Timeline.Item>
                  </Timeline>
                )}
              </InfoGroup>
            </TabPaneContent>
          </TabPane>
        </Tabs>
      </>
    );
  };

  return (
    <ConfigProvider theme={theme}>
      <DetailDrawer
        open={open}
        onClose={onClose}
        width={isMobile ? "100%" : 720}
        title={
          <>
            <Hash size={20} />
            Ticket: {ticket?.user_facing_id || ticket?.ticket_id}
          </>
        }
        destroyOnClose
      >
        {renderContent()}
      </DetailDrawer>
      <Modal
        title="Assign Ticket"
        open={isAssignModalVisible}
        onCancel={() => setIsAssignModalVisible(false)}
        confirmLoading={actionLoading}
        onOk={handleAssign}
        okText="Assign"
      >
        <Select
          loading={actionLoading && assignableAgents.length === 0}
          showSearch
          placeholder="Select an agent"
          style={{ width: "100%", marginTop: 24 }}
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
          filterOption={(input, option) =>
            (option?.label.props.children[1] ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />
      </Modal>
      <Modal
        title="Resolve Ticket"
        open={isResolveModalVisible}
        onCancel={() => setIsResolveModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          onFinish={handleResolve}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="resolution_notes"
            label="Resolution Notes"
            rules={[
              { required: true, message: "Resolution notes are required." },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Describe how the issue was resolved."
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={actionLoading}
              key={`btn-${actionLoading}`}>
              Confirm Resolution
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default TicketDetailDrawer;
