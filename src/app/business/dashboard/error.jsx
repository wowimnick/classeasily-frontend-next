"use client";

import { useEffect } from "react";
import { captureRouteError } from "@/lib/capture-route-error";
import { Result, Button } from "antd";
import { AlertCircle } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    captureRouteError(error, "Dashboard error:");
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#f5f5f5",
      }}
    >
      <Result
        status="error"
        icon={<AlertCircle size={72} color="#ff4d4f" />}
        title="Something went wrong"
        subTitle={
          error?.message || "We couldn't load your dashboard. Please try again."
        }
        extra={[
          <Button type="primary" key="retry" onClick={reset}>
            Try Again
          </Button>,
          <Button
            key="home"
            onClick={() => (window.location.href = "/business")}
          >
            Go to Business Home
          </Button>,
        ]}
      />
    </div>
  );
}
