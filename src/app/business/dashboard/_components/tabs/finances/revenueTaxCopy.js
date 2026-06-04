/** Shared tooltip and disclaimer copy for revenue / HST reporting */

import dayjs from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";

dayjs.extend(quarterOfYear);

export const TAX_DISCLAIMER =
  "Estimates for your records, grouped by transaction date. Not tax advice — confirm with your accountant. " +
  "When customers pay, HST is split between your class sales and ClassEasily's fee (ITC). " +
  "Bank deposit dates may differ slightly; see Payouts for deposit reconciliation.";

export const TAX_TABLE_INTRO =
  "Customer payments include HST. Your share is HST on your sales; ClassEasily's share is HST on their fee — usually claimable as an ITC.";

export const TAX_TOOLTIPS = {
  salesPreTax:
    "What customers paid for your classes before HST (after discounts and gift cards).",
  hstOnYourSales:
    "Your portion of the HST on customer payments — the part that goes with your class sales and is included in your net deposit. You generally remit this on your HST return (your accountant can confirm).",
  commission:
    "ClassEasily's platform fee on your sales, before HST. This is deducted before your payout.",
  hstOnCommission:
    "13% HST ClassEasily charges on their fee. This is not extra tax on your classes — it's on their commission. You can usually claim it back as an Input Tax Credit (ITC).",
  stripeFees:
    "Estimated card processing (Stripe) deducted from your payout, not from ClassEasily's commission.",
  netPayout:
    "Estimated amount allocated to your business after ClassEasily fee, card processing, and the tax split above.",
  platformCommissionStat:
    "Total ClassEasily fee for the period (before tax). HST on that fee is in the table below — usually claimable as an ITC.",
  reportTypeTax:
    "One row per month: your sales, your HST, ClassEasily fee + ITC, and net deposit — best for taxes and bank reconciliation.",
  reportTypeDetailed:
    "Per-booking rows with the same tax and fee columns as the monthly summary.",
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
