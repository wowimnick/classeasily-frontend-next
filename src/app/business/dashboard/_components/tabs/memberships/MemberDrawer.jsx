"use client";

import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Table, Tag, Button, Space, Popconfirm, Typography, Divider } from "antd";
import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import { Mail, Calendar, CreditCard, Hash, X } from "lucide-react";
import message from "@/lib/message";
import { businessMembershipService } from "@/services/apiService";
import { MembershipTableViewWrapper, membershipColors } from "./membershipDashboardShared";
import { formatMemberStatusLabel, formatSourceLabel } from "./membershipFormatters";
import { MembershipDrawerTableSkeleton } from "./membershipSkeletons";

const { Text } = Typography;

const C = {
  accent: "#3b82f6",
  brand: "#ff385c",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  border: "#e5e7eb",
  white: "#ffffff",
  sidebarBg: "#f4f5f8",
};

const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;
const pulse = keyframes`0%,100%{background-position:200% 0} 50%{background-position:-200% 0}`;

const Skel = styled.div`
  height: ${(p) => p.$h || "14px"};
  width: ${(p) => p.$w || "100%"};
  border-radius: ${(p) => p.$r || "6px"};
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const Overlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const MobileShell = styled(Drawer.Content)`
  background: ${C.white} !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 24px 24px 0 0;
  height: 92%;
  max-height: 92vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
  isolation: isolate;
`;

const DesktopShell = styled(Drawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: min(560px, 100vw - 16px);
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: -4px 0 32px rgba(0, 0, 0, 0.14), 0 4px 24px rgba(0, 0, 0, 0.1);
  background: ${C.white} !important;
  isolation: isolate;
`;

const ThumbStrip = styled.div`
  flex-shrink: 0;
  background: #f1f5f9;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0 6px;
  border-bottom: 1px solid ${C.border};
`;

const DrawerHandle = styled(Drawer.Handle)`
  width: 40px;
  height: 5px;
  background: #cbd5e1;
  border-radius: 999px;
  margin: 0;
  flex-shrink: 0;
`;

const DrawerInner = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: ${C.white};
`;

const ScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: ${C.white};
`;

const RightHeader = styled.div`
  flex-shrink: 0;
  padding: 16px 20px;
  border-bottom: 1px solid ${C.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: ${C.white};
`;

const RightTitle = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: ${C.textPrimary};
`;

const CloseBtn = styled.button`
  background: ${C.sidebarBg};
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${C.textSecondary};
  flex-shrink: 0;
  &:hover {
    background: ${C.border};
    color: ${C.textPrimary};
  }
`;

const Hero = styled.div`
  padding: 20px 20px 16px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border-bottom: 1px solid ${membershipColors.border};
  animation: ${fadeIn} 0.3s ease-out;
`;

const HeroTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

const AvatarCircle = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  background: linear-gradient(135deg, ${membershipColors.primary} 0%, #ff6b8a 100%);
`;

const MemberName = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.25;
  margin-bottom: 6px;
`;

const EmailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 14px;
  margin-bottom: 10px;
  word-break: break-all;
`;

const Section = styled.section`
  padding: 20px;
  animation: ${fadeIn} 0.3s ease-out;
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 12px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCell = styled.div`
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid ${membershipColors.border};
`;

const InfoLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
  margin-bottom: 4px;
`;

const InfoValue = styled.div`
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
  line-height: 1.4;
`;

const Footer = styled.div`
  flex-shrink: 0;
  padding: 12px 16px;
  border-top: 1px solid ${C.border};
  background: ${C.white};
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  position: relative;
  z-index: 10;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.04);
`;

const LedgerCard = styled.div`
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid ${membershipColors.border};
  margin-bottom: 10px;
  background: #fff;
  &:last-child {
    margin-bottom: 0;
  }
`;

const LedgerRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 6px;
  color: ${C.textSecondary};
  &:last-child {
    margin-bottom: 0;
  }
`;

const statusColors = {
  active: "success",
  trialing: "processing",
  past_due: "warning",
  canceled: "default",
  paused: "default",
  pending_approval: "warning",
};

/** YYYY-MM-DD from the API is a calendar date; parsing as Date alone can shift the local day. */
function formatDrawerDate(value) {
  if (value == null || value === "") return "—";
  const s = typeof value === "string" ? value.trim() : "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const parts = s.split("-").map(Number);
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString();
  }
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString();
}

function formatPaymentPeriodRange(row) {
  const a = row.period_start;
  const b = row.period_end;
  if (!a && !b) return "—";
  if (a && b) return `${formatDrawerDate(a)} – ${formatDrawerDate(b)}`;
  return formatDrawerDate(a || b);
}

export default function MemberDrawer({ memberId, open, onClose, onUpdated, products = [] }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
    } else {
      const t = setTimeout(() => setShouldRender(false), 280);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !memberId) {
      setMember(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    businessMembershipService.getMember(memberId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.success) setMember(res.data);
      else message.error(res.error || "Failed to load member");
    });
    return () => {
      cancelled = true;
    };
  }, [open, memberId]);

  const handleCancel = async (immediate) => {
    setActioning(true);
    const res = await businessMembershipService.cancelMember(memberId, immediate);
    setActioning(false);
    if (res.success) {
      message.success(immediate ? "Membership canceled" : "Set to cancel at period end");
      onUpdated?.();
      if (res.data) setMember(res.data);
    } else message.error(res.error || "Failed to cancel");
  };

  const canCancel = member && !["canceled", "paused"].includes(member.status);

  const ledgerColumns = [
    {
      title: "Period start",
      dataIndex: "period_start",
      key: "period_start",
      render: (d) => formatDrawerDate(d),
    },
    { title: "Credits used", dataIndex: "credits_used", key: "credits_used" },
    { title: "Action", dataIndex: "action", key: "action" },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (d) => (d ? new Date(d).toLocaleString() : "—"),
    },
  ];
  const paymentColumns = [
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (a) => (a != null ? `$${a}` : "—"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => <Tag style={{ borderRadius: 6 }}>{s}</Tag>,
    },
    {
      title: "Period",
      key: "period",
      render: (_, r) => formatPaymentPeriodRange(r),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (d) => (d ? new Date(d).toLocaleString() : "—"),
    },
  ];

  const initial = (member?.name || member?.email || "?").charAt(0).toUpperCase();

  const renderLedgerMobile = (rows) =>
    rows.map((row) => (
      <LedgerCard key={row.id || row.created_at}>
        <LedgerRow>
          <span>Period</span>
          <span style={{ color: C.textPrimary, fontWeight: 500 }}>
            {formatDrawerDate(row.period_start)}
          </span>
        </LedgerRow>
        <LedgerRow>
          <span>Credits used</span>
          <span style={{ color: C.textPrimary }}>{row.credits_used ?? "—"}</span>
        </LedgerRow>
        <LedgerRow>
          <span>Action</span>
          <span>{row.action ?? "—"}</span>
        </LedgerRow>
      </LedgerCard>
    ));

  const renderPaymentsMobile = (rows) =>
    rows.map((row) => (
      <LedgerCard key={row.id || row.created_at}>
        <LedgerRow>
          <span>Amount</span>
          <span style={{ fontWeight: 600 }}>{row.amount != null ? `$${row.amount}` : "—"}</span>
        </LedgerRow>
        <LedgerRow>
          <span>Period</span>
          <span style={{ color: C.textPrimary, fontWeight: 500 }}>{formatPaymentPeriodRange(row)}</span>
        </LedgerRow>
        <LedgerRow>
          <span>Status</span>
          <span>{row.status ?? "—"}</span>
        </LedgerRow>
        <LedgerRow>
          <span>Date</span>
          <span>{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</span>
        </LedgerRow>
      </LedgerCard>
    ));

  const renderMainContent = () => {
    if (loading) {
      return (
        <ScrollArea>
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
              <Skel $w="56px" $h="56px" $r="16px" />
              <div style={{ flex: 1 }}>
                <Skel $h="20px" $w="65%" $r="4px" style={{ marginBottom: 10 }} />
                <Skel $h="14px" $w="85%" $r="4px" style={{ marginBottom: 12 }} />
                <Skel $h="24px" $w="120px" $r="8px" />
              </div>
            </div>
            <Skel $h="11px" $w="40%" $r="4px" style={{ marginBottom: 14 }} />
            <InfoGrid style={{ marginBottom: 8 }}>
              <Skel $h="72px" $r="12px" />
              <Skel $h="72px" $r="12px" />
            </InfoGrid>
            <SectionLabel style={{ marginTop: 20 }}>Credit history</SectionLabel>
            <MembershipDrawerTableSkeleton rows={3} />
          </div>
        </ScrollArea>
      );
    }
    if (!member) {
      return null;
    }

    const payments = Array.isArray(member.payments) ? member.payments : [];
    const ltv = payments.reduce((sum, p) => sum + (parseFloat(String(p.amount), 10) || 0), 0);
    const lastPayment = payments.length ? payments[0] : null;

    const statusLabel = formatMemberStatusLabel(member.status);

    return (
      <ScrollArea>
        <Hero>
          <HeroTop>
            <AvatarCircle>{initial}</AvatarCircle>
            <div style={{ minWidth: 0 }}>
              <MemberName>{member.name || "Member"}</MemberName>
              <EmailRow>
                <Mail size={16} style={{ flexShrink: 0, opacity: 0.7 }} />
                <span>{member.email || "—"}</span>
              </EmailRow>
              <Space wrap size={[8, 8]}>
                {statusLabel && (
                  <Tag color={statusColors[member.status] || "default"} style={{ margin: 0, borderRadius: 8, padding: "2px 10px" }}>
                    {statusLabel}
                  </Tag>
                )}
                {member.product_name && (
                  <Tag style={{ margin: 0, borderRadius: 8, padding: "2px 10px" }}>{member.product_name}</Tag>
                )}
              </Space>
            </div>
          </HeroTop>
        </Hero>

        <Section>
          <SectionLabel>Subscription</SectionLabel>
          <InfoGrid>
            <InfoCell>
              <InfoLabel>
                <Calendar size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Period start
              </InfoLabel>
              <InfoValue>{formatDrawerDate(member.current_period_start)}</InfoValue>
            </InfoCell>
            <InfoCell>
              <InfoLabel>
                <Calendar size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Period end
              </InfoLabel>
              <InfoValue>{formatDrawerDate(member.current_period_end)}</InfoValue>
            </InfoCell>
            {member.credits_remaining != null && (
              <InfoCell style={{ gridColumn: "1 / -1" }}>
                <InfoLabel>
                  <CreditCard size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Credits remaining
                </InfoLabel>
                <InfoValue>
                  {member.credits_remaining}
                  {member.credit_allowance != null ? ` / ${member.credit_allowance}` : ""}
                  {(member.credit_unit || "").trim() ? ` ${(member.credit_unit || "").trim()}` : ""}
                </InfoValue>
              </InfoCell>
            )}
            <InfoCell>
              <InfoLabel>
                <Hash size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Source
              </InfoLabel>
              <InfoValue>{formatSourceLabel(member.source)}</InfoValue>
            </InfoCell>
            <InfoCell>
              <InfoLabel>Lifetime paid (est.)</InfoLabel>
              <InfoValue>{payments.length ? `$${ltv.toFixed(2)}` : "—"}</InfoValue>
            </InfoCell>
            <InfoCell>
              <InfoLabel>Next renewal</InfoLabel>
              <InfoValue>{formatDrawerDate(member.current_period_end)}</InfoValue>
            </InfoCell>
            {lastPayment ? (
              <InfoCell style={{ gridColumn: "1 / -1" }}>
                <InfoLabel>Last invoice</InfoLabel>
                <InfoValue>
                  {(lastPayment.status || "—").toString()} · $
                  {lastPayment.amount != null ? lastPayment.amount : "—"}
                </InfoValue>
              </InfoCell>
            ) : null}
          </InfoGrid>
          {member.notes ? (
            <>
              <Divider style={{ margin: "20px 0 12px" }} />
              <Text type="secondary" style={{ fontSize: 13 }}>
                {member.notes}
              </Text>
            </>
          ) : null}
        </Section>

        {member.custom_data && typeof member.custom_data === "object" && Object.keys(member.custom_data).length > 0 && (
          <Section style={{ paddingTop: 0 }}>
            <SectionLabel>Signup responses</SectionLabel>
            <InfoGrid>
              {(() => {
                const product = products.find((p) => p.id === member.product_id);
                const signupFields = Array.isArray(product?.signup_fields) ? product.signup_fields : [];
                const labelForKey = (key) => signupFields.find((f) => f.key === key)?.label || key;
                return Object.entries(member.custom_data).map(([key, value]) => (
                  <InfoCell key={key} style={{ gridColumn: "1 / -1" }}>
                    <InfoLabel>{labelForKey(key)}</InfoLabel>
                    <InfoValue>{value === true || value === false ? String(value) : (value ?? "—")}</InfoValue>
                  </InfoCell>
                ));
              })()}
            </InfoGrid>
          </Section>
        )}

        {Array.isArray(member.ledger) && member.ledger.length > 0 && (
          <Section style={{ paddingTop: 8 }}>
            <SectionLabel>Credit history</SectionLabel>
            {isMobile ? (
              renderLedgerMobile(member.ledger)
            ) : (
              <MembershipTableViewWrapper>
                <Table size="small" rowKey="id" columns={ledgerColumns} dataSource={member.ledger} pagination={false} />
              </MembershipTableViewWrapper>
            )}
          </Section>
        )}

        {Array.isArray(member.payments) && member.payments.length > 0 && (
          <Section style={{ paddingTop: 8 }}>
            <SectionLabel>Payment history</SectionLabel>
            {isMobile ? (
              renderPaymentsMobile(member.payments)
            ) : (
              <MembershipTableViewWrapper>
                <Table size="small" rowKey="id" columns={paymentColumns} dataSource={member.payments} pagination={false} />
              </MembershipTableViewWrapper>
            )}
          </Section>
        )}
      </ScrollArea>
    );
  };

  const renderFooter = () => {
    if (loading || !member) return null;
    if (!canCancel) return null;
    return (
      <Footer>
        {canCancel && (
          <>
            <Popconfirm
              title="Cancel at period end?"
              description="The member will keep access until the current period ends."
              onConfirm={() => handleCancel(false)}
              okText="Cancel at period end"
              cancelText="No"
            >
              <Button loading={actioning}>Cancel at period end</Button>
            </Popconfirm>
            <Popconfirm title="Cancel immediately?" onConfirm={() => handleCancel(true)} okText="Cancel now" cancelText="No">
              <Button danger loading={actioning}>
                Cancel now
              </Button>
            </Popconfirm>
          </>
        )}
      </Footer>
    );
  };

  if (!shouldRender) return null;

  const inner = (
    <DrawerInner>
      <RightHeader>
        <RightTitle>Member details</RightTitle>
        <CloseBtn type="button" onClick={onClose} aria-label="Close">
          <X size={18} />
        </CloseBtn>
      </RightHeader>
      {renderMainContent()}
      {renderFooter()}
    </DrawerInner>
  );

  return isMobile ? (
    <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()} snapPoints={[1]} activeSnapPoint={1} dismissible>
      <Drawer.Portal>
        <Overlay />
        <MobileShell>
          <ThumbStrip>
            <DrawerHandle />
          </ThumbStrip>
          {inner}
        </MobileShell>
      </Drawer.Portal>
    </Drawer.Root>
  ) : (
    <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()} direction="right" dismissible handleOnly>
      <Drawer.Portal>
        <Overlay />
        <DesktopShell style={{ "--initial-transform": "calc(100% + 8px)" }}>{inner}</DesktopShell>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
