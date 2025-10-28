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

// Wrapper component that handles async params
async function ResetPasswordWrapper({ params }) {
  const resolvedParams = await params;
  return (
    <ResetPasswordClient
      uid={resolvedParams.uid}
      token={resolvedParams.token}
    />
  );
}

export default function ResetPasswordPage({ params }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordWrapper params={params} />
    </Suspense>
  );
}
