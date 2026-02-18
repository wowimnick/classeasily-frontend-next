"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Empty, ConfigProvider } from "antd";
import { MessageSquare, ChevronRight } from "lucide-react";
import styled from "styled-components";
import { motion } from "framer-motion";
import ExploreHeader from "@/components/explore/ExploreHeader";
import { conversationService } from "@/services/apiService";
import { theme as globalTheme } from "@/components/theme";
import FooterClient from "@/components/homepage/FooterClient";

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
  margin-bottom: 28px;
  h1 {
    font-size: 26px;
    font-weight: 700;
    color: #334155;
    margin: 0 0 4px;
  }
  p {
    font-size: 14px;
    color: #717171;
    margin: 0;
  }
`;

const ListCard = styled(motion.div)`
  border: 1px solid #ebebeb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
`;

const ConversationRow = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  cursor: pointer;
  border-bottom: 1px solid #ebebeb;
  transition: background 0.15s ease;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: #f7f7f7;
  }
  @media (max-width: 640px) {
    padding: 16px;
    gap: 12px;
  }
`;

const RowMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const BusinessName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 4px;
`;

const Preview = styled.div`
  font-size: 13px;
  color: #717171;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const RowMeta = styled.div`
  font-size: 12px;
  color: #a3a3a3;
  margin-top: 4px;
`;

const ChevronWrap = styled.div`
  color: #717171;
  flex-shrink: 0;
`;

const formatTime = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function MyMessagesContent() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    setLoading(true);
    const result = await conversationService.getList();
    if (result.success) setConversations(result.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <ConfigProvider theme={globalTheme}>
      <PageWrapper>
        <ExploreHeader showOptionsWrapper={false} />
        <PageContainer>
          <HeaderSection>
            <h1>Messages</h1>
            <p>Your conversations with hosts</p>
          </HeaderSection>

          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#717171" }}>
              Loading…
            </div>
          ) : conversations.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No messages yet"
              style={{ padding: "48px 24px" }}
            >
              <p style={{ color: "#717171", fontSize: 14 }}>
                When you book a class, you can message the host from your booking or from here.
              </p>
            </Empty>
          ) : (
            <ListCard>
              {conversations.map((c) => (
                <ConversationRow
                  key={c.id}
                  onClick={() => router.push(`/my-messages/${c.id}`)}
                  whileHover={{ x: 2 }}
                >
                  <div style={{ fontSize: 24, color: "#ff3562" }}>
                    <MessageSquare size={28} />
                  </div>
                  <RowMain>
                    <BusinessName>{c.business_name || "Host"}</BusinessName>
                    {(c.class_title || c.booking_reference) && (
                      <RowMeta>
                        {[c.class_title, c.booking_reference].filter(Boolean).join(" · ")}
                      </RowMeta>
                    )}
                    {c.last_message_preview && (
                      <Preview>{c.last_message_preview}</Preview>
                    )}
                  </RowMain>
                  <div style={{ fontSize: 12, color: "#a3a3a3", flexShrink: 0 }}>
                    {formatTime(c.last_message_at || c.created_at)}
                  </div>
                  <ChevronWrap>
                    <ChevronRight size={20} />
                  </ChevronWrap>
                </ConversationRow>
              ))}
            </ListCard>
          )}
        </PageContainer>
        <FooterClient />
      </PageWrapper>
    </ConfigProvider>
  );
}
