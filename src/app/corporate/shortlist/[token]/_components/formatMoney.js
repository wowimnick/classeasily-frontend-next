export function formatMoney(cents, currency = "usd") {
  const n = Number(cents) || 0;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: (currency || "USD").toUpperCase(),
  }).format(n / 100);
}
