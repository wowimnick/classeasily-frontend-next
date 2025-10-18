// src/components/common/ClientOnlyWrapper.jsx

"use client"; // This is the most important line. It marks this as a Client Component.

import { useState, useEffect } from "react";

export default function ClientOnlyWrapper({ children }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null; // On the server, and before the first client render, render nothing.
  }

  // After mounting on the client, render the children.
  return <>{children}</>;
}
