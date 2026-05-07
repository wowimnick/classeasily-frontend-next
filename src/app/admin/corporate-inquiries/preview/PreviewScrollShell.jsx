"use client";

/**
 * Admin layout uses height:100vh + overflow:hidden so the dashboard can delegate
 * scrolling to inner panes. Full-page routes like this preview need their own
 * scroll container; otherwise content past the viewport is clipped with no scroll.
 */
export default function PreviewScrollShell({ children }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: "contain",
        backgroundColor: "#ffffff",
        zIndex: 2,
      }}
    >
      {children}
    </div>
  );
}
