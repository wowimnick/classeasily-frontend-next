import { Suspense } from "react";
import ResetPasswordClient from "./_components/ResetPasswordClient";

export const metadata = {
  title: "Reset Password | Classeasily",
  description: "Set a new password for your Classeasily account.",
};

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
    <Suspense>
      <ResetPasswordWrapper params={params} />
    </Suspense>
  );
}
