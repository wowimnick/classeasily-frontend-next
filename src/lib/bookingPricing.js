/**
 * Display-only tax estimate for UI before a payment intent exists.
 * Must stay aligned with `HST_RATE` in `backend/quickstart/payments/views.py`
 * (CreatePaymentIntentView). Final charged amounts always come from the API
 * (`subtotal`, `tax_amount`, `amount` on create/update payment intent).
 */
export const ESTIMATED_SALES_TAX_RATE = 0.13;

export function estimateTaxFromSubtotal(subtotalAfterDiscount) {
  const s = Number(subtotalAfterDiscount);
  if (!Number.isFinite(s) || s < 0) return 0;
  return Math.round(s * ESTIMATED_SALES_TAX_RATE * 100) / 100;
}

export function estimateTotalWithTax(subtotalAfterDiscount) {
  const s = Number(subtotalAfterDiscount);
  if (!Number.isFinite(s) || s < 0) return 0;
  return Math.round((s + estimateTaxFromSubtotal(s)) * 100) / 100;
}
