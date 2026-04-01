"use client";

import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Alert, Button, Form, Input, Modal, Table, Tag, Typography, message } from "antd";
import { UsergroupAddOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { businessService } from "@/services/apiService";
import MarketingFeatureUpsell from "./MarketingFeatureUpsell";
import {
  Panel,
  MarketingSection,
  MarketingTableSection,
  MarketingStyledTable,
  MarketingEmptyState,
} from "./marketingLayout";
import { Skel, generateMarketingTableSkeletonRows } from "./marketingSkeletons";
import { getAudienceOptions, getAudienceOption, AUDIENCE_TYPES } from "./marketingAudienceConfig";
import AudienceFields from "./AudienceFields";

const { Text } = Typography;

const AudienceTypeSelect = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const TypeCard = styled.button`
  text-align: left;
  padding: 10px 14px;
  border: 2px solid ${(p) => (p.$active ? "#6366f1" : "#e5e7eb")};
  border-radius: 10px;
  background: ${(p) => (p.$active ? "#f5f3ff" : "#fff")};
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  &:hover {
    border-color: #6366f1;
  }
`;

const TypeLabel = styled.span`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => (p.$active ? "#4338ca" : "#374151")};
`;

const TypeHelp = styled.span`
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
  line-height: 1.4;
`;

export default function AudiencesMarketingPanel({ tier, onSegmentsChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [audienceType, setAudienceType] = useState(AUDIENCE_TYPES.ALL_CONTACTS);
  const [audienceFilter, setAudienceFilter] = useState({});
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [facets, setFacets] = useState(null);

  const options = getAudienceOptions(tier);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, f] = await Promise.all([
        businessService.listMarketingSegments(),
        businessService.getMarketingAudienceFacets(),
      ]);
      if (r.success) setRows(Array.isArray(r.data) ? r.data : []);
      else setRows([]);
      if (f.success) setFacets(f.data);
    } catch (e) {
      message.error(e?.message || "Could not load audiences.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tier?.saved_segments_enabled) load();
  }, [load, tier?.saved_segments_enabled]);

  const openModal = () => {
    setName("");
    setAudienceType(AUDIENCE_TYPES.ALL_CONTACTS);
    setAudienceFilter({});
    setPreview(null);
    setPreviewError(null);
    setOpen(true);
  };

  const runPreview = async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    const r = await businessService.previewMarketingAudience({
      audience_type: audienceType,
      audience_filter: audienceFilter,
    });
    setPreviewLoading(false);
    if (r.success) setPreview(r.data);
    else {
      setPreview(null);
      setPreviewError(r.error || "Preview failed");
    }
  };

  const saveSegment = async () => {
    if (!name.trim()) {
      message.error("Give this audience a name.");
      return;
    }
    setSaving(true);
    const r = await businessService.createMarketingSegment({
      name: name.trim(),
      audience_type: audienceType,
      audience_filter: audienceFilter,
    });
    setSaving(false);
    if (r.success) {
      message.success("Saved audience.");
      setOpen(false);
      load();
      onSegmentsChanged?.();
    } else message.error(r.error);
  };

  if (!tier?.saved_segments_enabled) {
    return (
      <Panel>
        <MarketingFeatureUpsell
          title="Saved audiences"
          minPlanLabel="Growth"
          bullets={[
            "Save segment rules and reuse them in campaigns",
            "Preview contact counts before you send",
            "Match on booking channel, classes, and more on Growth+",
          ]}
        />
      </Panel>
    );
  }

  const tableData = loading ? generateMarketingTableSkeletonRows(6) : rows;
  const showEmpty = !loading && rows.length === 0;

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (v, row) =>
        row.__skeleton ? (
          <div>
            <Skel $h="14px" $w="65%" $r="4px" />
            <Skel $h="20px" $w="120px" $r="8px" style={{ marginTop: 8 }} />
          </div>
        ) : (
          <div>
            <Text strong style={{ display: "block" }}>
              {v}
            </Text>
            <Tag style={{ marginTop: 4, fontSize: 11 }}>
              {getAudienceOption(row.audience_type)?.label || row.audience_type}
            </Tag>
          </div>
        ),
    },
    {
      title: "",
      key: "del",
      width: 80,
      align: "right",
      render: (_, row) =>
        row.__skeleton ? (
          <Skel $h="22px" $w="52px" $r="4px" style={{ marginLeft: "auto" }} />
        ) : (
          <Button
            type="link"
            danger
            size="small"
            onClick={() => {
              Modal.confirm({
                title: "Delete this audience?",
                content: "This cannot be undone.",
                okText: "Delete",
                okButtonProps: { danger: true },
                onOk: async () => {
                  const r = await businessService.deleteMarketingSegment(row.id);
                  if (r.success) {
                    message.success("Deleted.");
                    load();
                    onSegmentsChanged?.();
                  } else message.error(r.error);
                },
              });
            }}
          >
            Delete
          </Button>
        ),
    },
  ];

  return (
    <Panel>
      <MarketingSection
        title="Saved audiences"
        description="Build reusable contact segments based on booking history or booking channel."
        action={
          <Button type="primary" icon={<UsergroupAddOutlined />} onClick={openModal}>
            New audience
          </Button>
        }
      >
        <MarketingTableSection
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ padding: showEmpty ? 0 : 20 }}
        >
          {showEmpty ? (
            <MarketingEmptyState
              title="No saved audiences yet"
              subtitle="Define who you want to reach and reuse the same rules in campaigns. Use New audience above."
            />
          ) : (
            <MarketingStyledTable
              size="small"
              rowKey={(r) => r.id}
              loading={false}
              dataSource={tableData}
              pagination={false}
              columns={columns}
              locale={{ emptyText: "No audiences" }}
            />
          )}
        </MarketingTableSection>
      </MarketingSection>

      <Modal
        title="New saved audience"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item label="Audience name" required style={{ marginBottom: 16 }}>
            <Input
              placeholder="e.g. Loyal bookers, New sign-ups…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Item>

          <Form.Item label="Match rule" style={{ marginBottom: 12 }}>
            <AudienceTypeSelect>
              {options.map((opt) => (
                <TypeCard
                  key={opt.value}
                  type="button"
                  $active={audienceType === opt.value}
                  onClick={() => {
                    setAudienceType(opt.value);
                    setAudienceFilter({});
                    setPreview(null);
                    setPreviewError(null);
                  }}
                >
                  <TypeLabel $active={audienceType === opt.value}>{opt.label}</TypeLabel>
                  <TypeHelp>{opt.help}</TypeHelp>
                </TypeCard>
              ))}
            </AudienceTypeSelect>
          </Form.Item>

          {audienceType !== AUDIENCE_TYPES.ALL_CONTACTS && (
            <Form.Item style={{ marginBottom: 12 }}>
              <AudienceFields
                audienceType={audienceType}
                audienceFilter={audienceFilter}
                onFilterChange={(patch) => {
                  setAudienceFilter((prev) => ({ ...prev, ...patch }));
                  setPreview(null);
                }}
                facets={facets}
                segments={[]}
              />
            </Form.Item>
          )}

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <motion.span whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
              <Button
                onClick={runPreview}
                loading={previewLoading}
                key={`preview-${previewLoading}`}
              >
                Preview count
              </Button>
            </motion.span>
            {preview && !previewError && (
              <motion.div
                key={preview.count}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.22 }}
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#059669",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <NumberFlow value={Number(preview.count) || 0} />
                </span>
                <span style={{ fontSize: 12, color: "#047857" }}>contacts</span>
              </motion.div>
            )}
            {previewError && (
              <Alert type="error" showIcon message={previewError} style={{ flex: 1 }} />
            )}
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" loading={saving} key={`aud-save-${saving}`} onClick={saveSegment}>
              Save audience
            </Button>
          </div>
        </Form>
      </Modal>
    </Panel>
  );
}
