"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import {
  Table,
  Card,
  Button,
  Tag,
  Typography,
  Skeleton,
  Empty,
  message,
  Space,
  Tooltip,
} from "antd";
import { RefreshCw, Building, ExternalLink, CreditCard } from "lucide-react";
import { adminWidgetSubscriptionService } from "@/services/adminDash";

const { Text } = Typography;

const PageWrapper = styled.div`
  padding: 24px;
  background: #f8fafc;
  min-height: 100%;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  font-size: 14px;
  color: #6b7280;
`;

const StyledCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  .ant-card-body {
    padding: 24px;
  }
`;

const statusColors = {
  active: "green",
  trialing: "blue",
  past_due: "orange",
  canceled: "red",
  incomplete: "default",
  incomplete_expired: "default",
};

export default function WidgetSubscriptionsTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminWidgetSubscriptionService.list();
      if (result.success && Array.isArray(result.data)) {
        setData(result.data);
      } else {
        message.error(result.error || "Failed to load widget subscriptions");
      }
    } catch (err) {
      message.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const columns = [
    {
      title: "Business",
      dataIndex: "business_name",
      key: "business_name",
      render: (name, record) => (
        <Space>
          <Building size={16} style={{ color: "#94a3b8" }} />
          <div>
            <Text strong>{name || `Business #${record.business_id}`}</Text>
            {record.business_slug && (
              <div>
                <a
                  href={`/business/${record.business_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#6b7280" }}
                >
                  /business/{record.business_slug}
                </a>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan_id",
      key: "plan_id",
      render: (planId) => (
        <Tag color="blue" style={{ textTransform: "capitalize" }}>
          <CreditCard size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
          {planId || "—"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColors[status] || "default"}>
          {status ? String(status).replace(/_/g, " ") : "—"}
        </Tag>
      ),
    },
    {
      title: "Period end",
      dataIndex: "current_period_end",
      key: "current_period_end",
      render: (end) =>
        end ? new Date(end).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—",
    },
    {
      title: "Cancels at period end",
      dataIndex: "cancel_at_period_end",
      key: "cancel_at_period_end",
      render: (v) => (v ? <Tag color="orange">Yes</Tag> : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {record.business_slug && (
            <Tooltip title="View business page">
              <Button
                type="link"
                size="small"
                icon={<ExternalLink size={14} />}
                href={`/business/${record.business_slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Subscription history and refunds can be managed via Stripe or support.">
            <Button type="text" size="small" disabled>
              History
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageWrapper>
      <PageHeader>
        <div>
          <Title>Widget Subscriptions</Title>
          <Subtitle>
            View and manage booking widget plans per business. Refunds and billing history are handled via Stripe or support.
          </Subtitle>
        </div>
        <Button icon={<RefreshCw size={16} />} onClick={fetchSubscriptions} loading={loading}>
          Refresh
        </Button>
      </PageHeader>

      <StyledCard>
        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : data.length === 0 ? (
          <Empty
            description="No widget subscriptions found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: "48px 0" }}
          />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={data}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} subscription(s)`,
            }}
            size="middle"
          />
        )}
      </StyledCard>
    </PageWrapper>
  );
}
