"use client";

import React from "react";
import FindClass from "./FindClass";

// Simple Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("FindClass Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "32px 24px",
            textAlign: "center",
            background: "#fafafa",
            borderRadius: 16,
            margin: "24px 0",
          }}
        >
          <p style={{ margin: "0 0 12px", color: "#374151", fontSize: 15 }}>
            We couldn&apos;t load featured classes right now.
          </p>
          <a
            href="/explore"
            style={{
              color: "#ff385c",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Browse all experiences
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function FindClassClientWrapper(props) {
  // Destructure the props coming from page.jsx
  const { initialClasses, initialNextPageUrl, title, subtitle, seeAllLink } =
    props;

  return (
    <ErrorBoundary>
      <FindClass
        // 1. Pass the Title and Subtitle!
        title={title}
        subtitle={subtitle}
        seeAllLink={seeAllLink}
        // 2. RENAME prop: FindClass expects 'classes', page sends 'initialClasses'
        classes={initialClasses}
        // 3. Pass other data
        nextPageUrl={initialNextPageUrl}
      />
    </ErrorBoundary>
  );
}
