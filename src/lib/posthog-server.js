import { PostHog } from "posthog-node";

let posthogClient = null;

export function getPostHogClient() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!posthogClient) {
    posthogClient = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}

export async function captureBookingCompleted(distinctId, properties = {}) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  const client = getPostHogClient();
  if (!client) return;

  const { dedupe_key: dedupeKey, revenue, ...eventProps } = properties;
  const insertId = dedupeKey ? String(dedupeKey) : undefined;
  const resolvedDistinctId = distinctId || "anonymous";

  const sharedProps = {
    revenue,
    ...eventProps,
    ...(revenue != null ? { $value: revenue } : {}),
    product_type: eventProps.product_type || "class_booking",
  };

  client.capture({
    distinctId: resolvedDistinctId,
    event: "booking_completed",
    properties: sharedProps,
    ...(insertId ? { uuid: insertId } : {}),
  });

  client.capture({
    distinctId: resolvedDistinctId,
    event: "purchase",
    properties: sharedProps,
    ...(insertId ? { uuid: `purchase-${insertId}` } : {}),
  });

  await client.flush();
}
