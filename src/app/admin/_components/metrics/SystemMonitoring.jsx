"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Spin } from "antd";
import RequestAnalysisTab from "./RequestAnalytics";
import { adminService } from "@/services/adminDash";
import { RefreshButton } from "../shared/AdminButtons";
import { DashboardWrapper } from "../shared/adminTableStyles";

export default function SystemMonitoring() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadMetrics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const result = await adminService.getAdminMetrics();
    if (result.success) {
      setMetrics(result.data);
    } else {
      setError(result.error || "Failed to load system metrics");
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadMetrics(false);
  }, [loadMetrics]);

  if (loading) {
    return (
      <DashboardWrapper>
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Spin size="large" />
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>System Monitoring</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            Platform health, Celery queues, scheduled task timings, and endpoint performance
          </p>
        </div>
        <RefreshButton loading={refreshing} onClick={() => loadMetrics(true)}>
          Refresh
        </RefreshButton>
      </div>
      {error ? (
        <Alert
          type="error"
          message="Failed to load metrics"
          description={error}
          action={
            <Button size="small" onClick={() => loadMetrics(true)}>
              Retry
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <RequestAnalysisTab metrics={metrics} />
    </DashboardWrapper>
  );
}
