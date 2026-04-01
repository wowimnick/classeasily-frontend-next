"use client";

/**
 * Shared audience filter sub-fields.
 * Renders the secondary inputs for a chosen audienceType, using dropdown selects
 * wherever data is available (tags / classes / sources from the facets API).
 */

import React from "react";
import { Alert, Select, Typography } from "antd";
import {
  AUDIENCE_TYPES,
  buildSourceOptions,
  canonicalSourceValue,
} from "./marketingAudienceConfig";
import { Skel } from "./marketingSkeletons";

const { Text } = Typography;

/**
 * @param {{
 *   audienceType: string
 *   audienceFilter: object
 *   onFilterChange: (patch: object) => void
 *   facets: { tags: string[], classes: {id:number,title:string}[], sources: string[] } | null
 *   segments: { id: string, name: string }[]
 * }} props
 */
export default function AudienceFields({
  audienceType,
  audienceFilter,
  onFilterChange,
  facets,
  segments = [],
}) {
  const classes = facets?.classes || [];
  const sources = facets?.sources || [];

  if (audienceType === AUDIENCE_TYPES.BOOKING_CHANNEL) {
    return (
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
          Booking channel
        </Text>
        <Select
          style={{ width: "100%" }}
          value={audienceFilter.channel || "widget"}
          onChange={(v) => onFilterChange({ channel: v })}
          options={[
            { value: "widget",      label: "Widget bookers (embedded booking form)" },
            { value: "marketplace", label: "Marketplace bookers (non-widget)" },
          ]}
        />
      </div>
    );
  }

  if (audienceType === AUDIENCE_TYPES.BOOKED_CLASS) {
    if (!facets) {
      return (
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            Class(es)
          </Text>
          <Skel $h="36px" $w="100%" $r="8px" />
        </div>
      );
    }
    return (
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
          Class(es)
        </Text>
        <Select
          mode="multiple"
          style={{ width: "100%" }}
          placeholder={classes.length > 0 ? "Select class(es)…" : "No classes to select"}
          value={(audienceFilter.class_ids || []).map(Number)}
          onChange={(v) => onFilterChange({ class_ids: v })}
          options={classes.map((c) => ({ value: c.id, label: c.title }))}
          optionFilterProp="label"
          showSearch
          allowClear
        />
        {classes.length === 0 && (
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
            No active classes found for your business.
          </Text>
        )}
      </div>
    );
  }

  if (audienceType === AUDIENCE_TYPES.BOOKED_ANY) {
    return (
      <Text type="secondary" style={{ fontSize: 12 }}>
        Targets all contacts with at least one booking. You can refine by date range in a saved
        audience if needed.
      </Text>
    );
  }

  if (audienceType === AUDIENCE_TYPES.HAS_NO_BOOKINGS) {
    return (
      <Text type="secondary" style={{ fontSize: 12 }}>
        Targets contacts who have never made a booking.
      </Text>
    );
  }

  if (audienceType === AUDIENCE_TYPES.CONTACT_SOURCE_IN) {
    const sourceOptions = buildSourceOptions(sources);
    const sourceValues = [...new Set((audienceFilter.sources || []).map(canonicalSourceValue))];
    return (
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
          Contact source(s)
        </Text>
        <Select
          mode="multiple"
          style={{ width: "100%" }}
          placeholder="Select source(s)…"
          value={sourceValues}
          onChange={(v) => onFilterChange({ sources: v })}
          options={sourceOptions}
          optionFilterProp="label"
          showSearch
          allowClear
        />
      </div>
    );
  }

  if (audienceType === AUDIENCE_TYPES.TAGS) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Legacy tag audience"
        description="This campaign still references tag-based targeting, which is no longer available. Choose a different audience type above to continue editing."
      />
    );
  }

  if (audienceType === AUDIENCE_TYPES.SAVED_SEGMENT) {
    if (!segments.length) {
      return (
        <Alert
          type="warning"
          showIcon
          message="No saved audiences yet"
          description={
            <>
              Create one in the{" "}
              <strong>Audiences</strong> tab (on this page), then return here to select it.
            </>
          }
        />
      );
    }
    return (
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
          Saved audience
        </Text>
        <Select
          showSearch
          optionFilterProp="label"
          style={{ width: "100%" }}
          placeholder="Choose saved audience…"
          value={audienceFilter.segment_id}
          onChange={(v) => onFilterChange({ segment_id: v })}
          options={segments.map((s) => ({ value: s.id, label: s.name }))}
        />
      </div>
    );
  }

  return null;
}
