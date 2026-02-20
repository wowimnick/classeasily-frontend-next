// components/homepage/FooterSmart.jsx
"use client";

import FooterClient from "./FooterClient";

/**
 * Smart Footer component for use in Client Components
 *
 * This version renders without categories initially (locations only)
 * and is safe to use inside client components without causing fetch loops.
 *
 * Usage:
 *   import FooterSmart from "@/components/homepage/FooterSmart"
 *   <FooterSmart />
 *
 * For Server Components, use the regular Footer:
 *   import Footer from "@/components/homepage/Footer"
 *   <Footer />
 */
export default function FooterSmart() {
  // Render footer with empty categories (shows locations only)
  // This prevents any fetch loops while still providing a functional footer
  return <FooterClient collections={[]} />;
}

/**
 * Why this approach?
 *
 * 1. The footer's location data is static and doesn't need fetching
 * 2. Categories are a "nice to have" feature - the footer works without them
 * 3. No fetch loops = no performance issues
 * 4. Keeps the component simple and predictable
 *
 * If you need categories in a client component context:
 * - Fetch them at the page level and pass as props
 * - Or use the FooterWithCategories wrapper below
 */
