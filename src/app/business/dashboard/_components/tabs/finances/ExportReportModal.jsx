"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Modal, Radio, Segmented, Select, Typography, Tooltip } from "antd";
import { Info } from "lucide-react";
import dayjs from "dayjs";
import {
  TAX_DISCLAIMER,
  TAX_TOOLTIPS,
  REPORT_TYPE_OPTIONS,
  PERIOD_PRESET_OPTIONS,
  resolvePeriodPreset,
} from "./revenueTaxCopy";

const { Text } = Typography;

const FieldLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
`;

const FieldBlock = styled.div`
  margin-bottom: 20px;
`;

const Disclaimer = styled(Text)`
  display: block;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
  margin-top: 8px;
`;

const ReportOption = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

function InfoTip({ text }) {
  return (
    <Tooltip title={text} placement="top" mouseEnterDelay={0.3}>
      <Info size={14} style={{ color: "#9ca3af", cursor: "help", flexShrink: 0 }} />
    </Tooltip>
  );
}

export default function ExportReportModal({
  open,
  onCancel,
  onExport,
  exporting,
  dashboardStartDate,
  dashboardEndDate,
}) {
  const [reportType, setReportType] = useState("tax_summary");
  const [periodPreset, setPeriodPreset] = useState("custom");
  const [format, setFormat] = useState("csv");
  const [resolvedRange, setResolvedRange] = useState(null);

  useEffect(() => {
    if (!open) return;
    setReportType("tax_summary");
    setPeriodPreset("custom");
    setFormat("csv");
  }, [open]);

  useEffect(() => {
    if (periodPreset === "custom") {
      setResolvedRange(
        dashboardStartDate && dashboardEndDate
          ? [dashboardStartDate, dashboardEndDate]
          : null,
      );
    } else {
      setResolvedRange(resolvePeriodPreset(periodPreset));
    }
  }, [periodPreset, dashboardStartDate, dashboardEndDate]);

  const handleOk = () => {
    if (!resolvedRange?.[0] || !resolvedRange?.[1]) return;
    onExport({
      reportType,
      format,
      startDate: resolvedRange[0],
      endDate: resolvedRange[1],
    });
  };

  const rangeLabel =
    resolvedRange?.[0] && resolvedRange?.[1]
      ? `${resolvedRange[0].format("MMM D, YYYY")} – ${resolvedRange[1].format("MMM D, YYYY")}`
      : "Select a valid date range";

  return (
    <Modal
      title="Export revenue report"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Download"
      confirmLoading={exporting}
      okButtonProps={{
        disabled: !resolvedRange?.[0] || !resolvedRange?.[1],
      }}
      width={480}
      destroyOnClose
    >
      <FieldBlock>
        <FieldLabel>
          Report type
          <InfoTip text={TAX_TOOLTIPS.reportTypeTax} />
        </FieldLabel>
        <Radio.Group
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          {REPORT_TYPE_OPTIONS.map((opt) => (
            <Radio key={opt.value} value={opt.value}>
              <ReportOption>
                <span>{opt.label}</span>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {opt.description}
                </Text>
              </ReportOption>
            </Radio>
          ))}
        </Radio.Group>
      </FieldBlock>

      <FieldBlock>
        <FieldLabel>
          Period
          <InfoTip text={TAX_TOOLTIPS.periodPreset} />
        </FieldLabel>
        <Select
          value={periodPreset}
          onChange={setPeriodPreset}
          options={PERIOD_PRESET_OPTIONS}
          style={{ width: "100%" }}
        />
        <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
          {rangeLabel}
        </Text>
      </FieldBlock>

      <FieldBlock>
        <FieldLabel>
          Format
          <InfoTip text={TAX_TOOLTIPS.exportFormat} />
        </FieldLabel>
        <Segmented
          value={format}
          onChange={setFormat}
          options={[
            { label: "CSV", value: "csv" },
            { label: "Excel", value: "xlsx" },
          ]}
          block
        />
      </FieldBlock>

      <Disclaimer>{TAX_DISCLAIMER}</Disclaimer>
    </Modal>
  );
}
