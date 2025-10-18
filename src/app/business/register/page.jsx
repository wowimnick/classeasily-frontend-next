"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamically import the content with no SSR
const RegisterPageContent = dynamic(
  () => import("./_components/RegisterPageContent"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #f3f3f3",
              borderTop: "3px solid #ff385c",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ color: "#666", fontSize: "14px" }}>
            Loading registration form...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    ),
  }
);

const FormProvider = dynamic(
  () => import("./_components/FormContext").then((mod) => mod.FormProvider),
  { ssr: false }
);

export default function RegisterPage() {
  return (
    <FormProvider>
      <Suspense
        fallback={
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Loading...
          </div>
        }
      >
        <RegisterPageContent />
      </Suspense>
    </FormProvider>
  );
}
