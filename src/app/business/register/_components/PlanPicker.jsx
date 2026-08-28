"use client";

import PlanCards from "@/components/plans/PlanCards";

export default function PlanPicker({ planId, onChange }) {
  return <PlanCards selectedId={planId} onSelect={onChange} />;
}
