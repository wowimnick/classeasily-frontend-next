"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import {
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Space,
  Popconfirm,
  Tag,
  Typography,
  Grid,
  Empty,
  ConfigProvider,
} from "antd";
import message from "@/lib/message";
import { ShieldBan, Plus, Trash2, Search } from "lucide-react";
import { bannedIpService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import dayjs from "dayjs";
import { AdminCompactTable } from "../shared/AdminCompactTable";
import { adminColors as colors } from "../shared/adminColors";
import { formatDatetime } from "../shared/adminUtils";
import {
  TableSection,
  TableHeader,
  TableTitle,
  TableDescription,
  FilterBar,
  SearchFilterContainer,
} from "../shared/adminTableStyles";
import { ActionButtonsContainer, RefreshButton } from "../shared/AdminButtons";
import {
  MobileCard,
  MobileCardContent,
  MobileCardRow,
  MobileCardLabel,
  MobileCardFooter,
} from "../shared/adminMobileStyles";

const { Text } = Typography;
const { useBreakpoint } = Grid;

const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
  min-height: 100vh;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const HeaderSubtitle = styled(Text)`
  font-size: 15px;
  color: ${colors.textSecondary};
`;

export default function BannedIpManagement() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchList = useCallback(async () => {
    setLoading(true);
    const res = await bannedIpService.list();
    setLoading(false);
    if (res.success) {
      setList(Array.isArray(res.data) ? res.data : []);
    } else {
      message.error(res.error || "Failed to load banned IPs");
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (row) =>
        row.ip_address?.toLowerCase().includes(q) ||
        row.reason?.toLowerCase().includes(q) ||
        row.created_by_email?.toLowerCase().includes(q)
    );
  }, [list, search]);

  const openCreate = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        ip_address: values.ip_address?.trim(),
        reason: values.reason?.trim() || "",
        expires_at: values.expires_at
          ? values.expires_at.endOf("day").toISOString()
          : null,
      };
      const res = await bannedIpService.create(payload);
      setSubmitting(false);
      if (res.success) {
        message.success("IP address banned.");
        setModalOpen(false);
        fetchList();
      } else {
        message.error(res.error || "Failed to ban IP address");
      }
    } catch (e) {
      if (e.errorFields) return;
      setSubmitting(false);
      message.error("Please fix the form errors.");
    }
  };

  const handleDelete = async (id) => {
    const res = await bannedIpService.delete(id);
    if (res.success) {
      message.success("Banned IP removed.");
      fetchList();
    } else {
      message.error(res.error || "Failed to remove banned IP");
    }
  };

  const columns = [
    {
      title: "IP Address",
      dataIndex: "ip_address",
      key: "ip_address",
      render: (ip) => <Text code>{ip}</Text>,
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
      render: (reason) => reason || <Text type="secondary">—</Text>,
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_, row) => {
        const expired =
          row.expires_at && dayjs(row.expires_at).isBefore(dayjs());
        if (!row.is_active) {
          return <Tag>Inactive</Tag>;
        }
        if (expired) {
          return <Tag color="orange">Expired</Tag>;
        }
        return <Tag color="red">Active</Tag>;
      },
    },
    {
      title: "Expires",
      dataIndex: "expires_at",
      key: "expires_at",
      width: 180,
      render: (value) =>
        value ? (
          formatDatetime(value)
        ) : (
          <Text type="secondary">Permanent</Text>
        ),
    },
    {
      title: "Banned By",
      dataIndex: "created_by_email",
      key: "created_by_email",
      width: 200,
      ellipsis: true,
      render: (email) => email || <Text type="secondary">—</Text>,
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (value) => formatDatetime(value),
    },
    {
      title: "Actions",
      key: "actions",
      width: 90,
      align: "center",
      render: (_, row) => (
        <Popconfirm
          title="Remove this IP ban?"
          description="The IP will be allowed to access the API again."
          onConfirm={() => handleDelete(row.id)}
          okText="Remove"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<Trash2 size={16} />} />
        </Popconfirm>
      ),
    },
  ];

  const renderMobileCards = () => {
    if (filteredList.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No banned IPs found"
        />
      );
    }

    return filteredList.map((row) => {
      const expired =
        row.expires_at && dayjs(row.expires_at).isBefore(dayjs());
      return (
        <MobileCard key={row.id}>
          <MobileCardContent>
            <MobileCardRow>
              <MobileCardLabel>IP Address</MobileCardLabel>
              <Text code>{row.ip_address}</Text>
            </MobileCardRow>
            <MobileCardRow>
              <MobileCardLabel>Reason</MobileCardLabel>
              <Text>{row.reason || "—"}</Text>
            </MobileCardRow>
            <MobileCardRow>
              <MobileCardLabel>Status</MobileCardLabel>
              {!row.is_active ? (
                <Tag>Inactive</Tag>
              ) : expired ? (
                <Tag color="orange">Expired</Tag>
              ) : (
                <Tag color="red">Active</Tag>
              )}
            </MobileCardRow>
            <MobileCardRow>
              <MobileCardLabel>Expires</MobileCardLabel>
              <Text>
                {row.expires_at ? formatDatetime(row.expires_at) : "Permanent"}
              </Text>
            </MobileCardRow>
            <MobileCardRow>
              <MobileCardLabel>Created</MobileCardLabel>
              <Text>{formatDatetime(row.created_at)}</Text>
            </MobileCardRow>
          </MobileCardContent>
          <MobileCardFooter>
            <Popconfirm
              title="Remove this IP ban?"
              onConfirm={() => handleDelete(row.id)}
              okText="Remove"
              okButtonProps={{ danger: true }}
            >
              <Button danger block icon={<Trash2 size={14} />}>
                Remove Ban
              </Button>
            </Popconfirm>
          </MobileCardFooter>
        </MobileCard>
      );
    });
  };

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>
              <Space>
                <ShieldBan size={24} />
                Banned IPs
              </Space>
            </PageTitle>
            <HeaderSubtitle>
              Block IP addresses from accessing the platform API.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <RefreshButton onClick={fetchList} loading={loading} />
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
              Ban IP
            </Button>
          </ActionButtonsContainer>
        </DashboardHeader>

        <TableSection>
          <TableHeader>
            <div>
              <TableTitle>IP ban list</TableTitle>
              <TableDescription>
                {list.length} banned {list.length === 1 ? "address" : "addresses"}
              </TableDescription>
            </div>
          </TableHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input
                allowClear
                prefix={<Search size={16} />}
                placeholder="Search IP, reason, or admin email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: isMobile ? "100%" : 360 }}
              />
            </SearchFilterContainer>
          </FilterBar>

          {isMobile ? (
            renderMobileCards()
          ) : (
            <AdminCompactTable
              rowKey="id"
              columns={columns}
              dataSource={filteredList}
              loading={loading}
              pagination={{ pageSize: 20, showSizeChanger: true }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No banned IPs found"
                  />
                ),
              }}
            />
          )}
        </TableSection>

        <Modal
          title="Ban IP Address"
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={handleSubmit}
          confirmLoading={submitting}
          okText="Ban IP"
          okButtonProps={{ danger: true }}
          destroyOnClose
        >
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="ip_address"
              label="IP Address"
              rules={[
                { required: true, message: "IP address is required" },
                {
                  pattern:
                    /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$|^(?:[a-fA-F0-9:]+:+)+[a-fA-F0-9]+$/,
                  message: "Enter a valid IPv4 or IPv6 address",
                },
              ]}
            >
              <Input placeholder="e.g. 203.0.113.42" />
            </Form.Item>
            <Form.Item name="reason" label="Reason">
              <Input.TextArea
                rows={3}
                placeholder="Why is this IP being banned?"
                maxLength={500}
                showCount
              />
            </Form.Item>
            <Form.Item
              name="expires_at"
              label="Expires (optional)"
              extra="Leave blank for a permanent ban."
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Form>
        </Modal>
      </DashboardWrapper>
    </ConfigProvider>
  );
}
