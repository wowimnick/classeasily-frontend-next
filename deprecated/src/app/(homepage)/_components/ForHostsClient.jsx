"use client";

import dynamic from "next/dynamic";

const ForHosts = dynamic(() => import("./ForHosts"), {
  ssr: false,
  loading: () => <div style={{ height: "500px" }} />,
});

export default function ForHostsClient() {
  return <ForHosts />;
}
