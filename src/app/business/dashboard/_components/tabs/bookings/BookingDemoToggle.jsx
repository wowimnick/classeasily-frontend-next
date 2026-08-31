"use client";

import React, { useEffect, useState } from "react";
import { Switch } from "antd";
import {
  isNonProductionHost,
  isBookingDemoEnabled,
  setBookingDemoEnabled,
  DEMO_CHANGE_EVENT,
} from "@/lib/devEnv";

export default function BookingDemoToggle({ onChange }) {
  const [visible, setVisible] = useState(false);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const sync = () => {
      setVisible(isNonProductionHost());
      setOn(isBookingDemoEnabled());
    };
    sync();
    window.addEventListener(DEMO_CHANGE_EVENT, sync);
    return () => window.removeEventListener(DEMO_CHANGE_EVENT, sync);
  }, []);

  if (!visible) return null;

  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
      Demo data
      <Switch
        size="small"
        checked={on}
        onChange={(v) => {
          setBookingDemoEnabled(v);
          setOn(v);
          onChange?.(v);
        }}
      />
    </label>
  );
}
