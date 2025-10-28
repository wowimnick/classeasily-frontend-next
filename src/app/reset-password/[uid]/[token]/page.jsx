import { Suspense } from "react";
import ResetPasswordClient from "./_components/ResetPasswordClient";

export const metadata = {
  title: "Reset Password | Classeasily",
  description: "Set a new password for your Classeasily account.",
};

function LoadingFallback() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <p>Loading...</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
