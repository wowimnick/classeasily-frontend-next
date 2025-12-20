"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  Button,
  Input,
  Space,
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
  max-width: 1200px;
  min-height: 90vh;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px 64px;

  @media (max-width: 768px) {
    padding: 24px 16px 48px;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
`;

const HeaderTexts = styled.div`
  h1 {
    font-size: 28px;
    font-weight: 800;
    color: #222;
    margin: 0 0 4px;
    line-height: 1.2;
  }

  p {
    font-size: 15px;
    color: #717171;
    margin: 0;
  }
`;

const CreateTicketButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ControlsContainer = styled.div`
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SearchRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterScrollContainer = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterButton = styled.button`
  padding: 6px 14px;
  border-radius: 20px;
  white-space: nowrap;
  border: 1px solid
    ${(props) =>
      props.$active
        ? props.theme.token.colorPrimary
        : props.theme.token.colorBorder};
  background-color: ${(props) =>
    props.$active ? props.theme.token.colorPrimary : "white"};
  color: ${(props) =>
    props.$active ? "#ffffff" : props.theme.token.colorTextSecondary};
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${(props) => props.theme.token.colorPrimary};
    color: ${(props) =>
      props.$active ? "#ffffff" : props.theme.token.colorPrimary};
  }
`;

const StyledSearchInput = styled(Input)`
  flex: 1;
  .ant-input-prefix {
    margin-right: 8px;
  }
  &.ant-input-affix-wrapper {
    border-radius: 10px;
    padding: 8px 11px;
    border-color: #e8e8e8;
    &:hover,
    &:focus-within {
      border-color: ${globalTheme.token.colorPrimary};
    }
  }
`;

// --- Grid System ---
const TicketsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const TicketCard = styled(motion.div)`
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
    border-color: #d9d9d9;
  }
`;

const CardHeader = styled.div`
  padding: 16px 16px 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const TicketIdBadge = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #717171;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const StatusBadge = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${(props) => props.$color};
  background: ${(props) => props.$background};
`;

const CardContent = styled.div`
  padding: 0 16px 16px;
  flex: 1;
`;

const TicketSubject = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #222;
  margin: 0 0 8px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TicketDescription = styled.p`
  font-size: 13px;
  color: #717171;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Divider = styled.div`
  height: 1px;
  background: #f0f0f0;
  margin-top: auto;
`;

const CardFooter = styled.div`
  padding: 12px 16px;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FooterDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #555;
  font-weight: 500;

  svg {
    color: ${globalTheme.token.colorPrimary};
  }
`;

const ActionIcon = styled.div`
  color: ${globalTheme.token.colorPrimary};
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  gap: 4px;
  opacity: 0.8;
  transition: opacity 0.2s;

  ${TicketCard}:hover & {
    opacity: 1;
  }
`;

const CenteredState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 24px;
  background-color: ${(props) => props.theme.token.colorBgContainer};
  border-radius: 12px;
  border: 1px solid #e8e8e8;
`;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
  }
  .ant-modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
  }
  .ant-modal-body {
    padding: 24px;
  }
`;

// --- Helpers ---
const statusMap = {
  open: {
    label: "Open",
    icon: <AlertCircle size={12} strokeWidth={3} />,
    color: "#3b82f6",
    background: "#eff6ff",
  },
  in_progress: {
    label: "In Progress",
    icon: <Clock size={12} strokeWidth={3} />,
    color: "#d97706",
    background: "#fef3c7",
  },
  resolved: {
    label: "Resolved",
    icon: <CheckCircle size={12} strokeWidth={3} />,
    color: "#10b981",
    background: "#ecfdf5",
  },
  closed: {
    label: "Closed",
    icon: <XCircle size={12} strokeWidth={3} />,
    color: "#64748b",
    background: "#f1f5f9",
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
    total: tickets.length,
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
        image={<TicketIcon size={48} color="#d9d9d9" />}
        description={
          <div style={{ maxWidth: 300, margin: "0 auto" }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 16, color: "#333" }}>
              No Support Tickets
            </h4>
            <p style={{ margin: 0, color: "#777", fontSize: 14 }}>
              Need help? Create a ticket to start a conversation with our
              support team.
            </p>
          </div>
        }
      />
    </CenteredState>
  );

  const renderTickets = () => (
    <TicketsGrid
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="popLayout">
        {filteredTickets.map((ticket) => {
          const statusInfo = statusMap[ticket.status] || statusMap.closed;
          return (
            <TicketCard
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={ticket.ticket_id}
              onClick={() => router.push(`/my-tickets/${ticket.ticket_id}`)}
            >
              <CardHeader>
                <TicketIdBadge>#{ticket.ticket_id}</TicketIdBadge>
                <StatusBadge
                  $color={statusInfo.color}
                  $background={statusInfo.background}
                >
                  {statusInfo.icon}
                  {statusInfo.label}
                </StatusBadge>
              </CardHeader>

              <CardContent>
                <TicketSubject title={ticket.subject}>
                  {ticket.subject}
                </TicketSubject>
                <TicketDescription>{ticket.description}</TicketDescription>
              </CardContent>

              <Divider />

              <CardFooter>
                <FooterDetail>
                  <TagIcon size={14} />
                  {getCategoryDisplay(ticket.category)}
                </FooterDetail>
                <ActionIcon>
                  Open <ChevronRight size={14} />
                </ActionIcon>
              </CardFooter>
            </TicketCard>
          );
        })}
      </AnimatePresence>
    </TicketsGrid>
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
                <p>Track your inquiries and get help.</p>
              </HeaderTexts>
              <CreateTicketButton
                type="primary"
                icon={<PlusCircle size={18} />}
                onClick={() => setCreateModalVisible(true)}
              >
                New Ticket
              </CreateTicketButton>
            </HeaderSection>

            {tickets.length > 0 && (
              <ControlsContainer>
                <SearchRow>
                  <StyledSearchInput
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    prefix={<Search size={16} color="#bfbfbf" />}
                    allowClear
                  />
                </SearchRow>
                <FilterScrollContainer>
                  <FilterButton
                    $active={filter === "all"}
                    onClick={() => setFilter("all")}
                  >
                    All
                  </FilterButton>
                  <FilterButton
                    $active={filter === "open"}
                    onClick={() => setFilter("open")}
                  >
                    Open ({stats.open})
                  </FilterButton>
                  <FilterButton
                    $active={filter === "in_progress"}
                    onClick={() => setFilter("in_progress")}
                  >
                    In Progress ({stats.inProgress})
                  </FilterButton>
                  <FilterButton
                    $active={filter === "resolved"}
                    onClick={() => setFilter("resolved")}
                  >
                    Resolved ({stats.resolved})
                  </FilterButton>
                </FilterScrollContainer>
              </ControlsContainer>
            )}

            {isLoading ? (
              <CenteredState>
                <GlobalLoaderWithoutInlineStyles />
              </CenteredState>
            ) : tickets.length === 0 ? (
              renderEmptyState()
            ) : filteredTickets.length === 0 ? (
              <CenteredState>
                <Empty description="No tickets found matching your filters." />
              </CenteredState>
            ) : (
              renderTickets()
            )}
          </PageContainer>
          <FooterClient />
        </PageWrapper>

        <StyledModal
          title={
            <Space align="center">
              <MessageSquare size={20} color={globalTheme.token.colorPrimary} />
              <span style={{ fontWeight: 700 }}>Create Ticket</span>
            </Space>
          }
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          footer={null}
          width={520}
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
              <Input placeholder="Brief summary of issue" />
            </Form.Item>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
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
                rows={5}
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
              key={`btn-${isCreatingTicket}`}>
              Submit Ticket
            </Button>
          </Form>
        </StyledModal>
      </ConfigProvider>
    </ThemeProvider>
  );
}