"use client";

import React from "react";
import {
  Table,
  Card,
  Tabs,
  Progress,
  Badge,
  Tag,
  Space,
  Collapse,
  Tooltip,
  List,
  Typography,
  Empty,
} from "antd";
import {
  Database,
  Clock,
  AlertTriangle,
  Timer,
  TrendingUp,
  Briefcase,
  Code,
  FileText,
  Hash,
  Key,
} from "lucide-react";
import styled from "styled-components";
import PropTypes from "prop-types";
import { format } from "date-fns";

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Title, Text } = Typography;

// --- STYLING & THEME (ALIGNED WITH PARENT) ---
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
  codeBg: "#1e293b",
  codeText: "#e2e8f0",
};

const CardTitle = styled(Title).attrs({ level: 5 })`
  &.ant-typography {
    font-weight: 600;
    font-size: 17px;
    color: ${colors.textPrimary};
    margin: 0 !important;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;
const HelpText = styled(Text)`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: block;
  margin-top: 4px;
  margin-bottom: 16px;
`;
const TabContent = styled.div`
  padding: 24px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;
const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;
const StyledCard = styled(Card)`
  border-radius: 16px;
  box-shadow: none;
  border: 1px solid ${colors.border};
  background-color: #fff;
  .ant-card-body {
    padding: 24px !important;
    @media (max-width: 768px) {
      padding: 16px !important;
    }
  }
`;
const ListCard = styled(Card)`
  background: ${colors.lightBg};
  border: 1px solid ${colors.border};
  border-radius: 12px;
  .ant-card-body {
    padding: 16px !important;
    @media (max-width: 768px) {
      padding: 8px !important;
    }
  }
`;

// --- FIX: Made EndpointListItem responsive ---
const EndpointListItem = styled(List.Item)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; // Allow wrapping on small screens
  gap: 8px; // Add gap between wrapped items
  padding: 12px 16px !important;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #fff;
  }
`;

const EndpointName = styled(Text)`
  flex-grow: 1;
  font-size: 14px;
  white-space: normal; // Allow name to wrap if very long
  word-break: break-all;
  margin-right: 16px;

  @media (max-width: 599px) {
    flex-basis: 100%; // Take full width on mobile
    margin-right: 0;
  }
`;

const EndpointMetric = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-grow: 1;

  @media (min-width: 600px) {
    flex-grow: 0;
    min-width: 220px;
  }

  @media (max-width: 599px) {
    width: 100%;
  }
`;

const StyledProgress = styled(Progress)`
  flex-grow: 1;
`;

const EndpointValue = styled(Text)`
  font-weight: 600;
  min-width: 70px;
  text-align: right;
  font-size: 14px;
  color: ${colors.textPrimary};
`;

const CollapseWrapper = styled(Collapse)`
  background-color: transparent;
  border: none;
  .ant-collapse-item {
    border-radius: 12px !important;
    border: 1px solid ${colors.border};
    margin-bottom: 8px;
    background-color: #fff;
    overflow: hidden;
    &:last-child {
      border-radius: 12px !important;
    }
  }
  .ant-collapse-header {
    padding: 16px !important;
    align-items: center;
  }
  .ant-collapse-content {
    border-top: 1px solid ${colors.border};
  }
  .ant-collapse-content-box {
    padding: 16px !important;
    background-color: ${colors.lightBg};
  }
`;

// --- FIX: Made ErrorPanelHeader responsive ---
const ErrorPanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px;

  // Stack vertically on mobile
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
`;

const ErrorType = styled.span`
  font-weight: 600;
  color: ${colors.error};
  flex-shrink: 0;
`;

const ErrorPath = styled.span`
  color: ${colors.textSecondary};
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  // Allow path to take up available space on desktop
  @media (min-width: 641px) {
    flex-grow: 1;
    text-align: left;
    min-width: 0; // Important for flex + ellipsis
  }
`;
const ErrorTimestamp = styled.span`
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
`;
const TracebackContainer = styled.pre`
  background-color: ${colors.codeBg};
  color: ${colors.codeText};
  padding: 16px;
  border-radius: 8px;
  font-family: "Fira Code", "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: auto;
`;
const DetailItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 8px;
  strong {
    color: ${colors.textPrimary};
    min-width: 80px;
    display: inline-block;
  }
  span {
    color: ${colors.textSecondary};
    word-break: break-all;
  }
`;

// --- Components ---
const EndpointPerformanceList = ({ data, valueKey, unit }) => {
  if (!data || data.length === 0) {
    return (
      <Empty
        description="No endpoint data available."
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }
  const maxValue = Math.max(...data.map((item) => item[valueKey] || 0));
  return (
    <List
      dataSource={data}
      renderItem={(item) => (
        <EndpointListItem>
          <Tooltip title={item.view_name}>
            <EndpointName ellipsis={{ rows: 2 }}>
              {item.view_name || "Unknown View"}
            </EndpointName>
          </Tooltip>
          <EndpointMetric>
            <StyledProgress
              percent={
                maxValue > 0 ? ((item[valueKey] || 0) / maxValue) * 100 : 0
              }
              showInfo={false}
              size="small"
              strokeColor={colors.info}
            />
            <EndpointValue>
              {(item[valueKey] || 0).toFixed(
                valueKey === "avg_db_queries" ? 1 : 0
              )}{" "}
              {unit}
            </EndpointValue>
          </EndpointMetric>
        </EndpointListItem>
      )}
    />
  );
};
EndpointPerformanceList.propTypes = {
  data: PropTypes.array,
  valueKey: PropTypes.string.isRequired,
  unit: PropTypes.string.isRequired,
};

const RequestAnalysisTab = ({ metrics }) => {
  if (!metrics || !metrics.profiling || !metrics.endpoint_analysis) {
    return (
      <TabContent>
        <StyledCard>
          <Empty description="Request analysis data is not available." />
        </StyledCard>
      </TabContent>
    );
  }

  const { profiling, endpoint_analysis, celery } = metrics;
  const { top_by_count, top_by_time, top_by_queries } = endpoint_analysis;

  return (
    <TabContent>
      <GridContainer>
        <StyledCard>
          <CardTitle>
            <TrendingUp size={20} color={colors.primary} />
            Endpoint Performance
          </CardTitle>
          <HelpText>
            Analyze endpoints by frequency, response time, and database load.
          </HelpText>
          <ListCard>
            <Tabs type="card" size="small">
              <TabPane
                tab={
                  <>
                    <Timer size={14} />
                    Most Frequent
                  </>
                }
                key="count"
              >
                <EndpointPerformanceList
                  data={top_by_count}
                  valueKey="request_count"
                  unit="reqs"
                />
              </TabPane>
              <TabPane
                tab={
                  <>
                    <Clock size={14} />
                    Slowest
                  </>
                }
                key="time"
              >
                <EndpointPerformanceList
                  data={top_by_time}
                  valueKey="avg_time_taken"
                  unit="ms"
                />
              </TabPane>
              <TabPane
                tab={
                  <>
                    <Database size={14} />
                    DB Heavy
                  </>
                }
                key="queries"
              >
                <EndpointPerformanceList
                  data={top_by_queries}
                  valueKey="avg_db_queries"
                  unit="queries"
                />
              </TabPane>
            </Tabs>
          </ListCard>
        </StyledCard>
        <StyledCard>
          <CardTitle>
            <AlertTriangle size={20} color={colors.primary} />
            Recent Application Errors
          </CardTitle>
          <HelpText>
            A log of the most recent unhandled exceptions from the application.
          </HelpText>
          <CollapseWrapper accordion expandIconPosition="end">
            {(profiling.recent_errors || []).length > 0 ? (
              profiling.recent_errors.map((error, index) => (
                <Panel
                  header={
                    <ErrorPanelHeader>
                      <ErrorType>{error.exception_type}</ErrorType>
                      <ErrorPath>{error.path}</ErrorPath>
                      <ErrorTimestamp>
                        {format(
                          new Date(error.timestamp * 1000),
                          "HH:mm:ss dd-MMM"
                        )}
                      </ErrorTimestamp>
                    </ErrorPanelHeader>
                  }
                  key={index}
                >
                  <DetailItem>
                    <strong>Message:</strong>{" "}
                    <span>{error.exception_message}</span>
                  </DetailItem>
                  <TracebackContainer>{error.traceback}</TracebackContainer>
                </Panel>
              ))
            ) : (
              <Empty
                description="No recent application errors."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </CollapseWrapper>
        </StyledCard>
        <StyledCard>
          <CardTitle>
            <Briefcase size={20} color={colors.primary} />
            Recent Task Errors
          </CardTitle>
          <HelpText>
            A log of the most recent failed tasks from the Celery queue.
          </HelpText>
          <CollapseWrapper accordion expandIconPosition="end">
            {(celery.failed_tasks || []).length > 0 ? (
              celery.failed_tasks.map((error, index) => (
                <Panel
                  header={
                    <ErrorPanelHeader>
                      <ErrorType>{error.exception_type}</ErrorType>
                      <ErrorPath>{error.task_name}</ErrorPath>
                      <ErrorTimestamp>
                        {format(
                          new Date(error.timestamp * 1000),
                          "HH:mm:ss dd-MMM"
                        )}
                      </ErrorTimestamp>
                    </ErrorPanelHeader>
                  }
                  key={`celery-error-${index}`}
                >
                  <DetailItem>
                    <Key size={14} />
                    <strong>Task ID:</strong> <span>{error.task_id}</span>
                  </DetailItem>
                  <DetailItem>
                    <FileText size={14} />
                    <strong>Message:</strong>{" "}
                    <span>{error.exception_message}</span>
                  </DetailItem>
                  <DetailItem>
                    <Hash size={14} />
                    <strong>Args:</strong> <span>{error.args}</span>
                  </DetailItem>
                  <DetailItem>
                    <Hash size={14} />
                    <strong>Kwargs:</strong> <span>{error.kwargs}</span>
                  </DetailItem>
                  <TracebackContainer>{error.traceback}</TracebackContainer>
                </Panel>
              ))
            ) : (
              <Empty
                description="No failed task errors."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </CollapseWrapper>
        </StyledCard>
      </GridContainer>
    </TabContent>
  );
};

RequestAnalysisTab.propTypes = {
  metrics: PropTypes.shape({
    celery: PropTypes.shape({
      failed_tasks: PropTypes.arrayOf(PropTypes.object),
    }),
    profiling: PropTypes.shape({
      recent_errors: PropTypes.arrayOf(PropTypes.object),
    }),
    endpoint_analysis: PropTypes.shape({
      top_by_count: PropTypes.array,
      top_by_time: PropTypes.array,
      top_by_queries: PropTypes.array,
    }),
  }),
};

RequestAnalysisTab.defaultProps = {
  metrics: {
    celery: { failed_tasks: [] },
    profiling: { recent_errors: [] },
    endpoint_analysis: {
      top_by_count: [],
      top_by_time: [],
      top_by_queries: [],
    },
  },
};

export default RequestAnalysisTab;
