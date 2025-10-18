"use client";

import { useEffect } from "react";
import { Button } from "antd";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <h2>Something went wrong!</h2>
      <Button type="primary" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
