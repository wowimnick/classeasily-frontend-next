"use client";

import dynamic from "next/dynamic";
import { Component } from "react";
import { FindClassSkeleton } from "./FindClassSkeleton";

// Error Boundary for graceful error handling
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("FindClass Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "4rem 14rem",
            textAlign: "center",
            color: "#666",
          }}
        >
          <h3>Unable to load classes</h3>
          <p>Please refresh the page or try again later.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1.5rem",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Dynamically import FindClass with NO SSR and realistic skeleton
const FindClass = dynamic(() => import("./FindClass"), {
  ssr: false,
  loading: () => <FindClassSkeleton />,
});

// Client wrapper component that receives server data
export default function FindClassClientWrapper({
  initialClasses = [],
  initialNextPageUrl = null,
}) {
  return (
    <ErrorBoundary>
      <FindClass
        initialClasses={initialClasses}
        initialNextPageUrl={initialNextPageUrl}
      />
    </ErrorBoundary>
  );
}
