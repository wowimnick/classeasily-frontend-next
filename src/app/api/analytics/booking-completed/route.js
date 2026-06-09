import { NextResponse } from "next/server";
import { captureBookingCompleted } from "@/lib/posthog-server";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      distinct_id: distinctIdSnake,
      distinctId,
      dedupe_id: dedupeIdSnake,
      dedupe_key: dedupeKeySnake,
      ...properties
    } = body || {};
    const dedupeKey = dedupeIdSnake || dedupeKeySnake;
    const distinctIdResolved = distinctIdSnake || distinctId;

    if (!dedupeKey) {
      return NextResponse.json({ ok: false, error: "missing dedupe_id" }, { status: 400 });
    }

    await captureBookingCompleted(distinctIdResolved, {
      ...properties,
      dedupe_key: dedupeKey,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
