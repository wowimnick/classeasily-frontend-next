"use client";

import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Button, Card, Dropdown, Modal, Typography, message } from "antd";
import { MoreHorizontal, FileText } from "lucide-react";
import { businessService } from "@/services/apiService";
import {
  Panel,
  MarketingSection,
  MarketingTableSection,
  MarketingEmptyState,
} from "./marketingLayout";
import { TemplateGridSkeleton } from "./marketingSkeletons";
import TemplateEditorScreen from "./TemplateEditorScreen";

const { Text } = Typography;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
`;

const CardMeta = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export default function TemplatesMarketingPanel({ tier }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await businessService.listMarketingTemplates();
    if (r.success) setRows(Array.isArray(r.data) ? r.data : []);
    else setRows([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => setEditingId("new");
  const openEdit = (id) => setEditingId(id);
  const closeEditor = () => {
    setEditingId(null);
    load();
  };

  if (editingId) {
    return (
      <Panel>
        <TemplateEditorScreen templateId={editingId} tier={tier} onBack={closeEditor} />
      </Panel>
    );
  }

  return (
    <Panel>
      <MarketingSection
        title="Email templates"
        description={`${rows.length} saved${tier?.max_saved_templates != null ? ` · limit ${tier.max_saved_templates}` : ""}`}
        action={
          <Button type="primary" onClick={openNew}>
            New template
          </Button>
        }
      >
        <MarketingTableSection
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ padding: loading || rows.length > 0 ? 20 : 0 }}
        >
          {loading ? (
            <TemplateGridSkeleton count={4} />
          ) : rows.length === 0 ? (
            <MarketingEmptyState
              title="No templates yet"
              subtitle="Save reusable layouts and copy. Use New template above to build one with the visual editor or HTML."
            />
          ) : (
            <TemplateGrid>
              {rows.map((row) => (
                <Card
                  key={row.id}
                  size="small"
                  style={{ borderRadius: 12, border: "1px solid #e5e7eb" }}
                  styles={{ body: { padding: 16 } }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openEdit(row.id);
                      }
                    }}
                    onClick={() => openEdit(row.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}
                    >
                      <div style={{ display: "flex", gap: 10, minWidth: 0, flex: 1 }}>
                        <FileText size={22} color="#6366f1" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div style={{ minWidth: 0 }}>
                          <Text strong style={{ display: "block" }}>
                            {row.name || "Untitled"}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {row.content_type === "builder_json" ? "Visual builder" : "HTML"}
                          </Text>
                        </div>
                      </div>
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: "edit",
                              label: "Edit",
                              onClick: () => openEdit(row.id),
                            },
                            {
                              key: "del",
                              label: "Delete",
                              danger: true,
                              onClick: () => {
                                Modal.confirm({
                                  title: "Delete this template?",
                                  content: "This cannot be undone.",
                                  okText: "Delete",
                                  okButtonProps: { danger: true },
                                  onOk: async () => {
                                    const r = await businessService.deleteMarketingTemplate(row.id);
                                    if (r.success) {
                                      message.success("Deleted.");
                                      load();
                                    } else message.error(r.error);
                                  },
                                });
                              },
                            },
                          ],
                        }}
                        trigger={["click"]}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreHorizontal size={18} />}
                          aria-label="More actions"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                    <CardMeta>{row.subject || "No subject line"}</CardMeta>
                  </div>
                </Card>
              ))}
            </TemplateGrid>
          )}
        </MarketingTableSection>
      </MarketingSection>
    </Panel>
  );
}
