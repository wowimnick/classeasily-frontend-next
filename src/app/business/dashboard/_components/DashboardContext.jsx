"use client";

import { createContext, useContext } from "react";

const DashboardContext = createContext({
  openSettingsDrawer: () => {},
});

export function useDashboard() {
  return useContext(DashboardContext);
}

export default DashboardContext;
