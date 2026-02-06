"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only run on classeasily.com, not on staging or localhost
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "classeasily.com"
    ) {
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
