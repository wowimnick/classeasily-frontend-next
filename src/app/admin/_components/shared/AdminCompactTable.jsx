"use client";

import styled from "styled-components";
import { Table } from "antd";

/** Matches Bookings & Payments → Payments: dense headers + readable body rows */
export const ADMIN_COMPACT_TABLE_BORDER = "#f1f5f9";

export const AdminCompactTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: #fafbfc;
    border-bottom: 1px solid ${ADMIN_COMPACT_TABLE_BORDER};
    font-weight: 600;
    color: #64748b;
    font-size: 11px;
    padding: 10px 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .ant-table-thead > tr > th::before {
    display: none;
  }
  .ant-table-tbody > tr > td {
    padding: 10px 14px;
    border-bottom: 1px solid ${ADMIN_COMPACT_TABLE_BORDER};
    font-size: 13px;
  }
  .ant-table-tbody > tr:hover > td {
    background: #fafcff;
  }
  .ant-table-tbody > tr.ant-table-placeholder:hover > td {
    background: transparent;
  }
  .ant-empty {
    padding: 40px 20px;
  }
`;
