// app/my-tickets/[id]/page.jsx
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { useParams, useRouter } from "next/navigation";
import styled, { ThemeProvider } from "styled-components";
import {
  ArrowLeft,
  Ticket as TicketIcon,
  Clock,
  User,
  Send,
  Calendar,
  Tag as TagIcon,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Check,
} from "lucide-react";
import { Spin, Card, Input, Button, ConfigProvider, Avatar, Tag, Empty, Divider,  } from 'antd';
import message from '@/lib/message';
import { CustomerSupportTicketService } from "@/services/apiService";
import ExploreHeader from "@/components/explore/ExploreHeader";
import dynamic from "next/dynamic";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { theme as globalTheme } from "@/components/theme";
import { TicketDetailLoadingSkeleton } from "../_components/TicketsLoadingSkeleton";

// Dynamically import Footer to avoid Date() prerender issues
const Footer = dynamic(() => import("@/components/homepage/Footer"), {
  ssr: false,
});

// Keep all your styled components exactly as they are...
const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const PageContentContainer = styled.div`
  flex-grow: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 32px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    max-width: 900px;
    padding: 24px 20px;
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 1200px) {
    order: -1;
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.token.colorTextSecondary};
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 0;
  font-weight: 500;
  margin-bottom: 8px;

  &:hover {
    color: ${(props) => props.theme.token.colorPrimary};
  }
`;

const TicketHeader = styled.div`
  background: ${(props) => props.theme.token.colorBgContainer};
  border-radius: 12px;
  padding: 24px 0;
`;

const TicketTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: ${(props) => props.theme.token.colorText};
  margin: 0 0 16px;
  line-height: 1.3;
`;

const TicketMeta = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 14px;
  color: ${(props) => props.theme.token.colorTextSecondary};
  padding-top: 16px;
  border-top: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
`;

const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const TicketInfoCard = styled(Card)`
  border-radius: 12px;
  background-color: ${(props) => props.theme.token.colorBgContainer};
  border: 1px solid ${(props) => props.theme.token.colorBorder};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  .ant-card-head {
    border-bottom: 1px solid ${(props) => props.theme.token.colorBorder};
    padding: 16px 20px;
    min-height: auto;
  }

  .ant-card-head-title {
    font-size: 16px;
    font-weight: 600;
    color: ${(props) => props.theme.token.colorText};
  }

  .ant-card-body {
    padding: 20px;
  }
`;

const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid ${(props) => props.theme.token.colorBorderSecondary};

  &:last-child {
    border-bottom: none;
  }

  .label {
    color: ${(props) => props.theme.token.colorTextSecondary};
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }

  .value {
    font-size: 14px;
    color: ${(props) => props.theme.token.colorText};
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const StatusTag = styled(Tag)`
  font-weight: 600 !important;
  padding: 4px 12px !important;
  border: none !important;
  border-radius: 6px !important;
`;

const ConversationCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid ${(props) => props.theme.token.colorBorder};

  .ant-card-head {
    border-bottom: 1px solid ${(props) => props.theme.token.colorBorder};
    padding: 16px 24px;
    min-height: auto;
  }

  .ant-card-head-title {
    font-size: 18px;
    font-weight: 600;
    color: ${(props) => props.theme.token.colorText};
  }

  .ant-card-body {
    padding: 0 !important;
  }
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 65vh;
  max-height: 600px;
  overflow-y: auto;
  padding: 24px;
  background: ${(props) => props.theme.token.colorBgLayout};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.token.colorBorder};
    border-radius: 3px;

    &:hover {
      background: ${(props) => props.theme.token.colorTextSecondary};
    }
  }
`;

const MessageWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
`;

const MessageAvatar = styled(Avatar)`
  flex-shrink: 0;
  margin-top: 4px;
`;

const MessageBubble = styled.div`
  padding: 16px 40px;
  border-radius: 16px;
  max-width: 75%;
  position: relative;
  word-wrap: break-word;

  ${(props) =>
    props.$isUser
      ? `
        background-color: ${props.theme.token.colorPrimary}; 
        color: white; 
        border-bottom-right-radius: 6px; 
        order: 2;
        `
      : `
        background-color: rgba(0, 166, 153, 0.08); 
        color: #005249; 
        border: 1px solid rgba(0, 166, 153, 0.2); 
        border-bottom-left-radius: 6px;
        `}
`;

const MessageSender = styled.div`
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 8px;
  color: ${(props) => (props.$isUser ? "rgba(255,255,255,0.9)" : "#005249")};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MessageContent = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: inherit;
  white-space: pre-wrap;
`;

const MessageMeta = styled.div`
  margin-top: 8px;
  font-size: 11px;
  color: ${(props) => (props.$isUser ? "rgba(255,255,255,0.7)" : "#717171")};
  text-align: ${(props) => (props.$isUser ? "right" : "left")};
`;

const ReplyInputArea = styled.form`
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid ${(props) => props.theme.token.colorBorder};
  align-items: center;
  background: ${(props) => props.theme.token.colorBgContainer};
`;

const StyledInput = styled(Input.TextArea)`
  flex: 1;
  border-radius: 8px !important;
  border-color: ${(props) => props.theme.token.colorBorder} !important;

  &:focus,
  &:focus-within {
    border-color: ${(props) => props.theme.token.colorPrimary} !important;
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.15) !important;
  }
`;

const StyledSendButton = styled(Button)`
  height: 44px !important;
  width: 44px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px !important;
`;

const ResolutionNote = styled.div`
  background: rgba(0, 166, 153, 0.08);
  border: 1px solid rgba(0, 166, 153, 0.2);
  border-left: 4px solid ${(props) => props.theme.token.colorSuccess};
  border-radius: 8px;
  padding: 20px 24px;
  margin: 24px;

  h4 {
    color: #005249;
    margin: 0 0 8px;
    font-size: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }

  p {
    color: ${(props) => props.theme.token.colorTextSecondary};
    margin: 0;
    line-height: 1.6;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
`;

const NewMessagesSeparator = styled.div`
  width: 100%;
  text-align: center;
  margin: 16px 0;
  position: relative;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    width: calc(50% - 70px);
    height: 1px;
    background: ${(props) => props.theme.token.colorBorder};
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }

  span {
    color: ${(props) => props.theme.token.colorPrimary};
    font-weight: 600;
    font-size: 12px;
    padding: 4px 12px;
    background: ${(props) => props.theme.token.colorBgLayout};
    border-radius: 12px;
    border: 1px solid ${(props) => props.theme.token.colorBorder};
  }
`;

const AgentCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: ${(props) => props.theme.token.colorBgContainer};
  border: 1px solid ${(props) => props.theme.token.colorBorder};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 12px;

  .agent-info {
    flex: 1;

    .agent-name {
      font-size: 14px;
      font-weight: 600;
      color: ${(props) => props.theme.token.colorText};
      margin: 0 0 4px;
    }

    .agent-role {
      font-size: 12px;
      color: ${(props) => props.theme.token.colorTextSecondary};
      margin: 0;
    }
  }
`;

// Helper Functions
const formatDate = (dateString) =>
  new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

const formatTimeAgo = (dateString) => {
  const diff = new Date() - new Date(dateString);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const getCategoryDisplay = (category) =>
  ({
    account: "Account",
    booking: "Booking",
    payment: "Payment",
    technical: "Technical",
    feature: "Feature Request",
    other: "Other",
  }[category] || category);

const getTagColor = (type, value) => {
  if (type === "status")
    return (
      {
        open: "blue",
        in_progress: "warning",
        resolved: "success",
        closed: "default",
      }[value] || "default"
    );
  if (type === "priority")
    return (
      { low: "default", medium: "blue", high: "warning", urgent: "error" }[
        value
      ] || "blue"
    );
  return "default";
};

const getSenderInfo = (senderType, ticket) => {
  if (senderType === "user")
    return {
      name: "You",
      icon: (
        <Avatar
          src={ticket.user_details?.avatar_thumb_url}
          size={32}
          style={{ backgroundColor: globalTheme.token.colorPrimary }}
        >
          <User size={16} />
        </Avatar>
      ),
    };
  return {
    name: ticket.assigned_to_details?.full_name || "Support Agent",
    icon: (
      <Avatar
        src={ticket.assigned_to_details?.avatar_thumb_url}
        size={32}
        style={{ backgroundColor: globalTheme.token.colorSuccess }}
        icon={<HelpCircle size={16} />}
      />
    ),
  };
};

// Loading fallback component
function LoadingFallback() {
  return <TicketDetailLoadingSkeleton />;
}

// Main component wrapped in Suspense
function TicketDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReadTimestamp, setLastReadTimestamp] = useState(null);

  const chatContainerRef = useRef(null);

  const fetchTicketDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await CustomerSupportTicketService.getTicketById(id);
      if (response.success) {
        setTicket(response.data);
        setMessages(
          Array.isArray(response.data.conversation)
            ? response.data.conversation
            : []
        );
      } else {
        message.error("Failed to load ticket details.");
        router.push("/my-tickets");
      }
    } catch (error) {
      message.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    const storedTimestamp = sessionStorage.getItem(`lastReadTimestamp_${id}`);
    if (storedTimestamp) {
      setLastReadTimestamp(storedTimestamp);
    }
    fetchTicketDetails();
  }, [fetchTicketDetails, id]);

  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTop = scrollHeight;
    }

    const latestMessage = messages[messages.length - 1];
    if (latestMessage) {
      const handleUnmount = () => {
        sessionStorage.setItem(
          `lastReadTimestamp_${id}`,
          latestMessage.timestamp
        );
      };
      window.addEventListener("beforeunload", handleUnmount);

      return () => {
        handleUnmount();
        window.removeEventListener("beforeunload", handleUnmount);
      };
    }
  }, [messages, id]);

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !ticket) return;
    setIsSubmitting(true);
    try {
      const response = await CustomerSupportTicketService.replyToTicket(
        id,
        replyText
      );
      if (response.success) {
        setMessages((prev) => [...prev, response.data]);
        setReplyText("");
        fetchTicketDetails();
      } else {
        message.error(
          "Failed to send reply: " + (response.message || "Unknown error")
        );
      }
    } catch (error) {
      message.error("Failed to send reply. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingFallback />;

  if (!ticket)
    return (
      <ThemeProvider theme={globalTheme}>
        <PageWrapper>
          <ExploreHeader showOptionsWrapper={false} />
          <PageContentContainer>
            <Empty description="Ticket not found." />
          </PageContentContainer>
          <Footer />
        </PageWrapper>
      </ThemeProvider>
    );

  const isTicketClosed =
    ticket.status === "resolved" || ticket.status === "closed";

  let separatorIndex = -1;
  if (lastReadTimestamp) {
    separatorIndex = messages.findIndex(
      (msg) => new Date(msg.timestamp) > new Date(lastReadTimestamp)
    );
  }

  return (
    <ThemeProvider theme={globalTheme}>
      <ConfigProvider theme={globalTheme}>
        <PageWrapper>
          <ExploreHeader showOptionsWrapper={false} />
          <PageContentContainer>
            <MainContent>
              <div>
                <BackButton onClick={() => router.push("/my-tickets")}>
                  <ArrowLeft size={16} /> Back to My Tickets
                </BackButton>
                <TicketHeader>
                  <TicketTitle>{ticket.subject}</TicketTitle>
                  <TicketMeta>
                    <MetaItem>
                      <TicketIcon size={16} /> Ticket #{ticket.ticket_id}
                    </MetaItem>
                    <MetaItem>
                      <Calendar size={16} /> Created:{" "}
                      {formatDate(ticket.created_at)}
                    </MetaItem>
                    {ticket.updated_at !== ticket.created_at && (
                      <MetaItem>
                        <Clock size={16} /> Updated:{" "}
                        {formatTimeAgo(ticket.updated_at)}
                      </MetaItem>
                    )}
                  </TicketMeta>
                </TicketHeader>
              </div>

              <ConversationCard title="Conversation History">
                <MessagesContainer ref={chatContainerRef}>
                  {messages.length > 0 ? (
                    messages.map((msg, index) => {
                      const sender = getSenderInfo(msg.sender_type, ticket);
                      const isUser = msg.sender_type === "user";
                      const showSeparator =
                        index === separatorIndex && msg.sender_type !== "user";

                      return (
                        <React.Fragment key={msg.id || index}>
                          {showSeparator && (
                            <NewMessagesSeparator>
                              <span>New Messages</span>
                            </NewMessagesSeparator>
                          )}
                          <MessageWrapper $isUser={isUser}>
                            {!isUser && sender.icon}
                            <MessageBubble $isUser={isUser}>
                              <MessageSender $isUser={isUser}>
                                {sender.name}
                              </MessageSender>
                              <MessageContent>{msg.text}</MessageContent>
                              <MessageMeta $isUser={isUser}>
                                {formatTimeAgo(msg.timestamp)}
                              </MessageMeta>
                            </MessageBubble>
                            {isUser && sender.icon}
                          </MessageWrapper>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <Empty description="No messages in this conversation yet." />
                  )}
                </MessagesContainer>
                {isTicketClosed ? (
                  <ResolutionNote>
                    <h4>
                      <CheckCircle size={18} /> Ticket {ticket.status_display}
                    </h4>
                    <p>
                      {ticket.resolution_notes ||
                        "This ticket has been closed and no more replies can be sent."}
                    </p>
                  </ResolutionNote>
                ) : (
                  <ReplyInputArea onSubmit={handleSubmitReply}>
                    <StyledInput
                      placeholder="Type your reply here..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={isSubmitting}
                      autoSize={{ minRows: 1, maxRows: 5 }}
                    />
                    <StyledSendButton
                      htmlType="submit"
                      type="primary"
                      shape="circle"
                      icon={<Send size={18} />}
                      disabled={!replyText.trim() || isSubmitting}
                      loading={isSubmitting}
                    />
                  </ReplyInputArea>
                )}
              </ConversationCard>
            </MainContent>

            <Sidebar>
              <TicketInfoCard title="Ticket Details">
                <InfoGrid>
                  <InfoItem>
                    <div className="label">
                      <Check size={14} /> Status
                    </div>
                    <div className="value">
                      <StatusTag color={getTagColor("status", ticket.status)}>
                        {ticket.status_display}
                      </StatusTag>
                    </div>
                  </InfoItem>
                  <InfoItem>
                    <div className="label">
                      <AlertTriangle size={14} /> Priority
                    </div>
                    <div className="value">
                      <Tag color={getTagColor("priority", ticket.priority)}>
                        {ticket.priority_display}
                      </Tag>
                    </div>
                  </InfoItem>
                  <InfoItem>
                    <div className="label">
                      <TagIcon size={14} /> Category
                    </div>
                    <div className="value">
                      <Tag color="cyan">
                        {getCategoryDisplay(ticket.category)}
                      </Tag>
                    </div>
                  </InfoItem>
                </InfoGrid>
              </TicketInfoCard>

              <AgentCard>
                {getSenderInfo("agent", ticket).icon}
                <div className="agent-info">
                  <div className="agent-name">
                    {getSenderInfo("agent", ticket).name}
                  </div>
                  <div className="agent-role">Support Agent</div>
                </div>
              </AgentCard>
            </Sidebar>
          </PageContentContainer>
          <Footer />
        </PageWrapper>
      </ConfigProvider>
    </ThemeProvider>
  );
}

// Export with Suspense wrapper
export default function TicketDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TicketDetailContent />
    </Suspense>
  );
}
