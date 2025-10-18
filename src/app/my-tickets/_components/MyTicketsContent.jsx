// app/my-tickets/_components/MyTicketsContent.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Typography,
  Button,
  Input,
  Space,
  Empty,
  message,
  ConfigProvider,
  Modal,
  Form,
  Radio,
  Select,
} from "antd";
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
  Filter,
} from "lucide-react";
import styled, { ThemeProvider } from "styled-components";
import ExploreHeader from "@/components/explore/ExploreHeader";
import { CustomerSupportTicketService } from "@/services/apiService";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { theme as globalTheme } from "@/components/theme";

// Dynamically import Footer to avoid Date() prerender issues
const Footer = dynamic(() => import("@/components/homepage/Footer"), {
  ssr: false,
});

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Keep all styled components exactly the same...
const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const PageContainer = styled.div`
  flex-grow: 1;
  max-width: 1400px;
  min-height: 90vh;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px;

  @media (max-width: 768px) {
    padding: 24px 16px;
  }
`;

const PageHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
`;

const HeaderContent = styled.div`
  flex: 1;

  h1 {
    font-size: 32px;
    font-weight: 700;
    color: ${(props) => props.theme.token.colorText};
    margin: 0 0 8px;
    line-height: 1.2;
  }

  p {
    font-size: 16px;
    color: ${(props) => props.theme.token.colorTextSecondary};
    margin: 0;
    line-height: 1.5;
  }
`;

const CreateTicketButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 180px;
  height: 44px;
  border-radius: 14px;
  font-weight: 500;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ControlsSection = styled.div`
  background: ${(props) => props.theme.token.colorBgContainer};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-radius: 14px;
  padding: 24px;
  margin-bottom: 24px;
`;

const ControlsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: ${(props) => props.theme.token.colorText};
    margin: 0;
  }
`;

const ControlsContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 8px 16px;
  border-radius: 14px;
  border: 1px solid
    ${(props) =>
      props.$active
        ? props.theme.token.colorPrimary
        : props.theme.token.colorBorder};
  background-color: ${(props) =>
    props.$active ? props.theme.token.colorPrimary : "transparent"};
  color: ${(props) =>
    props.$active ? "#ffffff" : props.theme.token.colorTextSecondary};
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${(props) =>
      props.$active
        ? props.theme.token.colorPrimary
        : props.theme.token.colorText};
    color: ${(props) =>
      props.$active ? "#ffffff" : props.theme.token.colorText};
  }
`;

const SearchInput = styled(Input)`
  max-width: 400px;

  .ant-input {
    border-radius: 8px;
    border-color: ${(props) => props.theme.token.colorBorder};

    &:focus,
    &:focus-within {
      border-color: ${(props) => props.theme.token.colorPrimary};
      box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.25);
    }
  }
`;

const TicketList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TicketCard = styled.div`
  background: ${(props) => props.theme.token.colorBgContainer};
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: ${(props) => props.theme.token.colorPrimary};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.token.colorText};
  margin: 0;
  line-height: 1.4;
  flex: 1;
`;

const StatusTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  color: ${(props) => props.color};
  background-color: ${(props) => props.background};
  flex-shrink: 0;

  svg {
    stroke-width: 2.5;
  }
`;

const TicketId = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.token.colorTextTertiary};
  font-weight: 500;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CardBody = styled.p`
  color: ${(props) => props.theme.token.colorTextSecondary};
  margin: 0 0 20px 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid ${(props) => props.theme.token.colorBorderSecondary};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const TicketInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 13px;
  color: ${(props) => props.theme.token.colorTextSecondary};

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 16px;
  }

  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const ViewDetailsLink = styled.div`
  color: ${(props) => props.theme.token.colorPrimary};
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;

  svg {
    transition: transform 0.2s ease;
  }

  ${TicketCard}:hover & svg {
    transform: translateX(3px);
  }
`;

const CenteredState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 24px;
  background-color: ${(props) => props.theme.token.colorBgContainer};
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 12px;
  }

  .ant-modal-header {
    border-radius: 12px 12px 0 0;
    padding: 20px 24px;
    border-bottom: 1px solid ${(props) => props.theme.token.colorBorder};
  }

  .ant-modal-body {
    padding: 24px;
  }
`;

// Helper Functions
const statusMap = {
  open: {
    label: "Open",
    icon: <AlertCircle size={14} />,
    color: "#3b82f6",
    background: "#eff6ff",
  },
  in_progress: {
    label: "In Progress",
    icon: <Clock size={14} />,
    color: "#d97706",
    background: "#fef3c7",
  },
  resolved: {
    label: "Resolved",
    icon: <CheckCircle size={14} />,
    color: "#10b981",
    background: "#ecfdf5",
  },
  closed: {
    label: "Closed",
    icon: <XCircle size={14} />,
    color: "#64748b",
    background: "#f1f5f9",
  },
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
};

const getCategoryDisplay = (category) => {
  const categories = {
    account: "Account Issues",
    booking: "Booking Problems",
    payment: "Payment Issues",
    technical: "Technical Support",
    feature: "Feature Request",
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
        message.error(
          "Failed to create ticket: " + (response.message || "Unknown error")
        );
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
        image={
          <TicketIcon size={64} color={globalTheme.token.colorTextTertiary} />
        }
        description={
          <Space direction="vertical" align="center" size="middle">
            <Title level={3} style={{ margin: 0 }}>
              No Support Tickets Yet
            </Title>
            <Text style={{ fontSize: 16, textAlign: "center", maxWidth: 400 }}>
              Get help from our support team by creating your first ticket.
              We're here to help with any questions or issues you may have.
            </Text>
          </Space>
        }
      />
    </CenteredState>
  );

  const renderNoMatches = () => (
    <CenteredState>
      <Empty
        image={<Search size={64} color={globalTheme.token.colorTextTertiary} />}
        description={
          <Space direction="vertical" align="center">
            <Title level={4} style={{ margin: 0 }}>
              No Matching Tickets
            </Title>
            <Text>Try adjusting your search terms or filter settings.</Text>
          </Space>
        }
      />
    </CenteredState>
  );

  const renderTickets = () => (
    <TicketList>
      {filteredTickets.map((ticket) => {
        const statusInfo = statusMap[ticket.status] || statusMap.closed;
        return (
          <TicketCard
            key={ticket.ticket_id}
            onClick={() => router.push(`/my-tickets/${ticket.ticket_id}`)}
          >
            <TicketId>
              <TicketIcon size={12} />
              Ticket #{ticket.ticket_id}
            </TicketId>
            <CardHeader>
              <CardTitle>{ticket.subject}</CardTitle>
              <StatusTag
                color={statusInfo.color}
                background={statusInfo.background}
              >
                {statusInfo.icon}
                {statusInfo.label}
              </StatusTag>
            </CardHeader>
            <CardBody>{ticket.description}</CardBody>
            <CardFooter>
              <TicketInfo>
                <span>
                  <TagIcon size={14} />
                  {getCategoryDisplay(ticket.category)}
                </span>
                <span>
                  <Clock size={14} />
                  Updated: {formatDate(ticket.updated_at)}
                </span>
              </TicketInfo>
              <ViewDetailsLink>
                View Details <ChevronRight size={16} />
              </ViewDetailsLink>
            </CardFooter>
          </TicketCard>
        );
      })}
    </TicketList>
  );

  return (
    <ThemeProvider theme={globalTheme}>
      <ConfigProvider theme={globalTheme}>
        <PageWrapper>
          <ExploreHeader showOptionsWrapper={false} />
          <PageContainer>
            <PageHeader>
              <HeaderContent>
                <Title level={1}>Support Center</Title>
                <Paragraph>
                  Manage your support tickets and get help from our team.
                </Paragraph>
              </HeaderContent>
              <CreateTicketButton
                type="primary"
                size="middle"
                icon={<PlusCircle size={20} />}
                onClick={() => setCreateModalVisible(true)}
              >
                Create New Ticket
              </CreateTicketButton>
            </PageHeader>

            {tickets.length > 0 && (
              <ControlsSection>
                <ControlsHeader>
                  <Filter size={16} />
                  <h3>Filter & Search</h3>
                </ControlsHeader>
                <ControlsContent>
                  <FilterGroup>
                    <FilterButton
                      $active={filter === "all"}
                      onClick={() => setFilter("all")}
                    >
                      All ({tickets.length})
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
                  </FilterGroup>
                  <SearchInput
                    placeholder="Search tickets by subject or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    prefix={
                      <Search
                        size={18}
                        color={globalTheme.token.colorTextTertiary}
                      />
                    }
                    allowClear
                  />
                </ControlsContent>
              </ControlsSection>
            )}

            {isLoading ? (
              <CenteredState>
                <GlobalLoaderWithoutInlineStyles />
              </CenteredState>
            ) : tickets.length === 0 ? (
              renderEmptyState()
            ) : filteredTickets.length === 0 ? (
              renderNoMatches()
            ) : (
              renderTickets()
            )}
          </PageContainer>
          <Footer />
        </PageWrapper>

        <StyledModal
          title={
            <Space align="center">
              <TicketIcon size={20} />
              <span style={{ fontWeight: 600, fontSize: 18 }}>
                Create Support Ticket
              </span>
            </Space>
          }
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          footer={null}
          width={600}
          destroyOnClose
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={handleSubmitTicket}
          >
            <Form.Item
              name="subject"
              label="Subject"
              rules={[{ required: true, message: "Please enter a subject" }]}
            >
              <Input
                placeholder="e.g., Issue with booking confirmation"
                style={{ borderRadius: "8px" }}
              />
            </Form.Item>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Please select a category" }]}
            >
              <Select
                placeholder="Select the most relevant category"
                style={{ borderRadius: "8px" }}
              >
                <Option value="account">Account Issues</Option>
                <Option value="booking">Booking Problems</Option>
                <Option value="payment">Payment Issues</Option>
                <Option value="technical">Technical Support</Option>
                <Option value="feature">Feature Request</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
            <Form.Item name="priority" label="Priority" initialValue="medium">
              <Radio.Group>
                <Radio.Button value="low">Low</Radio.Button>
                <Radio.Button value="medium">Medium</Radio.Button>
                <Radio.Button value="high">High</Radio.Button>
                <Radio.Button value="urgent">Urgent</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: "Please provide details" }]}
            >
              <TextArea
                placeholder="Please describe your issue in detail..."
                autoSize={{ minRows: 4, maxRows: 8 }}
                style={{ borderRadius: "8px" }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => setCreateModalVisible(false)}
                  style={{ borderRadius: "8px" }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isCreatingTicket}
                  style={{ borderRadius: "8px" }}
                >
                  Submit Ticket
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </StyledModal>
      </ConfigProvider>
    </ThemeProvider>
  );
}
