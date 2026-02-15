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
  HelpCircle,
  CheckCircle,
  Check,
} from "lucide-react";
import {
  Input,
  Button,
  ConfigProvider,
  Avatar,
  Empty,
} from "antd";
import message from "@/lib/message";
import { CustomerSupportTicketService } from "@/services/apiService";
import ExploreHeader from "@/components/explore/ExploreHeader";
import { theme as globalTheme } from "@/components/theme";
import { TicketDetailLoadingSkeleton } from "../_components/TicketsLoadingSkeleton";
import FooterClient from "@/components/homepage/FooterClient";

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const PageContent = styled.div`
  flex-grow: 1;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 48px;

  @media (max-width: 768px) {
    padding: 20px 16px 40px;
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #717171;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 0;
  margin-bottom: 20px;

  &:hover {
    color: #ff3562;
  }
`;

const TicketHeader = styled.div`
  margin-bottom: 24px;
`;

const TicketTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #334155;
  margin: 0 0 12px;
  line-height: 1.3;
`;

const TicketMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 24px;
  font-size: 13px;
  color: #717171;
`;

const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const InfoTagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
`;

const InfoTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 13px;

  .tag-label {
    color: #64748b;
    font-weight: 500;
  }

  .tag-value {
    color: #334155;
    font-weight: 600;
  }
`;

const StatusTagStyled = styled(InfoTag)`
  background: ${(props) => props.$bg || "#f8fafc"};
  border-color: ${(props) => props.$borderColor || "#e2e8f0"};

  .tag-value {
    color: ${(props) => props.$color || "#334155"};
  }
`;

const ConversationSection = styled.div`
  border: 1px solid #ebebeb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
`;

const ConversationHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #ebebeb;
  font-size: 15px;
  font-weight: 600;
  color: #334155;
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  max-height: 55vh;
  overflow-y: auto;
  background: #fafafa;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #d4d4d4;
    border-radius: 3px;
  }
`;

const MessageRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
`;

const BUBBLE_COLOR = "#ff3562";

const MessageBubble = styled.div`
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 16px;
  word-wrap: break-word;

  ${(props) =>
    props.$isUser
      ? `
        background: ${BUBBLE_COLOR};
        color: #fff;
        border-bottom-right-radius: 4px;
        order: 2;
      `
      : `
        background: #fff;
        color: #334155;
        border: 1px solid #ebebeb;
        border-bottom-left-radius: 4px;
      `}
`;

const MessageSender = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  color: ${(props) => (props.$isUser ? "rgba(255,255,255,0.8)" : "#717171")};
`;

const MessageContent = styled.div`
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const MessageTime = styled.div`
  font-size: 11px;
  color: ${(props) => (props.$isUser ? "rgba(255,255,255,0.6)" : "#a3a3a3")};
  margin-top: 6px;
`;

// --- Redesigned Input Area ---

const ReplyArea = styled.form`
  padding: 20px;
  border-top: 1px solid #ebebeb;
  background: #fff;
`;

const InputContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 26px; /* High radius for capsule look */
  background: #fff;
  padding: 6px 6px 6px 16px; /* Padding balances the button on the right */
  transition: all 0.2s ease;
  position: relative;

  /* Focus Ring on the Container, not the Input */
  &:focus-within {
    border-color: #ff3562;
    box-shadow: 0 0 0 3px rgba(255, 53, 98, 0.1);
  }

  .ant-input {
    padding: 8px 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    resize: none;
    font-size: 14px;
    line-height: 1.5;

    &:focus {
      box-shadow: none !important;
    }
  }
`;

const ReplyTextareaWrapper = styled.div`
  flex: 1;
  min-width: 0;
  padding-bottom: 2px;
`;

const SendBtn = styled(Button)`
  height: 36px !important;
  width: 36px !important;
  min-width: 36px !important;
  top: -2px;
  border-radius: 50% !important; /* Circular button */
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: none !important;
  background: ${(props) => (props.disabled ? "#f5f5f5" : "#ff3562")} !important;
  
  &:hover {
    background: ${(props) => (props.disabled ? "#f5f5f5" : "#e01b46")} !important;
  }
  
  svg {
    margin-left: ${(props) => (props.disabled ? "0" : "-2px")}; /* Visual adjustment for Send icon */
    margin-top: 4px;
    color: ${(props) => (props.disabled ? "#d9d9d9" : "#fff")};
  }
`;

// -----------------------------

const ResolutionBanner = styled.div`
  padding: 16px 20px;
  background: #ecfdf5;
  border-top: 1px solid #a7f3d0;
  display: flex;
  align-items: flex-start;
  gap: 12px;

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #047857;
    margin: 0 0 4px;
  }

  p {
    font-size: 13px;
    color: #065f46;
    margin: 0;
    line-height: 1.5;
  }
`;

const NewMessagesSeparator = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #e5e5e5;
  }

  span {
    font-size: 11px;
    font-weight: 600;
    color: #717171;
    padding: 4px 10px;
    background: #fff;
    border-radius: 6px;
    border: 1px solid #ebebeb;
  }
`;

const AgentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fafafa;
  border-top: 1px solid #ebebeb;
`;

const AgentDetails = styled.div`
  .agent-name {
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    margin: 0 0 2px;
  }

  .agent-role {
    font-size: 12px;
    color: #717171;
    margin: 0;
  }
`;

// Helpers
const formatDate = (dateString) => {
  if (dateString == null || dateString === "") return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatTimeAgo = (dateString) => {
  if (dateString == null || dateString === "") return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = new Date() - d;
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

const getSenderInfo = (senderType, ticket) => {
  if (senderType === "user")
    return {
      name: "You",
      icon: (
        <Avatar
          src={ticket.user_details?.avatar_thumb_url}
          size={32}
          style={{ backgroundColor: "#ff3562" }}
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
        style={{ backgroundColor: "#10b981" }}
        icon={<HelpCircle size={16} />}
      />
    ),
  };
};

function LoadingFallback() {
  return <TicketDetailLoadingSkeleton />;
}

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
    if (!id) return;
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
        message.error(response.error || "Failed to load ticket details.");
        router.push("/my-tickets");
      }
    } catch (error) {
      message.error("An error occurred. Please try again.");
      router.push("/my-tickets");
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
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
          <PageContent>
            <Empty description="Ticket not found." />
          </PageContent>
          <FooterClient />
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
          <PageContent>
            <BackButton onClick={() => router.push("/my-tickets")}>
              <ArrowLeft size={16} /> Back to tickets
            </BackButton>

            <TicketHeader>
              <TicketTitle>{ticket.subject}</TicketTitle>
              <TicketMetaRow>
                <MetaItem>
                  <TicketIcon size={14} /> #{ticket.ticket_id}
                </MetaItem>
                <MetaItem>
                  <Calendar size={14} /> {formatDate(ticket.created_at)}
                </MetaItem>
                {ticket.updated_at !== ticket.created_at && (
                  <MetaItem>
                    <Clock size={14} /> Updated {formatTimeAgo(ticket.updated_at)}
                  </MetaItem>
                )}
              </TicketMetaRow>
              <InfoTagsRow>
                <StatusTagStyled
                  $bg={
                    {
                      open: "#eff6ff",
                      in_progress: "#fffbeb",
                      resolved: "#ecfdf5",
                      closed: "#f8fafc",
                    }[ticket.status] || "#f8fafc"
                  }
                  $borderColor={
                    {
                      open: "#bfdbfe",
                      in_progress: "#fde68a",
                      resolved: "#a7f3d0",
                      closed: "#e2e8f0",
                    }[ticket.status] || "#e2e8f0"
                  }
                  $color={
                    {
                      open: "#1d4ed8",
                      in_progress: "#b45309",
                      resolved: "#047857",
                      closed: "#64748b",
                    }[ticket.status] || "#64748b"
                  }
                >
                  <Check size={14} />
                  <span className="tag-label">Status</span>
                  <span className="tag-value">{ticket.status_display}</span>
                </StatusTagStyled>
                <InfoTag>
                  <span className="tag-label">Priority</span>
                  <span className="tag-value">{ticket.priority_display}</span>
                </InfoTag>
                <InfoTag>
                  <span className="tag-label">Category</span>
                  <span className="tag-value">
                    {getCategoryDisplay(ticket.category)}
                  </span>
                </InfoTag>
              </InfoTagsRow>
            </TicketHeader>

            <ConversationSection>
              <ConversationHeader>Conversation</ConversationHeader>

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
                            <span>New messages</span>
                          </NewMessagesSeparator>
                        )}
                        <MessageRow $isUser={isUser}>
                          {!isUser && sender.icon}
                          <MessageBubble $isUser={isUser}>
                            <MessageSender $isUser={isUser}>
                              {sender.name}
                            </MessageSender>
                            <MessageContent>{msg.text}</MessageContent>
                            <MessageTime $isUser={isUser}>
                              {formatTimeAgo(msg.timestamp)}
                            </MessageTime>
                          </MessageBubble>
                          {isUser && sender.icon}
                        </MessageRow>
                      </React.Fragment>
                    );
                  })
                ) : (
                  <Empty description="No messages yet." />
                )}
              </MessagesContainer>

              {isTicketClosed ? (
                <ResolutionBanner>
                  <CheckCircle size={20} color="#047857" />
                  <div>
                    <h4>Ticket {ticket.status_display}</h4>
                    <p>
                      {ticket.resolution_notes ||
                        "This ticket has been closed. No more replies can be sent."}
                    </p>
                  </div>
                </ResolutionBanner>
              ) : (
                <ReplyArea onSubmit={handleSubmitReply}>
                  <InputContainer>
                    <ReplyTextareaWrapper>
                      <Input.TextArea
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        disabled={isSubmitting}
                        autoSize={{ minRows: 1, maxRows: 5 }}
                      />
                    </ReplyTextareaWrapper>
                    <SendBtn
                      htmlType="submit"
                      type="primary"
                      shape="circle"
                      icon={<Send size={18} />}
                      disabled={!replyText.trim() || isSubmitting}
                      loading={isSubmitting}
                    />
                  </InputContainer>
                </ReplyArea>
              )}

              <AgentInfo>
                {getSenderInfo("agent", ticket).icon}
                <AgentDetails>
                  <div className="agent-name">
                    {getSenderInfo("agent", ticket).name}
                  </div>
                  <div className="agent-role">Support agent</div>
                </AgentDetails>
              </AgentInfo>
            </ConversationSection>
          </PageContent>
          <FooterClient />
        </PageWrapper>
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default function TicketDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TicketDetailContent />
    </Suspense>
  );
}