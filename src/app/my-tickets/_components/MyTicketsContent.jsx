"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Empty,
  ConfigProvider,
  Modal,
  Form,
  Select,
} from "antd";
import message from "@/lib/message";
import {
  Ticket as TicketIcon,
  PlusCircle,
  Search,
  Clock,
  Tag as TagIcon,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import styled, { ThemeProvider } from "styled-components";
import ExploreHeader from "@/components/explore/ExploreHeader";
import { CustomerSupportTicketService } from "@/services/apiService";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { theme as globalTheme } from "@/components/theme";
import FooterClient from "@/components/homepage/FooterClient";
import { motion, AnimatePresence } from "framer-motion";

const { Option } = Select;
const { TextArea } = Input;

// --- Styled Components ---

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const PageContainer = styled.div`
  flex-grow: 1;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 48px;

  @media (max-width: 768px) {
    padding: 20px 16px 40px;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
`;

const HeaderTexts = styled.div`
  h1 {
    font-size: 26px;
    font-weight: 700;
    color: #334155;
    margin: 0 0 4px;
    line-height: 1.2;
  }

  p {
    font-size: 14px;
    color: #717171;
    margin: 0;
  }
`;

const CreateTicketButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 20px;
  border-radius: 8px;
  font-weight: 600;
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const ControlsRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchInputWrapper = styled.div`
  flex: 1;
  min-width: 200px;
  max-width: 320px;

  @media (max-width: 640px) {
    max-width: none;
  }
`;

const FilterPills = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const FilterPill = styled.button`
  padding: 8px 16px;
  border-radius: 24px;
  border: none;
  background: ${(props) => (props.$active ? "#ff3562" : "#f7f7f7")};
  color: ${(props) => (props.$active ? "#fff" : "#334155")};
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${(props) => (props.$active ? "#ff3562" : "#ebebeb")};
  }
`;

// List layout - Airbnb inbox style
const TicketsList = styled(motion.div)`
  display: flex;
  flex-direction: column;
  border: 1px solid #ebebeb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
`;

const TicketRow = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  cursor: pointer;
  border-bottom: 1px solid #ebebeb;
  transition: background 0.15s ease;
  min-height: 88px;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f7f7f7;
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px;
    min-height: auto;
  }
`;

const TicketMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const TicketSubject = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 4px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TicketMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #717171;
  flex-wrap: wrap;
`;

const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const TicketRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const StatusBadge = styled.span`
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${(props) => props.$color};
  background: ${(props) => props.$bg};
`;

const ChevronWrapper = styled.div`
  color: #717171;
  opacity: 0;
  transition: opacity 0.15s;

  ${TicketRow}:hover & {
    opacity: 1;
  }

  @media (max-width: 640px) {
    opacity: 1;
  }
`;

const CenteredState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 64px 24px;
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 12px;
`;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 12px;
    overflow: hidden;
  }
  .ant-modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid #ebebeb;
  }
  .ant-modal-body {
    padding: 0px;
  }
`;

// --- Helpers ---
const statusMap = {
  open: {
    label: "Open",
    icon: <AlertCircle size={12} strokeWidth={2.5} />,
    color: "#1d4ed8",
    bg: "#dbeafe",
  },
  in_progress: {
    label: "In Progress",
    icon: <Clock size={12} strokeWidth={2.5} />,
    color: "#b45309",
    bg: "#fef3c7",
  },
  resolved: {
    label: "Resolved",
    icon: <CheckCircle size={12} strokeWidth={2.5} />,
    color: "#047857",
    bg: "#d1fae5",
  },
  closed: {
    label: "Closed",
    icon: <XCircle size={12} strokeWidth={2.5} />,
    color: "#64748b",
    bg: "#f1f5f9",
  },
};

const getCategoryDisplay = (category) => {
  const categories = {
    account: "Account",
    booking: "Bookings",
    payment: "Payments",
    technical: "Tech Support",
    feature: "Feature Req",
    other: "Other",
  };
  return categories[category] || category;
};

const formatDate = (dateString) => {
  if (dateString == null || dateString === "") return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function MyTicketsContent() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const response = await CustomerSupportTicketService.getUserTickets();
        setTickets(
          response.success && Array.isArray(response.data) ? response.data : []
        );
      } catch (error) {
        message.error("Failed to load tickets.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const filteredTickets = tickets
    .filter((ticket) => filter === "all" || ticket.status === filter)
    .filter(
      (ticket) =>
        !searchQuery ||
        ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const stats = {
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  const handleSubmitTicket = async (values) => {
    setIsCreatingTicket(true);
    try {
      const response = await CustomerSupportTicketService.createTicket(values);
      if (response.success) {
        message.success("Support ticket created successfully.");
        setCreateModalVisible(false);
        createForm.resetFields();
        const newTickets = await CustomerSupportTicketService.getUserTickets();
        if (newTickets.success) setTickets(newTickets.data);
      } else {
        message.error(response.message || "Failed to create ticket");
      }
    } catch (error) {
      message.error("An error occurred. Please try again.");
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const renderEmptyState = () => (
    <CenteredState>
      <Empty
        image={<TicketIcon size={40} color="#d4d4d4" />}
        description={
          <div style={{ maxWidth: 280, margin: "0 auto" }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 16, color: "#334155", fontWeight: 600 }}>
              No support tickets yet
            </h4>
            <p style={{ margin: 0, color: "#717171", fontSize: 14 }}>
              Need help? Create a ticket to start a conversation with our support team.
            </p>
          </div>
        }
      />
    </CenteredState>
  );

  const renderTickets = () => (
    <TicketsList
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="popLayout">
        {filteredTickets.map((ticket) => {
          const statusInfo = statusMap[ticket.status] || statusMap.closed;
          return (
            <TicketRow
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              key={ticket.ticket_id}
              onClick={() => router.push(`/my-tickets/${ticket.ticket_id}`)}
            >
              <TicketMain>
                <TicketSubject>{ticket.subject}</TicketSubject>
                <TicketMeta>
                  <MetaItem>
                    <TagIcon size={12} />
                    {getCategoryDisplay(ticket.category)}
                  </MetaItem>
                  <MetaItem>
                    <Clock size={12} />
                    {formatDate(ticket.created_at ?? ticket.updated_at)}
                  </MetaItem>
                </TicketMeta>
              </TicketMain>
              <TicketRight>
                <StatusBadge $color={statusInfo.color} $bg={statusInfo.bg}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </StatusBadge>
                <ChevronWrapper>
                  <ChevronRight size={18} />
                </ChevronWrapper>
              </TicketRight>
            </TicketRow>
          );
        })}
      </AnimatePresence>
    </TicketsList>
  );

  return (
    <ThemeProvider theme={globalTheme}>
      <ConfigProvider theme={globalTheme}>
        <PageWrapper>
          <ExploreHeader showOptionsWrapper={false} />
          <PageContainer>
            <HeaderSection>
              <HeaderTexts>
                <h1>Support Center</h1>
                <p>Manage your support tickets</p>
              </HeaderTexts>
              <CreateTicketButton
                type="primary"
                icon={<PlusCircle size={18} />}
                onClick={() => setCreateModalVisible(true)}
              >
                New ticket
              </CreateTicketButton>
            </HeaderSection>

            {tickets.length > 0 && (
              <ControlsRow>
                <SearchInputWrapper>
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    prefix={<Search size={16} />}
                    allowClear
                  />
                </SearchInputWrapper>
                <FilterPills>
                  <FilterPill $active={filter === "all"} onClick={() => setFilter("all")}>
                    All
                  </FilterPill>
                  <FilterPill $active={filter === "open"} onClick={() => setFilter("open")}>
                    Open {stats.open > 0 && `(${stats.open})`}
                  </FilterPill>
                  <FilterPill $active={filter === "in_progress"} onClick={() => setFilter("in_progress")}>
                    In progress {stats.inProgress > 0 && `(${stats.inProgress})`}
                  </FilterPill>
                  <FilterPill $active={filter === "resolved"} onClick={() => setFilter("resolved")}>
                    Resolved {stats.resolved > 0 && `(${stats.resolved})`}
                  </FilterPill>
                </FilterPills>
              </ControlsRow>
            )}

            {isLoading ? (
              <CenteredState>
                <GlobalLoaderWithoutInlineStyles />
              </CenteredState>
            ) : tickets.length === 0 ? (
              renderEmptyState()
            ) : filteredTickets.length === 0 ? (
              <CenteredState>
                <Empty description="No tickets match your filters." />
              </CenteredState>
            ) : (
              renderTickets()
            )}
          </PageContainer>
          <FooterClient />
        </PageWrapper>

        <StyledModal
          title={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare size={20} color={globalTheme.token.colorPrimary} />
              <span style={{ fontWeight: 600 }}>Create ticket</span>
            </span>
          }
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          footer={null}
          width={480}
          destroyOnClose
          centered
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={handleSubmitTicket}
          >
            <Form.Item
              name="subject"
              label="Subject"
              rules={[{ required: true, message: "Subject required" }]}
            >
              <Input placeholder="Brief summary of your issue" />
            </Form.Item>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: "Select category" }]}
              >
                <Select placeholder="Select...">
                  <Option value="booking">Booking</Option>
                  <Option value="payment">Payment</Option>
                  <Option value="account">Account</Option>
                  <Option value="technical">Technical</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>

              <Form.Item name="priority" label="Priority" initialValue="medium">
                <Select>
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                  <Option value="urgent">Urgent</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              name="description"
              label="Details"
              rules={[{ required: true, message: "Details required" }]}
            >
              <TextArea
                placeholder="Describe your issue..."
                rows={4}
                showCount
                maxLength={1000}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={isCreatingTicket}
              block
              size="large"
              style={{ marginTop: 8, fontWeight: 600 }}
              key={`btn-${isCreatingTicket}`}
            >
              Submit ticket
            </Button>
          </Form>
        </StyledModal>
      </ConfigProvider>
    </ThemeProvider>
  );
}
