"use client";

import React from "react";
import { Sunrise, Sun, Moon } from "lucide-react";

/** IDs must stay aligned with API / search `time_preference` query values. */
export const exploreTimePreferencesList = [
  {
    id: "Morning (6am-12pm)",
    label: "Morning",
    sub: "6:00 AM - 12:00 PM",
    icon: <Sunrise size={18} />,
  },
  {
    id: "Afternoon (12pm-5pm)",
    label: "Afternoon",
    sub: "12:00 PM - 5:00 PM",
    icon: <Sun size={18} />,
  },
  {
    id: "Evening (5pm-10pm)",
    label: "Evening",
    sub: "5:00 PM - 10:00 PM",
    icon: <Moon size={18} />,
  },
];
