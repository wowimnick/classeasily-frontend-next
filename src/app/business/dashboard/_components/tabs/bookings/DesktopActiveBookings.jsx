import React from "react";
import styled from "styled-components";
import {
  Table,
  Tag,
  Space,
  Button,
  Dropdown,
  Menu,
  Popconfirm,
  Skeleton,
} from "antd";
import {
  MoreVertical,
  Eye,
  MessageSquare,
  XCircle,
  Calendar,
  Hash,
  Repeat, // Added icon
  CheckCircle,
} from "lucide-react";
import moment from "moment";

// --- STYLES (Optimized for Desktop Clarity) ---

const StyledTable = styled(Table)`
  .ant-table {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .ant-table-thead > tr > th {
    background-color: #f8fafc !important;
    color: #475569;
    font-weight: 600;
    font-size: 13px;
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    &::before {
      display: none;
    }
  }

  .ant-table-tbody > tr > td {
    vertical-align: middle;
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 14px;
    color: #1e293b;
  }

  .ant-table-tbody > tr:last-child > td {
    border-bottom: none;
  }

  .ant-table-tbody > tr:hover > td {
    background-color: #f8fafc;
  }

  .ant-pagination {
    margin: 24px 0 0;
  }

  .ant-table-column-sorter {
    color: #94a3b8;
  }

  /* Prevent hover effect on placeholder when table is empty */
  .ant-table-tbody > tr.ant-table-placeholder:hover > td {
    background: white;
  }
`;

const ActionButton = styled(Button)`
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  .lucide {
    width: 16px;
    height: 16px;
    color: #64748b;
  }
`;

const StyledTag = styled(Tag)`
  border-radius: 6px;
  padding: 5px 10px;
  font-weight: 600;
  font-size: 12px;
  line-height: 1;
  height: auto;
  text-transform: uppercase;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &.confirmed {
    background: #eff6ff; /* Light Blue */
    color: #1d4ed8; /* Dark Blue */
  }
`;

const StyledMenu = styled(Menu)`
  min-width: 180px;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;

  .ant-dropdown-menu-item {
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;

    &:hover {
      background: #f8fafc;
    }

    .lucide {
      font-size: 16px;
      color: #64748b;
    }
  }

  .ant-dropdown-menu-item-danger {
    color: #ef4444 !important;

    &:hover {
      background: #fef2f2;
    }
    .lucide {
      color: #ef4444;
    }
  }
`;

const GuestInfo = styled.div`
  .name {
    font-weight: 500;
    color: #1e293b;
    margin-bottom: 2px;
    white-space: nowrap;
  }

  .email {
    font-size: 13px;
    color: #64748b;
    white-space: nowrap;
  }
`;

const RecurringTag = styled(Tag)`
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .lucide {
    position: relative;
    top: -1px;
  }
`;

const BookingTypeTag = styled(Tag)`
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;

  &.single {
    background: #f1f5f9;
    color: #475569;
    border-color: #cbd5e1;
  }

  &.course {
    background: #f0fdf4;
    color: #166534;
    border-color: #86efac;
  }
`;

const ExperienceDetails = styled.div`
  .main-experience {
    font-weight: 500;
    color: #1e293b;
    margin-bottom: 4px;
    white-space: nowrap;
  }

  .option-name {
    font-size: 13px;
    color: #64748b;
    white-space: nowrap;
  }
`;

const BookingTypeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
`;

const SkeletonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`;

const SkeletonLine = styled.div`
  height: ${(props) => props.height || "16px"};
  width: ${(props) => props.width || "100%"};
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
  border-radius: 4px;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const SkeletonCircle = styled(SkeletonLine)`
  border-radius: 50%;
  width: ${(props) => props.size || "36px"};
  height: ${(props) => props.size || "36px"};
`;

const SkeletonTag = styled(SkeletonLine)`
  height: 24px;
  width: 100px;
  border-radius: 6px;
`;

// Skeleton Row Component
const SkeletonRow = () => ({
  id: Math.random(),
  user_facing_reference: <SkeletonLine width="120px" height="14px" />,
  user_name: (
    <SkeletonWrapper>
      <SkeletonLine width="140px" height="14px" />
      <SkeletonLine width="180px" height="12px" />
    </SkeletonWrapper>
  ),
  class_name: (
    <SkeletonWrapper>
      <SkeletonLine width="200px" height="14px" />
      <SkeletonLine width="160px" height="12px" />
    </SkeletonWrapper>
  ),
  enrollment_type: (
    <SkeletonWrapper>
      <SkeletonTag />
    </SkeletonWrapper>
  ),
  date: (
    <SkeletonWrapper>
      <SkeletonLine width="100px" height="14px" />
      <SkeletonLine width="80px" height="12px" />
    </SkeletonWrapper>
  ),
  participants: <SkeletonLine width="30px" height="14px" />,
  status: <SkeletonTag />,
  action: <SkeletonCircle size="36px" />,
});

// Generate skeleton data
const generateSkeletonData = (count = 10) => {
  return Array.from({ length: count }, (_, i) => ({
    key: `skeleton-${i}`,
    ...SkeletonRow(),
  }));
};

// --- COMPONENT ---

const DesktopActiveBookings = ({
  data,
  showViewDrawer,
  handleCancel,
  handleReschedule, // Added prop
  pagination,
  onChange,
  sortField,
  sortOrder,
  loading,
}) => {
  // Mapping for frontend display keys to backend sort fields
  const sortableFields = {
    booking_reference: "user_facing_reference",
    guest: "user_name",
    class_name: "schedule_instance__schedule__option__classId__title",
    booking_type: "enrollment_type",
    date: "schedule_instance__date",
    participants: "participants",
    status: "status",
  };

  const getBookingTypeTag = (type, sessionInfo) => {
    const types = {
      "Single Session": { icon: <Hash size={12} />, className: "single" },
      "Full Course": { icon: <Calendar size={12} />, className: "course" },
    };
    const config = types[type] || types["Single Session"];
    return (
      <BookingTypeContainer>
        <BookingTypeTag className={config.className} icon={config.icon}>
          {type || "N/A"}
        </BookingTypeTag>
        {type === "Full Course" && sessionInfo && (
          <RecurringTag icon={<Calendar size={12} />}>
            Session {sessionInfo.current_session} of{" "}
            {sessionInfo.total_sessions}
          </RecurringTag>
        )}
      </BookingTypeContainer>
    );
  };

  const handleTableChange = (pagination, filters, sorter) => {
    const backendSortField = sortableFields[sorter.field] || sorter.field;
    onChange(pagination, filters, {
      ...sorter,
      field: backendSortField,
    });
  };

  const columns = [
    {
      title: "REFERENCE",
      dataIndex: "user_facing_reference",
      key: "booking_reference",
      sorter: true,
      sortOrder: sortField === "user_facing_reference" ? sortOrder : null,
      width: 160,
    },
    {
      title: "GUEST",
      dataIndex: "user_name",
      key: "guest",
      sorter: true,
      sortOrder: sortField === "user_name" ? sortOrder : null,
      render: (_, record) => {
        // Handle skeleton loading state
        if (React.isValidElement(record.user_name)) {
          return record.user_name;
        }
        return (
          <GuestInfo>
            <div className="name">{record.user_name || "N/A"}</div>
            <div className="email">{record.user_email || "N/A"}</div>
          </GuestInfo>
        );
      },
      width: 220,
    },
    {
      title: "EXPERIENCE DETAILS",
      dataIndex: "class_name",
      key: "class_name",
      sorter: true,
      sortOrder:
        sortField === "schedule_instance__schedule__option__classId__title"
          ? sortOrder
          : null,
      render: (text, record) => {
        // Handle skeleton loading state
        if (React.isValidElement(text)) {
          return text;
        }
        return (
          <ExperienceDetails>
            <div className="main-experience">{text || "N/A"}</div>
            <div className="option-name">{record.option_name || "N/A"}</div>
          </ExperienceDetails>
        );
      },
      width: 280,
    },
    {
      title: "BOOKING TYPE",
      dataIndex: "enrollment_type",
      key: "booking_type",
      sorter: true,
      sortOrder: sortField === "enrollment_type" ? sortOrder : null,
      render: (type, record) => {
        // Handle skeleton loading state
        if (React.isValidElement(type)) {
          return type;
        }
        return getBookingTypeTag(type, record.session_info);
      },
      width: 180,
    },
    {
      title: "DATE & TIME",
      dataIndex: "date",
      key: "date",
      sorter: true,
      sortOrder: sortField === "schedule_instance__date" ? sortOrder : null,
      render: (_, record) => {
        // Handle skeleton loading state
        if (React.isValidElement(record.date)) {
          return record.date;
        }
        return (
          <Space direction="vertical" size={0}>
            <div>
              {record.date ? moment(record.date).format("MMM D, YYYY") : "N/A"}
            </div>
            <div style={{ color: "#64748b", fontSize: "13px" }}>
              {record.time
                ? moment(record.time, "HH:mm:ss").format("h:mm A")
                : "N/A"}
            </div>
          </Space>
        );
      },
      width: 160,
    },
    {
      title: "SPOTS",
      dataIndex: "participants",
      key: "participants",
      sorter: true,
      sortOrder: sortField === "participants" ? sortOrder : null,
      width: 100,
      align: "center",
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      sorter: true,
      sortOrder: sortField === "status" ? sortOrder : null,
      render: (status) => {
        // Handle skeleton loading state
        if (React.isValidElement(status)) {
          return status;
        }

        const statusLower =
          status && typeof status === "string" ? status.toLowerCase() : "";
        if (statusLower === "confirmed") {
          return (
            <StyledTag className="confirmed" icon={<CheckCircle size={12} />}>
              {status.toUpperCase()}
            </StyledTag>
          );
        }
        // Fallback for any unexpected statuses
        return (
          <Tag>
            {status && typeof status === "string"
              ? status.toUpperCase()
              : "N/A"}
          </Tag>
        );
      },
      width: 140,
      align: "center",
    },
    {
      title: "ACTIONS",
      key: "action",
      render: (_, record) => (
        <Dropdown
          overlay={menu(record)}
          trigger={["click"]}
          placement="bottomRight"
        >
          <ActionButton icon={<MoreVertical size={16} />} />
        </Dropdown>
      ),
      width: 100,
      fixed: "right",
      align: "center",
    },
  ];

  // Actions Menu
  const menu = (record) => (
    <StyledMenu>
      <Menu.Item
        key="1"
        icon={<Eye size={16} />}
        onClick={() => showViewDrawer(record)}
      >
        View Details
      </Menu.Item>
      <Menu.Item
        key="2"
        icon={<Repeat size={16} />}
        onClick={() => handleReschedule(record)}
      >
        Reschedule
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="4"
        danger
        icon={<XCircle size={16} />}
        className="ant-dropdown-menu-item-danger"
      >
        <Popconfirm
          title="Are you sure you want to cancel this booking?"
          onConfirm={(e) => {
            e.stopPropagation(); // Prevent dropdown from closing
            handleCancel(record);
          }}
          onCancel={(e) => e.stopPropagation()}
          okText="Yes, Cancel"
          cancelText="No"
          placement="left"
        >
          {/* This span is the clickable area for the Popconfirm */}
          <span onClick={(e) => e.stopPropagation()}>Cancel Booking</span>
        </Popconfirm>
      </Menu.Item>
    </StyledMenu>
  );

  return (
    <StyledTable
      columns={columns}
      dataSource={
        loading ? generateSkeletonData(pagination?.pageSize || 10) : data
      }
      rowKey={loading ? "key" : "id"}
      pagination={loading ? false : pagination}
      onChange={handleTableChange}
      scroll={{ x: 1300 }}
      loading={false}
    />
  );
};

export default DesktopActiveBookings;
