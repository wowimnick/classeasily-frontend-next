"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Card, Select, Button, Alert, Typography } from "antd";
import { Upload, Building2, FileUp } from "lucide-react";
import { businessManagementService } from "@/services/adminDash";
import message from "@/lib/message";

const { Text } = Typography;

const PageWrapper = styled.div`
  padding: 24px;
  max-width: 720px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const StyledCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  .ant-card-head {
    border-bottom: 1px solid #f1f5f9;
    font-weight: 600;
  }
`;

const FormRow = styled.div`
  margin-bottom: 20px;
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #334155;
  }
`;

const FileInputWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  input[type="file"] {
    padding: 8px;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    background: #f8fafc;
    cursor: pointer;
    font-size: 14px;
  }
`;

const OutputPre = styled.pre`
  margin: 0;
  padding: 12px;
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  max-height: 320px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

export default function ImportGoogleReviews() {
  const [businesses, setBusinesses] = useState([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const loadBusinesses = useCallback(async () => {
    setLoadingBusinesses(true);
    const res = await businessManagementService.getBusinesses({
      page_size: 500,
    });
    setLoadingBusinesses(false);
    if (res.success && res.data) {
      const list = res.data.results || res.data;
      setBusinesses(Array.isArray(list) ? list : []);
      if (list.length && !selectedBusinessId)
        setSelectedBusinessId(list[0].businessId ?? list[0].id);
    }
  }, [selectedBusinessId]);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setResult(null);
  };

  const handleRunImport = async () => {
    if (!selectedBusinessId) {
      message.error("Please select a business.");
      return;
    }
    if (!file) {
      message.error("Please choose a CSV or JSON file.");
      return;
    }
    const ext = (file.name || "").toLowerCase();
    if (!ext.endsWith(".csv") && !ext.endsWith(".json")) {
      message.error("File must be .csv or .json");
      return;
    }
    setImporting(true);
    setResult(null);
    const res = await businessManagementService.importGoogleReviews(
      selectedBusinessId,
      file
    );
    setImporting(false);
    setResult(res);
    if (res.success) {
      message.success("Import completed.");
    } else {
      message.error(res.error || "Import failed.");
    }
  };

  const businessOptions = businesses.map((b) => ({
    value: b.businessId ?? b.id,
    label: b.businessName
      ? `${b.businessName} (ID: ${b.businessId ?? b.id})`
      : `Business ${b.businessId ?? b.id}`,
  }));

  return (
    <PageWrapper>
      <StyledCard
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Upload size={20} />
            Import Google Reviews
          </span>
        }
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
          Select a business, upload a CSV or JSON file with Google review data,
          then run the import. This runs the same logic as the{" "}
          <code>import_google_reviews</code> management command.
        </Text>

        <FormRow>
          <label>
            <Building2 size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
            Business
          </label>
          <Select
            placeholder="Select a business"
            value={selectedBusinessId ?? undefined}
            onChange={setSelectedBusinessId}
            options={businessOptions}
            loading={loadingBusinesses}
            style={{ width: "100%", maxWidth: 400 }}
            showSearch
            optionFilterProp="label"
            filterOption={(input, opt) =>
              (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </FormRow>

        <FormRow>
          <label>
            <FileUp size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
            File (CSV or JSON)
          </label>
          <FileInputWrap>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
              disabled={importing}
            />
            {file && (
              <Text type="secondary">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </Text>
            )}
          </FileInputWrap>
        </FormRow>

        <div style={{ marginTop: 24 }}>
          <Button
            type="primary"
            size="large"
            icon={<Upload size={18} />}
            onClick={handleRunImport}
            loading={importing}
            disabled={!selectedBusinessId || !file}
          >
            Run import_google_reviews
          </Button>
        </div>

        {result && (
          <div style={{ marginTop: 24 }}>
            {result.success ? (
              <Alert
                type="success"
                message="Import completed"
                description={
                  result.data?.output ? (
                    <OutputPre>{result.data.output}</OutputPre>
                  ) : (
                    result.data?.message
                  )
                }
                showIcon
              />
            ) : (
              <Alert
                type="error"
                message="Import failed"
                description={
                  <>
                    {result.error}
                    {result.data?.output && (
                      <OutputPre style={{ marginTop: 8 }}>
                        {result.data.output}
                      </OutputPre>
                    )}
                  </>
                }
                showIcon
              />
            )}
          </div>
        )}
      </StyledCard>
    </PageWrapper>
  );
}
