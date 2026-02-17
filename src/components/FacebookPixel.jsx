"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const ALLOWED_HOSTS = ["classeasily.com", "www.classeasily.com"];

export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only run on production (classeasily.com), not on staging or localhost
    const host = typeof window !== "undefined" ? window.location?.hostname?.toLowerCase() : "";
    if (ALLOWED_HOSTS.includes(host)) {
      import("react-facebook-pixel")
        .then((x) => x.default)
        .then((ReactPixel) => {
          ReactPixel.init(process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID);
          ReactPixel.pageView();
        });
    }
  }, [pathname, searchParams]);

  return null;
}
