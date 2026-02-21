/**
 * Tracks whether a payment intent was created in this document/session.
 * Used to avoid cancelling that PI when the checkout component remounts (e.g. React Strict Mode)
 * and load() runs again with the same sessionStorage.
 */

let paymentIntentCreatedThisSession = false;

export function getPaymentIntentCreatedThisSession() {
  return paymentIntentCreatedThisSession;
}

export function setPaymentIntentCreatedThisSession(value) {
  paymentIntentCreatedThisSession = !!value;
}
