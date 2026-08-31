"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { businessService } from "@/services/apiService";

/**
 * Unpaid SaaS signups (isActive false, no widget plan, not grandfathered)
 * go back to register. Paid or legacy_grandfathered businesses stay in.
 */
export default function PaidAccessGate({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await businessService.getOnboardingState();
      if (cancelled) return;
      if (result.success && result.data?.has_business) {
        const d = result.data;
        if (!d.is_active && !d.has_paid_subscription && !d.legacy_grandfathered) {
          router.replace("/business/register?step=pay");
          return;
        }
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) return null;
  return children;
}
