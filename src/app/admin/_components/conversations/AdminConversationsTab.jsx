"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Empty, ConfigProvider, Input, Select, Button, Typography, Skeleton, Grid } from "antd";
import {
  MessageSquare,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  Mail,
  Search,
  RefreshCw,
} from "lucide-react";
import { adminConversationsService, businessManagementService } from "@/services/adminDash";
import { theme as globalTheme } from "@/components/theme";
import message from "@/lib/message";
import AdminResponsiveDrawer from "../shared/AdminResponsiveDrawer";

const { Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  lightBg: "#f8fafc",
  border: "#f1f5f9",
  textPrimary: "#334155",
  textSecondary: "#64748b",
};

// --- Layout ---
const PageWrap = styled.div`
  padding: 24px;
  min-height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
`;

const PageTitle = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 2px 0;
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;

const ListCard = styled.div`
  border: 1px solid ${colors.border};
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
`;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid ${colors.border};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  cursor: pointer;
  border-bottom: 1px solid ${colors.border};
  transition: background 0.12s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${colors.lightBg};
  }

  @media (max-width: 640px) {
    padding: 12px 16px;
    gap: 10px;
  }
`;

const RowMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const GuestName = styled.div`
  font-size: 13.5px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 2px;
`;

const Preview = styled.div`
  font-size: 12.5px;
  color: ${colors.textSecondary};
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const RowMeta = styled.div`
  font-size: 11px;
  color: #a3a3a3;
  margin-top: 2px;
`;

const IconBadge = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 53, 98, 0.08);
  color: ${colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

// --- Drawer Panel ---
const PanelHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${colors.border};
  flex-shrink: 0;
`;

const PanelTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 2px;
`;

const PanelSub = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
`;

const AdminActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid ${colors.border};
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  background: ${colors.lightBg};
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
`;

const MsgRow = styled.div`
  display: flex;
  justify-content: ${(p) => (p.$isBusiness ? "flex-end" : "flex-start")};
`;

const Bubble = styled.div`
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 13.5px;
  line-height: 1.5;

  ${(p) =>
    p.$isBusiness
      ? `background: ${colors.primary}; color: #fff; border-bottom-right-radius: 4px;`
      : `background: #fff; color: ${colors.textPrimary}; border: 1px solid ${colors.border}; border-bottom-left-radius: 4px;`}
`;

const MsgTime = styled.div`
  font-size: 11px;
  margin-top: 4px;
  color: ${(p) => (p.$isBusiness ? "rgba(255,255,255,0.65)" : "#a3a3a3")};
`;

const formatTime = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export default function AdminConversationsTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [businessFilter, setBusinessFilter] = useState(undefined);
  const [businesses, setBusinesses] = useState([]);
  const [search, setSearch] = useState("");
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchList = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (businessFilter) params.business_id = businessFilter;
    const result = await adminConversationsService.getList(params);
    if (result.success) setList(result.data || []);
    setLoading(false);
  }, [businessFilter]);

  const fetchBusinesses = useCallback(async () => {
    const res = await businessManagementService.getBusinesses();
    if (res.success && Array.isArray(res.data?.results)) setBusinesses(res.data.results);
    else if (res.success && Array.isArray(res.data)) setBusinesses(res.data);
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const fetchDetail = useCallback(async (id) => {
    if (!id) return;
    const result = await adminConversationsService.getDetail(id);
    if (result.success) setSelected(result.data);
  }, []);

  const openConversation = (conv) => {
    setSelected(conv);
    setOpen(true);
    fetchDetail(conv.id);
  };

  const closeConversation = () => setOpen(false);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => message.success(`${label} copied`),
      () => message.error("Copy failed")
    );
  };

  const getBusinessMessagesUrl = () => {
    if (!selected?.id) return null;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/business/dashboard/messages?conversation_id=${selected.id}`;
  };

  const copyConversationAsText = () => {
    if (!selected?.messages?.length) {
      message.info("No messages to copy");
      return;
    }
    const lines = (selected.messages || []).map((m) => {
      const from = m.sender_type === "business" ? "Business" : (selected.booker_display || "Guest");
      const time = formatTime(m.created_at);
      return `[${time}] ${from}: ${(m.text || "").replace(/\n/g, " ")}`;
    });
    copyToClipboard(lines.join("\n"), "Conversation");
  };

  const filteredList = list.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.booker_display || "").toLowerCase().includes(q) ||
      (c.booker_email || "").toLowerCase().includes(q)
    );
  });

  const drawerContent = selected && (
    <>
      <PanelHeader>
        <div style={{ flex: 1, minWidth: 0 }}>
          <PanelTitle>{selected.booker_display || "Guest"}</PanelTitle>
          {selected.booker_email && <PanelSub>{selected.booker_email}</PanelSub>}
          {(selected.class_title || selected.booking_reference) && (
            <PanelSub>{[selected.class_title, selected.booking_reference].filter(Boolean).join(" · ")}</PanelSub>
          )}
          <AdminActionsRow>
            {selected.booker_email && (
              <Button size="small" icon={<Mail size={13} />} onClick={() => copyToClipboard(selected.booker_email, "Email")} style={{ borderRadius: 6, fontSize: 12 }}>
                Copy email
              </Button>
            )}
            {getBusinessMessagesUrl() && (
              <Button
                size="small"
                icon={<ExternalLink size={13} />}
                href={getBusinessMessagesUrl()}
                target="_blank"
                rel="noopener noreferrer"
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                Business dashboard
              </Button>
            )}
            {selected.booking && (
              <Button
                size="small"
                icon={<FileText size={13} />}
                href={`/admin/all-bookings?booking_id=${selected.booking}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                View booking
              </Button>
            )}
            <Button size="small" icon={<Copy size={13} />} onClick={copyConversationAsText} style={{ borderRadius: 6, fontSize: 12 }}>
              Copy text
            </Button>
          </AdminActionsRow>
        </div>
      </PanelHeader>
      <MessagesArea>
        {(selected.messages || []).length === 0 ? (
          <Empty description="No messages" style={{ margin: "auto" }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          (selected.messages || []).map((msg) => (
            <MsgRow key={msg.id} $isBusiness={msg.sender_type === "business"}>
              <Bubble $isBusiness={msg.sender_type === "business"}>
                <div>{msg.text}</div>
                <MsgTime $isBusiness={msg.sender_type === "business"}>{formatTime(msg.created_at)}</MsgTime>
              </Bubble>
            </MsgRow>
          ))
        )}
      </MessagesArea>
    </>
  );

  return (
    <ConfigProvider theme={globalTheme}>
      <PageWrap>
        <DashboardHeader>
          <div>
            <PageTitle>Conversations</PageTitle>
            <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
              Guest–business messages (read-only admin view)
            </div>
          </div>
          <Button
            icon={<RefreshCw size={14} />}
            onClick={fetchList}
            loading={loading}
            style={{ borderRadius: 8 }}
          >
            {!isMobile && "Refresh"}
          </Button>
        </DashboardHeader>

        <FiltersRow>
          <Input
            prefix={<Search size={13} style={{ color: colors.textSecondary }} />}
            placeholder="Search guest name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 240, borderRadius: 8, fontSize: 13 }}
          />
          <Select
            placeholder="All businesses"
            allowClear
            value={businessFilter}
            onChange={setBusinessFilter}
            style={{ minWidth: 200 }}
          >
            {businesses.map((b) => (
              <Option key={b.businessId} value={b.businessId}>
                {b.businessName || `Business #${b.businessId}`}
              </Option>
            ))}
          </Select>
          <div style={{ marginLeft: "auto", fontSize: 12, color: colors.textSecondary }}>
            {filteredList.length} conversation{filteredList.length !== 1 ? "s" : ""}
          </div>
        </FiltersRow>

        {loading ? (
          <ListCard>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ padding: "14px 20px", borderBottom: `1px solid ${colors.border}` }}>
                <Skeleton active paragraph={{ rows: 1 }} title={{ width: "40%" }} />
              </div>
            ))}
          </ListCard>
        ) : filteredList.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No conversations found"
            style={{ padding: "48px 24px" }}
          />
        ) : (
          <ListCard>
            <ListHeader>
              <Text style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>
                All Conversations
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {filteredList.length} total
              </Text>
            </ListHeader>
            {filteredList.map((c) => (
              <Row key={c.id} onClick={() => openConversation(c)}>
                <IconBadge>
                  <MessageSquare size={18} />
                </IconBadge>
                <RowMain>
                  <GuestName>{c.booker_display || "Guest"}</GuestName>
                  {(c.class_title || c.booking_reference) && (
                    <RowMeta>
                      {[c.class_title, c.booking_reference].filter(Boolean).join(" · ")}
                    </RowMeta>
                  )}
                  {c.last_message_preview && (
                    <Preview>{c.last_message_preview}</Preview>
                  )}
                </RowMain>
                <div style={{ fontSize: 11, color: "#a3a3a3", flexShrink: 0 }}>
                  {formatTime(c.last_message_at || c.created_at)}
                </div>
                <ChevronRight size={16} color={colors.textSecondary} />
              </Row>
            ))}
          </ListCard>
        )}

        <AdminResponsiveDrawer
          open={open && !!selected}
          onClose={closeConversation}
          title={selected?.booker_display || "Conversation"}
          titleIcon={<MessageSquare size={16} color={colors.primary} />}
          isMobile={isMobile}
          width="520px"
        >
          {drawerContent}
        </AdminResponsiveDrawer>
      </PageWrap>
    </ConfigProvider>
  );
}
