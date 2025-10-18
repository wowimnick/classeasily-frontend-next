import React from "react";
import styled from "styled-components";
import { Table, Tag, Space, Button, Dropdown, Menu } from "antd";
import {
  MoreVertical,
  Eye,
  MessageSquare,
  Calendar,
  Hash,
  Repeat,
  CheckCircle,
  XCircle,
} from "lucide-react";
import moment from "moment";
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";

// --- STYLES (Consistent with DesktopActiveBookings.jsx) ---

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
    font-size: 13px; /* Smaller font for better fit */
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
    padding: 16px 20px; /* Consistent padding */
    border-bottom: 1px solid #f1f5f9; /* Lighter border */
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
  width: 36px; /* Slightly larger */
  height: 36px; /* Slightly larger */
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
    color: #64748b; /* Consistent icon color */
  }
`;

const StyledTag = styled(Tag)`
  border-radius: 6px;
  padding: 5px 10px; /* Adjusted padding */
  font-weight: 600;
  font-size: 12px;
  line-height: 1;
  height: auto;
  text-transform: uppercase;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &.completed {
    background: #dcfce7; /* Light Green */
    color: #166534; /* Dark Green */
  }

  &.cancelled {
    background: #fee2e2; /* Light Red */
    color: #991b1b; /* Dark Red */
  }
`;

const StyledMenu = styled(Menu)`
  min-width: 180px;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1); /* Stronger shadow */
  border: 1px solid #f0f0f0;

  .ant-dropdown-menu-item {
    border-radius: 8px;
    padding: 10px 12px; /* Consistent padding */
    display: flex;
    align-items: center;
    gap: 10px; /* Increased gap */
    font-size: 14px;

    &:hover {
      background: #f8fafc;
    }

    .lucide {
      font-size: 16px;
      color: #64748b; /* Consistent icon color */
    }
  }

  .ant-dropdown-menu-item-danger {
    color: #ef4444 !important; /* Ensure danger color applies */

    &:hover {
      background: #fef2f2; /* Reddish hover */
    }
    .lucide {
      color: #ef4444; /* Danger icon color */
    }
  }
`;

const StudentInfo = styled.div`
  .name {
    font-weight: 500;
    color: #1e293b;
    margin-bottom: 2px;
    white-space: nowrap; /* Prevent wrapping */
  }

  .email {
    font-size: 13px;
    color: #64748b;
    white-space: nowrap; /* Prevent wrapping */
  }
`;

const ClassDetails = styled.div`
  .main-class {
    font-weight: 500;
    color: #1e293b;
    margin-bottom: 4px;
    white-space: nowrap; /* Prevent wrapping */
  }

  .option-name {
    font-size: 13px;
    color: #64748b;
    white-space: nowrap; /* Prevent wrapping */
  }
`;

const BookingTypeTag = styled(Tag)`
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent; /* Base border */

  &.single {
    background: #f1f5f9; /* Light gray */
    color: #475569; /* Dark gray */
    border-color: #cbd5e1;
  }

  &.course {
    background: #f0fdf4; /* Light green */
    color: #166534; /* Dark green */
    border-color: #86efac;
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

const BookingTypeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px; /* Increased gap */
`;

const DesktopBookingHistory = ({
  data,
  showViewDrawer,
  pagination,
  onChange,
  sortField,
  sortOrder,
  loading,
}) => {
  const sortableFields = {
    booking_reference: "user_facing_reference",
    student: "user_name",
    class_name: "schedule_instance__schedule__option__classId__title",
    booking_type: "enrollment_type",
    date: "schedule_instance__date",
    booked_on: "booking_date",
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
      title: "Reference",
      dataIndex: "user_facing_reference",
      key: "booking_reference",
      sorter: true,
      sortOrder: sortField === "user_facing_reference" ? sortOrder : null,
      width: 160,
    },
    {
      title: "Student",
      dataIndex: "user_name",
      key: "student",
      sorter: true,
      sortOrder: sortField === "user_name" ? sortOrder : null,
      render: (_, record) => (
        <StudentInfo>
          <div className="name">{record.user_name || "N/A"}</div>
          <div className="email">{record.user_email || "N/A"}</div>
        </StudentInfo>
      ),
      width: 220,
    },
    {
      title: "Class Details",
      dataIndex: "class_name",
      key: "class_name",
      sorter: true,
      sortOrder:
        sortField === "schedule_instance__schedule__option__classId__title"
          ? sortOrder
          : null,
      render: (text, record) => (
        <ClassDetails>
          <div className="main-class">{text || "N/A"}</div>
          <div className="option-name">{record.option_name || "N/A"}</div>
        </ClassDetails>
      ),
      width: 280,
    },
    {
      title: "Booking Type",
      dataIndex: "enrollment_type",
      key: "booking_type",
      render: (type, record) => getBookingTypeTag(type, record.session_info),
      width: 180,
    },
    {
      title: "Class Date",
      dataIndex: "date",
      key: "date",
      sorter: true,
      sortOrder: sortField === "schedule_instance__date" ? sortOrder : null,
      render: (_, record) => (
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
      ),
      width: 160,
    },
    {
      title: "Booked On",
      dataIndex: "booking_date",
      key: "booked_on",
      sorter: true,
      sortOrder: sortField === "booking_date" ? sortOrder : null,
      render: (date) => (date ? moment(date).format("MMM D, YYYY") : "N/A"),
      width: 130,
    },
    {
      title: "Spots",
      dataIndex: "participants",
      key: "participants",
      width: 100,
      align: "center",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: true,
      sortOrder: sortField === "status" ? sortOrder : null,
      render: (status) => {
        const statusLower = status?.toLowerCase();
        const icon =
          statusLower === "completed" ? (
            <CheckCircle size={12} />
          ) : statusLower === "cancelled" ? (
            <XCircle size={12} />
          ) : null;
        return (
          <StyledTag className={statusLower} icon={icon}>
            {status?.toUpperCase() || "N/A"}
          </StyledTag>
        );
      },
      width: 130,
      align: "center",
    },
    {
      title: "Actions",
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

  // Actions Menu for History (No Cancel action needed)
  const menu = (record) => (
    <StyledMenu>
      <Menu.Item
        key="1"
        icon={<Eye size={16} />}
        onClick={() => showViewDrawer(record)}
      >
        View Details
      </Menu.Item>
    </StyledMenu>
  );

  return (
    <StyledTable
      columns={columns}
      dataSource={data}
      rowKey="id"
      pagination={pagination}
      onChange={handleTableChange}
      scroll={{
        x: 1400,
      }} /* Adjusted scroll width for new column and padding */
      loading={{
        spinning: loading && data.length > 0,
        indicator: <GlobalLoaderWithInlineStyles />,
      }}
    />
  );
};

export default DesktopBookingHistory;
