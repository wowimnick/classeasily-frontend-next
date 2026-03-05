"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { shouldRunPixel } from "@/lib/metaPixel";

export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!shouldRunPixel()) return;

    import("react-facebook-pixel")
      .then((x) => x.default)
      .then((ReactPixel) => {
        ReactPixel.init(process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID);
        ReactPixel.pageView();
      });
  }, [pathname, searchParams]);

  return null;
}
