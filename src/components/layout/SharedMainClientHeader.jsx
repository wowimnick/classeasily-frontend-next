"use client";

import Header from "@/components/header/Header.jsx";
import ImpersonationBanner from "@/components/header/ImpersonationBanner.jsx";

/**
 * This component acts as a "use client" boundary for the main Header.
 * It ensures that the Header and its child components, which rely on client-side
 * state and hooks, do not cause errors during Server-Side Rendering (SSR).
 *
 * It accepts any props and forwards them directly to the <Header> component,
 * making it a flexible and reusable wrapper.
 */
export default function SharedMainClientHeader(props) {
  return (
    <>
      <ImpersonationBanner />
      <Header {...props} />
    </>
  );
}
