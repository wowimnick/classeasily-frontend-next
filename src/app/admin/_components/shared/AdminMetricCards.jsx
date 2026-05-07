"use client";

import React from "react";
import styled from "styled-components";
import NumberFlow from "@number-flow/react";
import { Card, Popover, Tag, Tooltip } from "antd";
import { AdminCardSkeleton } from "./AdminSkeletons";
import { TrendingDown, TrendingUp, Info } from "lucide-react";

export const adminColors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  border: "#f1f5f9",
  textPrimary: "#334155",
  textSecondary: "#64748b",
};

const hexToRgba = (hex, alpha = 1) => {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) {
    return `rgba(148, 163, 184, ${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
`;

const StatCard = styled(Card)`
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${adminColors.border};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .ant-card-body {
    padding: 20px !important;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 0;
    min-height: 120px;

    @media (max-width: 768px) {
      min-height: 104px;
      padding: 16px !important;
    }
  }
`;

const StatCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 4px;
  gap: 8px;
`;

const IconContainer = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.$background || "#f1f5f9"};
  color: ${(props) => props.$color || adminColors.textSecondary};

  svg {
    width: 18px;
    height: 18px;
  }
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${adminColors.textSecondary};

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const StatValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${adminColors.textPrimary};
  display: flex;
  align-items: baseline;
  gap: 8px;

  @media (max-width: 768px) {
    font-size: 17px;
  }
`;

const StatFooter = styled.div`
  font-size: 12px;
  color: ${adminColors.textSecondary};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PercentChange = styled.span`
  color: ${(props) => (props.$isPositive ? adminColors.success : adminColors.error)};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
`;

const MetricValue = ({ card, isReadyForAnimation }) => {
  if (typeof card.renderValue === "function") {
    return card.renderValue(card.value, isReadyForAnimation);
  }

  if (typeof card.value !== "number") {
    return card.value ?? "N/A";
  }

  if (card.isCurrency) {
    return (
      <NumberFlow
        value={isReadyForAnimation ? card.value : 0}
        duration={800}
        prefix="$"
        numberFormatOptions={{
          minimumFractionDigits: card.minimumFractionDigits ?? 0,
          maximumFractionDigits: card.maximumFractionDigits ?? 2,
        }}
      />
    );
  }

  return (
    <NumberFlow
      value={isReadyForAnimation ? card.value : 0}
      duration={800}
      numberFormatOptions={card.numberFormatOptions}
    />
  );
};

const AdminMetricCards = ({
  cards = [],
  loading = false,
  isReadyForAnimation = true,
}) => {
  return (
    <StatsGrid>
      {cards.map((card, index) => {
        const Icon = card.icon;
        const key = card.key || card.title || card.label || String(index);
        const title = card.title || card.label || "Metric";
        const iconColor = card.color || adminColors.info;

        const cardInner = (
          <StatCard>
            {loading ? (
              <AdminCardSkeleton />
            ) : (
              <>
                <div>
                  <StatCardHeader>
                    <IconContainer
                      $background={hexToRgba(iconColor, 0.1)}
                      $color={iconColor}
                    >
                      {Icon ? <Icon size={18} /> : null}
                    </IconContainer>
                    {card.periodBadge ? (
                      <Tag
                        style={{
                          margin: 0,
                          fontSize: 10,
                          lineHeight: "18px",
                          borderRadius: 6,
                        }}
                      >
                        {card.periodBadge}
                      </Tag>
                    ) : null}
                  </StatCardHeader>
                  <StatLabel>
                    {card.tooltip ? (
                      <Tooltip title={card.tooltip}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            cursor: "help",
                          }}
                        >
                          {title}
                          <Info size={14} style={{ opacity: 0.65 }} aria-hidden />
                        </span>
                      </Tooltip>
                    ) : (
                      title
                    )}
                  </StatLabel>
                </div>

                <StatValue>
                  <MetricValue card={card} isReadyForAnimation={isReadyForAnimation} />
                  {typeof card.growth === "number" ? (
                    <PercentChange $isPositive={card.growth >= 0}>
                      {card.growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(card.growth).toFixed(1)}%
                    </PercentChange>
                  ) : null}
                </StatValue>

                {card.footer ? <StatFooter>{card.footer}</StatFooter> : null}
              </>
            )}
          </StatCard>
        );

        if (card.popoverContent && !loading) {
          return (
            <Popover
              key={key}
              mouseEnterDelay={0.2}
              placement="bottom"
              styles={{ body: { background: "#fff", maxWidth: 320 } }}
              content={card.popoverContent}
            >
              <span style={{ display: "block", height: "100%", cursor: "default" }}>
                {cardInner}
              </span>
            </Popover>
          );
        }

        return (
          <React.Fragment key={key}>
            {cardInner}
          </React.Fragment>
        );
      })}
    </StatsGrid>
  );
};

export default AdminMetricCards;
