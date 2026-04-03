"use client";

import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Alert, Button, Checkbox, Form, Input, Modal, Table, Tag, Typography, message } from "antd";
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
import { campaignAudienceToApi } from "./marketingAudiencePayload";

const { Text } = Typography;

const AudienceTypeSelect = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const TypeRow = styled.label`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  border: 1px solid ${(p) => (p.$on ? "#6366f1" : "#e5e7eb")};
  border-radius: 10px;
  background: ${(p) => (p.$on ? "#f5f3ff" : "#fff")};
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  margin: 0;
  &:hover {
    border-color: #a5b4fc;
  }
`;

const TypeLabel = styled.span`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => (p.$on ? "#4338ca" : "#374151")};
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
  const [selectedTypes, setSelectedTypes] = useState([AUDIENCE_TYPES.ALL_CONTACTS]);
  const [filterByType, setFilterByType] = useState({});
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

  const toggleType = (value) => {
    setPreview(null);
    setPreviewError(null);
    if (value === AUDIENCE_TYPES.ALL_CONTACTS) {
      setSelectedTypes([AUDIENCE_TYPES.ALL_CONTACTS]);
      setFilterByType({});
      return;
    }
    setSelectedTypes((prev) => {
      const withoutAll = prev.filter((x) => x !== AUDIENCE_TYPES.ALL_CONTACTS);
      if (withoutAll.includes(value)) {
        const next = withoutAll.filter((x) => x !== value);
        return next.length ? next : [AUDIENCE_TYPES.ALL_CONTACTS];
      }
      return [...withoutAll, value];
    });
  };

  const openModal = () => {
    setName("");
    setSelectedTypes([AUDIENCE_TYPES.ALL_CONTACTS]);
    setFilterByType({});
    setPreview(null);
    setPreviewError(null);
    setOpen(true);
  };

  const runPreview = async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    const { audience_type, audience_filter } = campaignAudienceToApi(selectedTypes, filterByType);
    const r = await businessService.previewMarketingAudience({
      audience_type,
      audience_filter,
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
    const { audience_type, audience_filter } = campaignAudienceToApi(selectedTypes, filterByType);
    const r = await businessService.createMarketingSegment({
      name: name.trim(),
      audience_type,
      audience_filter,
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
              {row.audience_type === "multi"
                ? "Combined audience"
                : getAudienceOption(row.audience_type)?.label || row.audience_type}
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

  const typesNeedingFields = selectedTypes.filter((t) => t !== AUDIENCE_TYPES.ALL_CONTACTS);

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

          <Form.Item label="Match rules (combine with OR)" style={{ marginBottom: 12 }}>
            <AudienceTypeSelect>
              {options.map((opt) => {
                const on = selectedTypes.includes(opt.value);
                return (
                  <TypeRow key={opt.value} $on={on} htmlFor={`aud-${opt.value}`}>
                    <Checkbox
                      id={`aud-${opt.value}`}
                      checked={on}
                      onChange={() => toggleType(opt.value)}
                    />
                    <div>
                      <TypeLabel $on={on}>{opt.label}</TypeLabel>
                      <TypeHelp>{opt.help}</TypeHelp>
                    </div>
                  </TypeRow>
                );
              })}
            </AudienceTypeSelect>
          </Form.Item>

          {typesNeedingFields.map((t) => (
            <Form.Item key={t} label={getAudienceOption(t)?.label || t} style={{ marginBottom: 12 }}>
              <AudienceFields
                audienceType={t}
                audienceFilter={filterByType[t] || {}}
                onFilterChange={(patch) => {
                  setFilterByType((prev) => ({ ...prev, [t]: { ...(prev[t] || {}), ...patch } }));
                  setPreview(null);
                }}
                facets={facets}
                segments={[]}
              />
            </Form.Item>
          ))}

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <motion.span whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
              <Button onClick={runPreview} loading={previewLoading}>
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
            <Button type="primary" loading={saving} onClick={saveSegment}>
              Save audience
            </Button>
          </div>
        </Form>
      </Modal>
    </Panel>
  );
}
