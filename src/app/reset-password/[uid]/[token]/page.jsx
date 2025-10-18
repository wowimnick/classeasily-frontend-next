import { Suspense } from "react";
import ResetPasswordClient from "./_components/ResetPasswordClient";

export const metadata = {
  title: "Reset Password | Classeasily",
  description: "Set a new password for your Classeasily account.",
};

// You can create a more sophisticated loading component if you wish
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
      {/* You can use your GlobalLoader component here if it's simple enough not to cause the same issue */}
      <p>Loading...</p>
    </div>
  );
}

export default function ResetPasswordPage({ params }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordClient uid={params.uid} token={params.token} />
    </Suspense>
  );
}
