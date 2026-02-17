"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { shouldRunPixel, getMetaPixelTestEventCode } from "@/lib/metaPixel";

export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Production: always run. Staging: only when NEXT_PUBLIC_META_PIXEL_TEST_EVENT_CODE is set (never litter prod).
    const run = shouldRunPixel();
    // console.warn not stripped by next.config removeConsole (exclude: ['error','warn'])
    console.warn("[Meta Pixel] FacebookPixel effect: shouldRunPixel=", run, "pathname=", pathname);
    if (!run) return;

    import("react-facebook-pixel")
      .then((x) => x.default)
      .then((ReactPixel) => {
        ReactPixel.init(process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID);
        const testCode = getMetaPixelTestEventCode();
        if (testCode && typeof window !== "undefined" && window.fbq) {
          console.warn("[Meta Pixel] PageView sent with test_event_code (Test Events)");
          window.fbq("track", "PageView", {}, { test_event_code: testCode });
        } else {
          console.warn("[Meta Pixel] PageView sent (production)");
          ReactPixel.pageView();
        }
      });
  }, [pathname, searchParams]);

  return null;
}
