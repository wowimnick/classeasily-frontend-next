"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import ReactPixel from "react-facebook-pixel";

export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize Pixel
    // options: autoConfig: true, debug: false
    ReactPixel.init(process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID, null, {
      autoConfig: true,
      debug: process.env.NODE_ENV === "development",
    });

    // Track the initial page view
    ReactPixel.pageView();
  }, []);

  // Track PageView on route change
  useEffect(() => {
    ReactPixel.pageView();
  }, [pathname, searchParams]);

  return null;
}
