"use client";

import React from "react";
import styled, { keyframes } from "styled-components";
import { membershipColors } from "./membershipDashboardShared";

const pulse = keyframes`
  0%, 100% { background-position: 200% 0; }
  50% { background-position: -200% 0; }
`;

const Skel = styled.div`
  height: ${(p) => p.$h || "14px"};
  width: ${(p) => p.$w || "100%"};
  max-width: ${(p) => p.$maxW || "none"};
  border-radius: ${(p) => p.$r || "6px"};
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const PlansTableSkeletonWrap = styled.div`
  padding: 0;
`;

const PlansHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: ${membershipColors.theadBg};
  border-bottom: 1px solid #e2e8f0;
`;

const PlansRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid #f1f5f9;
  &:last-child {
    border-bottom: none;
  }
`;

const Col = styled.div`
  flex: ${(p) => p.$flex || "1"};
  min-width: 0;
`;

/** Matches My Plans table columns: Name | Price | Access | Members | Status | Actions */
export function MembershipPlansSkeleton({ rows = 5 }) {
  return (
    <PlansTableSkeletonWrap aria-hidden>
      <PlansHeaderRow>
        <Col $flex="1.2"><Skel $h="10px" $w="40%" $r="4px" /></Col>
        <Col $flex="0.9"><Skel $h="10px" $w="50%" $r="4px" /></Col>
        <Col $flex="1.1"><Skel $h="10px" $w="55%" $r="4px" /></Col>
        <Col $flex="0.7"><Skel $h="10px" $w="60%" $r="4px" /></Col>
        <Col $flex="0.6"><Skel $h="10px" $w="45%" $r="4px" /></Col>
        <Col $flex="0.7"><Skel $h="10px" $w="50%" $r="4px" /></Col>
      </PlansHeaderRow>
      {Array.from({ length: rows }).map((_, i) => (
        <PlansRow key={i}>
          <Col $flex="1.2">
            <Skel $h="14px" $w="70%" $r="4px" style={{ marginBottom: 6 }} />
            <Skel $h="10px" $w="35%" $r="4px" />
          </Col>
          <Col $flex="0.9"><Skel $h="14px" $w="85%" $r="4px" /></Col>
          <Col $flex="1.1"><Skel $h="14px" $w="90%" $r="4px" /></Col>
          <Col $flex="0.7"><Skel $h="14px" $w="40%" $r="4px" /></Col>
          <Col $flex="0.6"><Skel $h="22px" $w="44px" $r="12px" /></Col>
          <Col $flex="0.7"><Skel $h="14px" $w="70%" $r="4px" /></Col>
        </PlansRow>
      ))}
    </PlansTableSkeletonWrap>
  );
}

const MemberCard = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  gap: 14px;
  align-items: flex-start;
`;

const AvatarSkel = styled(Skel)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
`;

/** Matches member row: avatar + two lines, then meta chips */
export function MembershipMembersSkeleton({ cards = 5 }) {
  return (
    <div aria-hidden>
      {Array.from({ length: cards }).map((_, i) => (
        <MemberCard key={i}>
          <AvatarSkel $w="40px" $h="40px" $r="50%" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Skel $h="15px" $w="55%" $r="4px" style={{ marginBottom: 8 }} />
            <Skel $h="12px" $w="85%" $r="4px" style={{ marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Skel $h="22px" $w="72px" $r="6px" />
              <Skel $h="22px" $w="88px" $r="6px" />
            </div>
          </div>
        </MemberCard>
      ))}
    </div>
  );
}

const MembersTableHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: ${membershipColors.theadBg};
  border-bottom: 1px solid #e2e8f0;
`;

const MembersTableRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  &:last-child {
    border-bottom: none;
  }
`;

const MCol = styled.div`
  flex: ${(p) => p.$flex || "1"};
  min-width: 0;
`;

/**
 * Desktop members table: Member | Plan | Status | Billing period | Credits | Source | Actions
 */
export function MembershipMembersTableSkeleton({ rows = 8 }) {
  return (
    <div aria-hidden>
      <MembersTableHeaderRow>
        <MCol $flex="1.35"><Skel $h="10px" $w="45%" $r="4px" /></MCol>
        <MCol $flex="0.85"><Skel $h="10px" $w="50%" $r="4px" /></MCol>
        <MCol $flex="0.65"><Skel $h="10px" $w="55%" $r="4px" /></MCol>
        <MCol $flex="0.7"><Skel $h="10px" $w="60%" $r="4px" /></MCol>
        <MCol $flex="0.45"><Skel $h="10px" $w="50%" $r="4px" /></MCol>
        <MCol $flex="0.55"><Skel $h="10px" $w="45%" $r="4px" /></MCol>
        <MCol $flex="0.65"><Skel $h="10px" $w="40%" $r="4px" /></MCol>
      </MembersTableHeaderRow>
      {Array.from({ length: rows }).map((_, i) => (
        <MembersTableRow key={i}>
          <MCol $flex="1.35">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Skel $w="40px" $h="40px" $r="50%" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Skel $h="14px" $w="55%" $r="4px" style={{ marginBottom: 6 }} />
                <Skel $h="12px" $w="80%" $r="4px" />
              </div>
            </div>
          </MCol>
          <MCol $flex="0.85"><Skel $h="14px" $w="88%" $r="4px" /></MCol>
          <MCol $flex="0.65"><Skel $h="22px" $w="72px" $r="6px" /></MCol>
          <MCol $flex="0.7"><Skel $h="14px" $w="75%" $r="4px" /></MCol>
          <MCol $flex="0.45"><Skel $h="14px" $w="50%" $r="4px" /></MCol>
          <MCol $flex="0.55"><Skel $h="22px" $w="64px" $r="6px" /></MCol>
          <MCol $flex="0.65"><Skel $h="14px" $w="70%" $r="4px" /></MCol>
        </MembersTableRow>
      ))}
    </div>
  );
}

const TableMiniRow = styled.div`
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
  &:last-child {
    border-bottom: none;
  }
`;

/** Ledger / payment rows inside member drawer */
export function MembershipDrawerTableSkeleton({ rows = 3 }) {
  return (
    <div aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <TableMiniRow key={i}>
          <Skel $h="12px" $w="28%" $r="4px" />
          <Skel $h="12px" $w="22%" $r="4px" />
          <Skel $h="12px" $w="40%" $r="4px" />
        </TableMiniRow>
      ))}
    </div>
  );
}
