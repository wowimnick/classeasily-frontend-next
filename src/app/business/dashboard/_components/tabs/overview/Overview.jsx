"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Alert, Empty, Skeleton } from "antd";
import NumberFlow from "@number-flow/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAuth } from "@/lib/auth-client";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";
import { businessService } from "@/services/apiService";
import { dash, classColorAt } from "../../shared/dashboardTokens";
import {
  Sparkline,
  RadialGauge,
  BarSeries,
  CapacityMeter,
  HeatStrip,
  TrendArea,
  formatChartMoney,
} from "../../shared/charts";
import BookingDetailsDrawer from "../bookings/BookingDetailsDrawer";

dayjs.extend(relativeTime);

const Page = styled.div`
  padding: 16px 20px 48px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin: 8px 0 24px;
`;

const Greeting = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  color: ${dash.color.ink};
`;

const Sub = styled.p`
  margin: 6px 0 0;
  font-size: 14px;
  font-weight: 500;
  color: ${dash.color.ash};
`;

const Section = styled.section`
  margin-bottom: 28px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: ${dash.color.ink};
`;

const Card = styled.div`
  background: ${dash.color.surface};
  border: 1px solid ${dash.color.hairline};
  border-radius: ${dash.radius.card}px;
  padding: 16px;
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const GaugeRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DayStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(96px, 1fr));
  gap: 8px;
  overflow-x: auto;
`;

const DayCol = styled.button`
  border: 1px solid ${dash.color.hairline};
  border-radius: ${dash.radius.card}px;
  background: ${dash.color.surface};
  padding: 12px;
  text-align: left;
  cursor: pointer;
  min-height: 110px;
`;

const TxRow = styled.button`
  display: grid;
  grid-template-columns: 36px 1fr auto;
  gap: 12px;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  padding: 12px 0;
  border-bottom: 1px solid ${dash.color.hairline};
  cursor: pointer;
  &:last-child { border-bottom: none; }
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${dash.color.cloud};
  color: ${dash.color.ink};
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Pill = styled.span`
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: ${dash.radius.pill}px;
  background: ${(p) => p.$bg || dash.color.cloud};
  color: ${(p) => p.$fg || dash.color.ink};
`;

function AnimatedNumber({ value, prefix = "", suffix = "", loading }) {
  const [display, setDisplay] = useState(0);
  const target = Number(value) || 0;
  useEffect(() => {
    if (loading) {
      setDisplay(0);
      return;
    }
    const t = setTimeout(() => setDisplay(target), 40);
    return () => clearTimeout(t);
  }, [loading, target]);
  return (
    <>
      {prefix}
      <NumberFlow value={display} />
      {suffix}
    </>
  );
}

function initials(name) {
  return String(name || "C")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

const Overview = forwardRef((props, ref) => {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const userFirstName = currentUser?.first_name || currentUser?.username || "there";

  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNet, setShowNet] = useState(false);
  const [txBookingId, setTxBookingId] = useState(null);

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessService.fetchMyBusinessOverview();
      if (response.success && response.data) setOverviewData(response.data);
      else setError(response.error || "Failed to fetch overview data.");
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  const overviewTitleRef = useRef(null);
  useImperativeHandle(ref, () => ({
    getTargetElement: () => overviewTitleRef.current,
  }));

  const metrics = overviewData?.metrics || {};
  const series = overviewData?.series || {};
  const revenueAccessDenied = overviewData && !metrics.monthly_revenue;
  const mom = Number(metrics.monthly_revenue?.change);
  const needing = overviewData?.actionable_prompts?.classes_needing_schedules_count || 0;

  const upcomingByDay = useMemo(() => {
    const rows = overviewData?.upcoming_classes || [];
    const days = Array.from({ length: 7 }, (_, i) => dayjs().add(i, "day"));
    return days.map((d) => {
      const key = d.format("YYYY-MM-DD");
      const items = rows.filter((r) => r.date === key);
      const booked = items.reduce((n, r) => n + (r.current_occupancy || 0), 0);
      const cap = items.reduce((n, r) => n + (r.max_occupancy || 0), 0);
      return { date: d, items, booked, cap };
    });
  }, [overviewData]);

  const topServices = (overviewData?.popular_classes || []).map((c, i) => ({
    label: c.name,
    value: c.enrollment,
    color: classColorAt(i).accent,
  }));

  const spark = (arr) => (arr || []).map((p) => p.value);

  if (error) {
    return (
      <Page>
        <Alert type="error" message="Could not load reports" description={String(error)} />
      </Page>
    );
  }

  return (
    <Page>
      <DashboardBreadcrumb title="Reports" />
      <Header>
        <Greeting>Welcome back, {userFirstName}</Greeting>
        <Sub>{dayjs().format("dddd, MMMM D")}</Sub>
      </Header>
      <div ref={overviewTitleRef} />

      {needing > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 20, borderRadius: dash.radius.card }}
          message={`${needing} service${needing === 1 ? "" : "s"} need upcoming sessions`}
          action={
            <button
              type="button"
              onClick={() => router.push("/business/dashboard/calendar")}
              style={{ border: "none", background: "none", color: dash.color.rausch, fontWeight: 600, cursor: "pointer" }}
            >
              Open calendar
            </button>
          }
        />
      )}

      <Section>
        <SectionTitle>Revenue</SectionTitle>
        <Card>
          {loading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : revenueAccessDenied ? (
            <div style={{ color: dash.color.ash }}>Access restricted</div>
          ) : (
            <TrendArea
              data={overviewData?.revenue_trend || []}
              showNet={showNet}
              onToggleNet={setShowNet}
              rangeLabel="Last 30 days"
              delta={Number.isFinite(mom) ? mom : undefined}
            />
          )}
        </Card>
      </Section>

      <Section>
        <KpiGrid>
          {[
            {
              label: "Gross revenue (month)",
              value: metrics.monthly_revenue?.value,
              prefix: "$",
              series: (overviewData?.revenue_trend || []).map((r) => r.gross_revenue),
              restricted: revenueAccessDenied,
            },
            {
              label: "Bookings (30d)",
              value: spark(series.bookings_daily).reduce((a, b) => a + b, 0),
              series: spark(series.bookings_daily),
            },
            {
              label: "New clients",
              value: spark(series.new_clients_weekly).reduce((a, b) => a + b, 0),
              series: spark(series.new_clients_weekly),
            },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <div style={{ fontSize: 12, fontWeight: 500, color: dash.color.ash }}>{kpi.label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: dash.color.ink, margin: "6px 0 8px" }}>
                {kpi.restricted ? "—" : <AnimatedNumber value={kpi.value} prefix={kpi.prefix} loading={loading} />}
              </div>
              {!kpi.restricted && <Sparkline values={kpi.series} width={160} height={36} />}
            </Card>
          ))}
        </KpiGrid>
      </Section>

      <Section>
        <SectionTitle>Health</SectionTitle>
        <GaugeRow>
          {[
            { label: "Repeat client rate", value: metrics.repeat_client_rate?.value, series: spark(series.new_clients_weekly), target: 40 },
            { label: "No-show rate", value: metrics.no_show_rate?.value, series: spark(series.no_show_weekly), target: 8, color: dash.color.warning },
            { label: "Upcoming fill", value: metrics.upcoming_capacity_fill?.value, series: spark(series.occupancy_weekly), target: 70 },
          ].map((g) => (
            <Card key={g.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <RadialGauge value={g.value} label={g.label} target={g.target} color={g.color} />
              <Sparkline values={g.series} width={140} height={28} color={g.color || dash.chart.primary} />
            </Card>
          ))}
        </GaugeRow>
      </Section>

      <Section>
        <SectionTitle>Next 7 days</SectionTitle>
        <DayStrip>
          {upcomingByDay.map((day) => (
            <DayCol
              key={day.date.format("YYYY-MM-DD")}
              type="button"
              onClick={() => {
                const first = day.items[0];
                if (first?.schedule_instance_id) {
                  router.push(`/business/dashboard/calendar?instanceId=${first.schedule_instance_id}`);
                } else {
                  router.push("/business/dashboard/calendar");
                }
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: dash.color.ash, textTransform: "uppercase" }}>
                {day.date.format("ddd")}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: dash.color.ink, marginBottom: 8 }}>
                {day.date.format("D")}
              </div>
              <CapacityMeter booked={day.booked} capacity={day.cap} />
              {day.items.slice(0, 2).map((s) => (
                <div key={s.schedule_instance_id} style={{ fontSize: 11, color: dash.color.ash, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.name}
                </div>
              ))}
            </DayCol>
          ))}
        </DayStrip>
      </Section>

      <Section>
        <SectionTitle>Top services</SectionTitle>
        <Card>
          {topServices.length === 0 ? (
            <Empty description="No bookings yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <BarSeries items={topServices} />
          )}
        </Card>
      </Section>

      <Section>
        <SectionTitle>Booking density</SectionTitle>
        <Card>
          <HeatStrip cells={series.bookings_by_weekday_hour || []} />
        </Card>
      </Section>

      <Section>
        <SectionTitle>Recent transactions</SectionTitle>
        <Card>
          {revenueAccessDenied ? (
            <div style={{ color: dash.color.ash, fontSize: 14 }}>Access restricted</div>
          ) : !(overviewData?.recent_transactions || []).length ? (
            <Empty description="No transactions yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            (overviewData.recent_transactions || []).map((tx) => (
              <TxRow key={tx.id} type="button" onClick={() => setTxBookingId(tx.booking_id)}>
                <Avatar>{initials(tx.client_name)}</Avatar>
                <div>
                  <div style={{ fontWeight: 600, color: dash.color.ink, fontSize: 14 }}>{tx.client_name}</div>
                  <div style={{ fontSize: 12, color: dash.color.ash }}>
                    {tx.service_name}
                    {tx.card_last4 ? ` · ${tx.card_brand || "Card"} ••${tx.card_last4}` : ""}
                    {" · "}
                    {tx.created_at ? dayjs(tx.created_at).fromNow() : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 600, color: dash.color.ink }}>
                    {tx.kind === "refund" ? "−" : ""}
                    {formatChartMoney(tx.amount)}
                  </div>
                  <Pill $bg={tx.kind === "refund" ? "#fef2f2" : "#f0fdf4"} $fg={tx.kind === "refund" ? dash.color.danger : dash.color.success}>
                    {tx.kind === "refund" ? "Refund" : "Paid"}
                  </Pill>
                </div>
              </TxRow>
            ))
          )}
        </Card>
      </Section>

      <BookingDetailsDrawer
        visible={!!txBookingId}
        onClose={() => setTxBookingId(null)}
        bookingId={txBookingId}
        onBookingUpdate={fetchOverviewData}
        onBookingCancel={fetchOverviewData}
      />
    </Page>
  );
});

Overview.displayName = "Overview";
export default Overview;
