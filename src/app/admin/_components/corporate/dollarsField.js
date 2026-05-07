/** USD dollars string/number to integer cents for API payloads */
export function dollarsToCents(value) {
  const s = String(value ?? "").replace(/[^0-9.]/g, "");
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Cents to dollars for controlled inputs (2 decimals) */
export function centsToDollarsInput(cents) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "";
  return (n / 100).toFixed(2);
}
