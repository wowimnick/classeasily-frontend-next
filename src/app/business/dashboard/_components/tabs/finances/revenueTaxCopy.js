/** Shared tooltip and disclaimer copy for revenue / HST reporting */

import dayjs from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";

dayjs.extend(quarterOfYear);

export const TAX_DISCLAIMER =
  "Estimates for your records, grouped by transaction date. Not tax advice — confirm with your accountant. Bank deposit dates may differ slightly; see Payouts for deposit reconciliation.";

export const TAX_TOOLTIPS = {
  hstOnCommission:
    "ClassEasily charges 13% HST on its commission. You can usually claim this back as an Input Tax Credit on your HST return.",
  hstCollected:
    "The 13% HST included in what customers paid. You generally remit this to the CRA, less your input tax credits.",
  salesPreTax: "Customer payments before HST (after discounts and gift cards).",
  commission: "ClassEasily platform fee before HST, before card processing.",
  netPayout: "Amount allocated to your business after fees and tax split.",
  platformCommissionStat:
    "Total platform commission for the period. HST on commission is shown in the monthly tax table below — claimable as an ITC.",
  reportTypeTax:
    "One row per month with HST on commission (ITC) — best for reconciling bank deposits and tax filing.",
  reportTypeDetailed:
    "Per-booking rows with tax and commission columns for full accounting detail.",
  reportTypeFull: "Monthly tax summary plus daily trends, class breakdown, and every transaction.",
  periodPreset:
    "Choose a preset or use Custom to match the date range on the dashboard.",
  exportFormat: "CSV opens in Excel or Google Sheets. Excel (.xlsx) uses separate sheets per section.",
};

export const REPORT_TYPE_OPTIONS = [
  {
    value: "tax_summary",
    label: "Monthly Tax Summary (HST)",
    description: "Best for taxes & bank reconciliation",
  },
  {
    value: "detailed",
    label: "Detailed Transactions",
    description: "Every booking with tax columns",
  },
  {
    value: "full",
    label: "Everything",
    description: "Tax summary + full detail",
  },
];

export const PERIOD_PRESET_OPTIONS = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "this_year", label: "This year" },
  { value: "custom", label: "Use dashboard dates" },
];

export function resolvePeriodPreset(preset) {
  const now = dayjs();
  switch (preset) {
    case "this_month":
      return [now.startOf("month"), now.endOf("month")];
    case "last_month": {
      const last = now.subtract(1, "month");
      return [last.startOf("month"), last.endOf("month")];
    }
    case "this_quarter":
      return [now.startOf("quarter"), now.endOf("quarter")];
    case "this_year":
      return [now.startOf("year"), now.endOf("year")];
    default:
      return null;
  }
}
